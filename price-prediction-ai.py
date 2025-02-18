import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import os
from datetime import datetime, timedelta

class MarketAnalyzer:
    def __init__(self, 
                 bid_model_path="bid_predictor.pkl",
                 price_model_path="price_predictor.pkl",
                 food_price_model_path="food_price_predictor.pkl"):
        """
        Initialize the Market Analyzer with multiple prediction models.
        """
        self.bid_model_path = bid_model_path
        self.price_model_path = price_model_path
        self.food_price_model_path = food_price_model_path
        self.bid_model = None
        self.price_model = None
        self.food_price_model = None
        self.label_encoders = {}
        
    def preprocess_food_data(self, df):
        """Preprocess food price data for training or prediction."""
        # Convert date to multiple features
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.month
        df['year'] = df['date'].dt.year
        df['day_of_week'] = df['date'].dt.dayofweek
        
        # Encode categorical variables
        categorical_columns = ['admin1', 'admin2', 'market', 'category', 'commodity', 'unit']
        
        for col in categorical_columns:
            if col in df.columns:
                if col not in self.label_encoders:
                    self.label_encoders[col] = LabelEncoder()
                    df[f'{col}_encoded'] = self.label_encoders[col].fit_transform(df[col].fillna('UNKNOWN'))
                else:
                    df[col] = df[col].apply(lambda x: x if x in set(self.label_encoders[col].classes_) else 'UNKNOWN')
                    df[f'{col}_encoded'] = self.label_encoders[col].transform(df[col])
        
        feature_columns = [
            'month', 'year', 'day_of_week',
            'latitude', 'longitude',
            'admin1_encoded', 'admin2_encoded', 'market_encoded',
            'category_encoded', 'commodity_encoded', 'unit_encoded'
        ]
        
        X = df[feature_columns]
        
        if 'price' in df.columns:
            y = df['price']
            return X, y
        return X

    def train_models(self, bid_data, price_data, food_price_path=None):
        """Train all prediction models with provided data."""
        # Train bid prediction model
        bid_df = pd.DataFrame(bid_data)
        X_bid = bid_df[['previous_bid', 'demand', 'supply', 'weather_index']]
        y_bid = bid_df['final_bid']
        
        self.bid_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.bid_model.fit(X_bid, y_bid)
        
        # Train price prediction model
        price_df = pd.DataFrame(price_data)
        X_price = price_df[['historical_price', 'demand_forecast', 'supply_forecast', 
                           'weather_index', 'market_sentiment', 'season_index']]
        y_price = price_df['final_price']
        
        self.price_model = RandomForestRegressor(n_estimators=100, random_state=42)
        self.price_model.fit(X_price, y_price)
        
        # Train food price model if data provided
        if food_price_path:
            food_df = pd.read_csv(food_price_path)
            X_food, y_food = self.preprocess_food_data(food_df)
            
            X_train, X_test, y_train, y_test = train_test_split(
                X_food, y_food, test_size=0.2, random_state=42
            )
            
            self.food_price_model = RandomForestRegressor(
                n_estimators=100,
                max_depth=20,
                min_samples_split=10,
                min_samples_leaf=5,
                random_state=42
            )
            self.food_price_model.fit(X_train, y_train)
        
        # Save all models
        self.save_models()
        
    def save_models(self):
        """Save all trained models to disk."""
        if self.bid_model:
            with open(self.bid_model_path, "wb") as file:
                pickle.dump(self.bid_model, file)
                
        if self.price_model:
            with open(self.price_model_path, "wb") as file:
                pickle.dump(self.price_model, file)
                
        if self.food_price_model:
            with open(self.food_price_model_path, "wb") as file:
                pickle.dump({
                    'model': self.food_price_model,
                    'encoders': self.label_encoders
                }, file)
    
    def load_models(self):
        """Load all trained models from disk."""
        try:
            if os.path.exists(self.bid_model_path):
                with open(self.bid_model_path, "rb") as file:
                    self.bid_model = pickle.load(file)
                    
            if os.path.exists(self.price_model_path):
                with open(self.price_model_path, "rb") as file:
                    self.price_model = pickle.load(file)
                    
            if os.path.exists(self.food_price_model_path):
                with open(self.food_price_model_path, "rb") as file:
                    saved_data = pickle.load(file)
                    self.food_price_model = saved_data['model']
                    self.label_encoders = saved_data['encoders']
                    
        except Exception as e:
            raise Exception(f"Error loading models: {str(e)}")
    
    def predict_bid(self, previous_bid, demand, supply, weather_index):
        """Make a bid prediction based on market parameters."""
        if self.bid_model is None:
            self.load_models()
            
        input_data = np.array([[previous_bid, demand, supply, weather_index]])
        return self.bid_model.predict(input_data)[0]
    
    def predict_price(self, historical_price, demand_forecast, supply_forecast,
                     weather_index, market_sentiment, season_index):
        """Make a general market price prediction."""
        if self.price_model is None:
            self.load_models()
            
        input_data = np.array([[
            historical_price, demand_forecast, supply_forecast,
            weather_index, market_sentiment, season_index
        ]])
        return self.price_model.predict(input_data)[0]
    
    def predict_food_price(self, features):
        """Predict food prices with confidence intervals."""
        if self.food_price_model is None:
            self.load_models()
            
        df = pd.DataFrame([features])
        X = self.preprocess_food_data(df)
        
        predictions = []
        for estimator in self.food_price_model.estimators_:
            predictions.append(estimator.predict(X)[0])
        
        mean_price = np.mean(predictions)
        std_price = np.std(predictions)
        confidence_interval = (
            mean_price - 1.96 * std_price,
            mean_price + 1.96 * std_price
        )
        
        return {
            'predicted_price': mean_price,
            'confidence_interval': confidence_interval,
            'uncertainty': std_price
        }
