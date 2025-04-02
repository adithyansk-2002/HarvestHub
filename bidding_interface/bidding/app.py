import sys
import codecs
import os

sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

from flask import Flask, request, jsonify, render_template
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)

# Get the absolute path to the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "second_model.keras")
dataset_path = os.path.join(current_dir, "dataset", "wfp_food_prices_ind.csv")

# Load the trained LSTM model
try:
    model = load_model(model_path)
    print(f"Model loaded successfully from: {model_path}")
except Exception as e:
    print(f"Error loading model: {str(e)}")
    raise

# Load CSV file
try:
    df = pd.read_csv(dataset_path, encoding='utf-8')
    print(f"Dataset loaded successfully from: {dataset_path}")
except Exception as e:
    print(f"Error loading dataset: {str(e)}")
    raise

# Convert date column to datetime format
df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")

# Normalize commodity names for case-insensitive matching
df["commodity"] = df["commodity"].str.strip().str.lower()

# Print available crops
print("\nAvailable crops in the dataset:")
try:
    crops_list = sorted(df["commodity"].unique().tolist())
    print(str(crops_list).encode('utf-8').decode('utf-8'))
except UnicodeEncodeError:
    # Fallback printing method
    for crop in crops_list:
        try:
            print(crop)
        except UnicodeEncodeError:
            print(f"[Unprintable crop name: {crop.encode('ascii', 'replace').decode()}]")
print("\n")

@app.route('/')
def home():
    return render_template("biddingindex.html")

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        crop_name = data.get("crop", "").strip().lower()
        target_year = int(data.get("year", 0))

        if not crop_name or target_year <= 2000:
            return jsonify({"error": "Invalid input. Please enter a valid crop name and year after 2000."})

        if crop_name not in df["commodity"].unique():
            return jsonify({"error": f"Crop '{crop_name}' not found in the dataset. Please check the crop name."})

        crop_data = df[df["commodity"] == crop_name][["date", "price"]].dropna()
        crop_data = crop_data[crop_data["date"].dt.year < target_year]
        
        if len(crop_data) < 50:
            return jsonify({"error": "Not enough historical data for prediction."})

        crop_data = crop_data.tail(100)
        crop_data["year"] = crop_data["date"].dt.year
        
        scaler = MinMaxScaler()
        crop_data_scaled = scaler.fit_transform(crop_data[["price", "year"]])
        crop_data_scaled = np.reshape(crop_data_scaled, (1, crop_data_scaled.shape[0], 2))

        predictions = model.predict(crop_data_scaled)
        predicted_price = scaler.inverse_transform(
            np.hstack((predictions, np.full((predictions.shape[0], 1), target_year)))
        )[:, 0]

        return jsonify({"crop": crop_name.capitalize(), "year": target_year, "predicted_price": round(float(predicted_price[0]), 2)})
    
    except Exception as e:
        print(f"Error in prediction: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"})

if __name__ == '__main__':
    app.run(debug=True)
