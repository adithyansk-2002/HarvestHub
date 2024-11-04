import os
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt
import h5py

# Dictionary for mapping each crop name to a unique identifier
crop_to_id = {
    'Chickpeas': 0, 'Ghee (vanaspati)': 1, 'Lentils': 2, 'Lentils (masur)': 3, 'Lentils (moong)': 4,
    'Lentils (urad)': 5, 'Milk': 6, 'Milk (pasteurized)': 7, 'Oil (groundnut)': 8, 'Oil (mustard)': 9,
    'Oil (palm)': 10, 'Oil (soybean)': 11, 'Oil (sunflower)': 12, 'Onions': 13, 'Potatoes': 14,
    'Rice': 15, 'Salt (iodised)': 16, 'Sugar': 17, 'Sugar (jaggery/gur)': 18, 'Tea (black)': 19,
    'Tomatoes': 20, 'Wheat': 21, 'Wheat flour': 22
}

# Directory containing the CSV files
data_directory = 'data'  # Replace with your data directory path

# Define the sequence length for the LSTM model
sequence_length = 100  # Set this to the desired sequence length

# Preprocess data with crop identifier
def preprocess_data_with_id(data, sequence_length, crop_id):
    scaler = MinMaxScaler(feature_range=(0, 1))
    data_scaled = scaler.fit_transform(data[['price']])

    X, y = [], []
    for i in range(sequence_length, len(data_scaled)):
        sequence = data_scaled[i-sequence_length:i, 0].reshape(-1, 1)
        crop_id_sequence = np.full((sequence_length, 1), crop_id)
        sequence_with_id = np.hstack((sequence, crop_id_sequence))

        X.append(sequence_with_id)
        y.append(data_scaled[i, 0])

    X, y = np.array(X), np.array(y)
    return X, y, scaler

# Build LSTM model with additional feature for crop identifier
def build_multi_crop_lstm_model(input_shape):
    model = Sequential()
    model.add(LSTM(units=50, return_sequences=True, input_shape=input_shape))
    model.add(Dropout(0.2))
    model.add(LSTM(units=50, return_sequences=False))
    model.add(Dropout(0.2))
    model.add(Dense(units=1))
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model

# Load data from the combined CSV file
combined_file_path = os.path.join(data_directory, "C:/Users/DELL/Desktop/HarvestHub/Dataset/wfp_food_prices_ind.csv")
combined_df = pd.read_csv(combined_file_path)

# Initialize lists to store data
X_all = []
y_all = []
scalers = {}

# Preprocess data for each crop
for crop_name, crop_id in crop_to_id.items():
    # Filter data for the current crop
    crop_df = combined_df[combined_df['commodity'] == crop_name]
    
    # Debug: Print the number of rows for the current crop
    print(f"Processing {crop_name}: {len(crop_df)} rows")
    
    # Ensure the data has the necessary columns
    if 'price' not in crop_df.columns:
        print(f"Skipping {crop_name} as it does not contain 'price' column.")
        continue
    
    # Check if there are enough rows for the sequence length
    if len(crop_df) < sequence_length:
        print(f"Skipping {crop_name} as it has fewer rows than the sequence length.")
        continue
    
    # Preprocess each crop's data
    X, y, scaler = preprocess_data_with_id(crop_df, sequence_length, crop_id)
    
    # Debug: Print the shape of X and y
    print(f"Preprocessed {crop_name}: X shape {X.shape}, y shape {y.shape}")
    
    # Check if X and y are not empty
    if X.size == 0 or y.size == 0:
        print(f"No data for {crop_name} after preprocessing.")
        continue
    
    # Append preprocessed data to the lists
    X_all.append(X)
    y_all.append(y)
    scalers[crop_name] = scaler  # Save scaler for each crop

# Ensure there is data to concatenate
if X_all and y_all:
    X_all = np.concatenate(X_all, axis=0)
    y_all = np.concatenate(y_all, axis=0)
else:
    raise ValueError("No data available to concatenate. Please check your data files.")

# Build and train the model
model = build_multi_crop_lstm_model((sequence_length, 2))
model.fit(X_all, y_all, epochs=100, batch_size=32, validation_split=0.2, verbose=1)

# Save the preprocessed dataset
with h5py.File('dataset.h5', 'w') as hf:
    hf.create_dataset('X_all', data=X_all)
    hf.create_dataset('y_all', data=y_all)

# Save the trained model
model.save(r'C:\Users\DELL\Desktop\HarvestHub\model.keras')
print("Model saved successfully.")

# Prediction function for a specific crop
def predict_price_for_crop(model, crop_name, sequence_length):
    crop_id = crop_to_id[crop_name]
    scaler = scalers[crop_name]

    # Load the crop's data from CSV
    crop_df = pd.read_csv(os.path.join(data_directory, "C:/Users/DELL/Desktop/HarvestHub/Dataset/wfp_food_prices_ind.csv"))
    
    # Preprocess data
    X, y, _ = preprocess_data_with_id(crop_df, sequence_length, crop_id)
    predictions = model.predict(X)
    predictions = scaler.inverse_transform(predictions)
    y_actual = scaler.inverse_transform(y.reshape(-1, 1))

    rmse = np.sqrt(mean_squared_error(y_actual, predictions))
    print(f"{crop_name} RMSE: {rmse}")

    # Plot results
    plt.figure(figsize=(10, 5))
    plt.plot(y_actual, color='blue', label='Actual Price')
    plt.plot(predictions, color='red', label='Predicted Price')
    plt.title(f"{crop_name} Price Prediction")
    plt.xlabel("Time")
    plt.ylabel("Price")
    plt.legend()
    plt.show()

# Example usage for predicting price of Rice
predict_price_for_crop(model, 'Chickpeas', sequence_length)
predict_price_for_crop(model, 'Lentils', sequence_length)
predict_price_for_crop(model, 'Onions', sequence_length)
predict_price_for_crop(model, 'Potatoes', sequence_length)
predict_price_for_crop(model, 'Rice', sequence_length)
predict_price_for_crop(model, 'Sugar', sequence_length)
predict_price_for_crop(model, 'Tea (black)', sequence_length)
predict_price_for_crop(model, 'Tomatoes', sequence_length)
predict_price_for_crop(model, 'Wheat', sequence_length)