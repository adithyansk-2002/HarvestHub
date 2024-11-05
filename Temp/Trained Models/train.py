import os
import numpy as np
import pandas as pd
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, mean_absolute_error
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

def preprocess_data_with_id(data, sequence_length, crop_id):
    #Preprocess data by scaling and creating sequences with crop identifiers.
    # Scale the price data to the range (0, 1)
    scaler = MinMaxScaler(feature_range=(0, 1))
    data_scaled = scaler.fit_transform(data[['price']])

    X, y = [], []
    # Create sequences of data for LSTM input
    for i in range(sequence_length, len(data_scaled)):
        # Extract a sequence of prices
        sequence = data_scaled[i-sequence_length:i, 0].reshape(-1, 1)
        # Create a sequence of crop IDs
        crop_id_sequence = np.full((sequence_length, 1), crop_id)
        # Combine price sequence and crop ID sequence
        sequence_with_id = np.hstack((sequence, crop_id_sequence))

        X.append(sequence_with_id)
        y.append(data_scaled[i, 0])

    return np.array(X), np.array(y), scaler

def build_multi_crop_lstm_model(input_shape):
    # Build an LSTM model with additional feature for crop identifier.
    model = Sequential([
        LSTM(units=50, return_sequences=True, input_shape=input_shape),  # First LSTM layer
        Dropout(0.2),  # Dropout for regularization
        LSTM(units=50, return_sequences=False),  # Second LSTM layer
        Dropout(0.2),  # Dropout for regularization
        Dense(units=1)  # Output layer
    ])
    model.compile(optimizer='adam', loss='mean_squared_error')  # Compile the model
    return model

# Load data from the combined CSV file
combined_file_path = os.path.join(data_directory, "C:/Users/DELL/Desktop/HarvestHub/Dataset/wfp_food_prices_ind.csv")
combined_df = pd.read_csv(combined_file_path)

# Initialize dictionaries to store models and scalers for each crop
models = {}
scalers = {}

# Train a separate model for each crop
for crop_name, crop_id in crop_to_id.items():
    # Filter data for the current crop
    crop_df = combined_df[combined_df['commodity'] == crop_name]
    
    # Check if there is enough data to train the model
    if 'price' not in crop_df.columns or len(crop_df) < sequence_length:
        print(f"Skipping {crop_name} due to insufficient data.")
        continue
    
    # Preprocess the data for the current crop
    X, y, scaler = preprocess_data_with_id(crop_df, sequence_length, crop_id)
    
    # Build and train the model for the current crop
    model = build_multi_crop_lstm_model((sequence_length, 2))
    model.fit(X, y, epochs=100, batch_size=32, validation_split=0.2, verbose=1)
    
    # Save the model and scaler for the current crop
    models[crop_name] = model
    scalers[crop_name] = scaler

    # Save the trained model to disk
    model.save(f'C:/Users/DELL/Desktop/HarvestHub/models/{crop_name}_model.keras')
    print(f"Model for {crop_name} saved successfully.")

def predict_future_prices(crop_name, sequence_length, future_steps):
    # Predict future prices for a specific crop.
    model = models[crop_name]
    scaler = scalers[crop_name]

    # Load the crop's data from CSV
    crop_df = pd.read_csv(os.path.join(data_directory, "C:/Users/DELL/Desktop/HarvestHub/Dataset/wfp_food_prices_ind.csv"))
    # Preprocess data
    X, y, _ = preprocess_data_with_id(crop_df, sequence_length, crop_to_id[crop_name])
    
    # Use the last sequence for prediction
    last_sequence = X[-1]
    future_predictions = []
    for _ in range(future_steps):
        # Predict the next price
        prediction = model.predict(last_sequence.reshape(1, sequence_length, 2))
        future_predictions.append(prediction[0, 0])
        
        # Update the sequence with the new prediction
        new_sequence = np.roll(last_sequence, -1, axis=0)
        new_sequence[-1, 0] = prediction[0, 0]
        last_sequence = new_sequence

    # Inverse transform the predictions to original scale
    future_predictions = scaler.inverse_transform(np.array(future_predictions).reshape(-1, 1))
    
    # Plot future predictions
    plt.figure(figsize=(10, 5))
    plt.plot(future_predictions, color='green', label='Future Predicted Price')
    plt.title(f"{crop_name} Future Price Prediction")
    plt.xlabel("Future Time Steps")
    plt.ylabel("Price")
    plt.legend()
    plt.show()

def evaluate_model(crop_name, sequence_length):
    # Evaluate the model's accuracy using test data.
    model = models[crop_name]
    scaler = scalers[crop_name]

    # Load the crop's data from CSV
    crop_df = pd.read_csv(os.path.join(data_directory, "C:/Users/DELL/Desktop/HarvestHub/Dataset/wfp_food_prices_ind.csv"))
    # Preprocess data
    X, y, _ = preprocess_data_with_id(crop_df, sequence_length, crop_to_id[crop_name])
    
    # Split data into training and test sets
    split_index = int(len(X) * 0.8)
    X_train, X_test = X[:split_index], X[split_index:]
    y_train, y_test = y[:split_index], y[split_index:]
    
    # Make predictions on the test set
    y_pred = model.predict(X_test)
    
    # Inverse transform the predictions and actual values
    y_pred_inverse = scaler.inverse_transform(y_pred)
    y_test_inverse = scaler.inverse_transform(y_test.reshape(-1, 1))
    
    # Calculate error metrics
    mse = mean_squared_error(y_test_inverse, y_pred_inverse)
    rmse = np.sqrt(mse)
    mae = mean_absolute_error(y_test_inverse, y_pred_inverse)
    
    # Print evaluation results
    print(f"Evaluation for {crop_name}:")
    print(f"Mean Squared Error (MSE): {mse}")
    print(f"Root Mean Squared Error (RMSE): {rmse}")
    print(f"Mean Absolute Error (MAE): {mae}")

# Example usage for predicting future prices of Rice
predict_future_prices('Rice', sequence_length, future_steps=30)

# Example usage for evaluating the model for Rice
evaluate_model('Rice', sequence_length)