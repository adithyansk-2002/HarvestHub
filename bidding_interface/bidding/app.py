import sys
import codecs
import os
import subprocess
import random
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer)

from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
import numpy as np
import pandas as pd
import tensorflow as tf
from tensorflow.keras.models import load_model
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Get the absolute path to the current directory
current_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(current_dir, "second_model.keras")
dataset_path = os.path.join(current_dir, "dataset", "wfp_food_prices_ind.csv")

# Load the trained LSTM model
try:
    model = load_model(model_path)
    logger.info(f"Model loaded successfully from: {model_path}")
except Exception as e:
    logger.error(f"Error loading model: {str(e)}")
    raise

# Load CSV file
try:
    df = pd.read_csv(dataset_path, encoding='utf-8')
    logger.info(f"Dataset loaded successfully from: {dataset_path}")
except Exception as e:
    logger.error(f"Error loading dataset: {str(e)}")
    raise

# Convert date column to datetime format
df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")

# Normalize commodity names for case-insensitive matching
df["commodity"] = df["commodity"].str.strip().str.lower()

# Print available crops
logger.info("\nAvailable crops in the dataset:")
try:
    crops_list = sorted(df["commodity"].unique().tolist())
    logger.info(str(crops_list))
except UnicodeEncodeError:
    # Fallback printing method
    for crop in crops_list:
        try:
            logger.info(crop)
        except UnicodeEncodeError:
            logger.info(f"[Unprintable crop name: {crop.encode('ascii', 'replace').decode()}]")
logger.info("\n")

@app.route('/')
def home():
    user_type = request.args.get('type')
    room_id = request.args.get('roomId')
    
    if not user_type or not room_id:
        return "Missing parameters", 400
        
    if user_type == 'seller':
        return render_template("seller_bidding.html", room_id=room_id)
    elif user_type == 'buyer':
        return render_template("buyer_bidding.html", room_id=room_id)
    else:
        return "Invalid user type", 400

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
        logger.error(f"Error in prediction: {str(e)}")
        return jsonify({"error": f"An error occurred: {str(e)}"})

@app.route('/predict_bid', methods=['GET'])
def predict_bid():
    try:
        crop = request.args.get('crop')
        predicted_price = random.randint(1000, 5000)
        logger.info(f"Predicted bid for {crop}: {predicted_price}")
        return jsonify({"predicted_bid": predicted_price})
    except Exception as e:
        logger.error(f"Error in predict_bid: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/ping', methods=['GET'])
def ping():
    try:
        return jsonify({"status": "running"})
    except Exception as e:
        logger.error(f"Error in ping: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/start-flask', methods=['GET'])
def start_flask():
    try:
        # Get the absolute path to the virtual environment
        venv_path = os.path.join(os.getcwd(), "venv")
        if not os.path.exists(venv_path):
            logger.error("Virtual environment not found")
            return jsonify({"error": "Virtual environment not found. Please create it first."}), 500

        # Determine the Python executable path based on the platform
        if sys.platform == "win32":
            python_path = os.path.join(venv_path, "Scripts", "python.exe")
        else:
            python_path = os.path.join(venv_path, "bin", "python")

        if not os.path.exists(python_path):
            logger.error("Python executable not found in virtual environment")
            return jsonify({"error": "Python executable not found in virtual environment."}), 500

        # Start the Flask server
        process = subprocess.Popen(
            [python_path, "app.py"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NEW_CONSOLE if sys.platform == "win32" else 0
        )
        
        logger.info("Flask server started successfully")
        return jsonify({"status": "Flask started"}), 200
    except Exception as e:
        logger.error(f"Error starting Flask: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/seller/<room_id>')
def seller_bidding(room_id):
    return render_template("seller_bidding.html", room_id=room_id)

@app.route('/buyer/<room_id>')
def buyer_bidding(room_id):
    return render_template("buyer_bidding.html", room_id=room_id)

if __name__ == '__main__':
    try:
        logger.info("Starting Flask server...")
        app.run(host='127.0.0.1', port=5000, debug=True)
    except Exception as e:
        logger.error(f"Failed to start Flask server: {str(e)}")
        raise
