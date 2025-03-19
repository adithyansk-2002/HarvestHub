import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error
import joblib
import datetime
import logging

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class FarmProduceBiddingSystem:
    def __init__(self, historical_data_path=None, market_data_path=None):
        """
        Initialize the AI-based farm produce bidding system.
        
        Parameters:
        - historical_data_path: Path to historical transaction data
        - market_data_path: Path to current market data
        """
        self.historical_data = None
        self.market_data = None
        self.price_model = None
        self.scaler = StandardScaler()
        
        # Load data if provided
        if historical_data_path:
            self.load_historical_data(historical_data_path)
        if market_data_path:
            self.load_market_data(market_data_path)
    
    def load_historical_data(self, file_path):
        """Load historical transaction data from CSV or database."""
        try:
            self.historical_data = pd.read_csv(file_path)
            logger.info(f"Loaded historical data with {len(self.historical_data)} records")
        except Exception as e:
            logger.error(f"Error loading historical data: {e}")
            raise
    
    def load_market_data(self, file_path):
        """Load current market data from CSV or database."""
        try:
            self.market_data = pd.read_csv(file_path)
            logger.info(f"Loaded market data with {len(self.market_data)} records")
        except Exception as e:
            logger.error(f"Error loading market data: {e}")
            raise
    
    def preprocess_data(self):
        """Prepare data for model training."""
        if self.historical_data is None:
            raise ValueError("Historical data not loaded. Call load_historical_data first.")
        
        # Example features to consider:
        # - Product type
        # - Quality grade
        # - Quantity
        # - Season
        # - Previous prices
        # - Market demand
        # - Weather conditions
        
        # For this example, we assume these columns exist in historical_data
        features = [
            'product_type', 'quality_grade', 'quantity_kg', 
            'season', 'weather_condition', 'market_demand'
        ]
        
        # One-hot encode categorical features
        data_processed = pd.get_dummies(
            self.historical_data, 
            columns=['product_type', 'quality_grade', 'season', 'weather_condition']
        )
        
        # Split into features and target
        X = data_processed.drop(['final_price', 'transaction_date'], axis=1, errors='ignore')
        y = data_processed['final_price']
        
        # Scale numerical features
        numerical_features = ['quantity_kg', 'market_demand']
        X[numerical_features] = self.scaler.fit_transform(X[numerical_features])
        
        return X, y
    
    def train_price_prediction_model(self):
        """Train the AI model to predict initial prices."""
        logger.info("Training price prediction model...")
        
        X, y = self.preprocess_data()
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Using Random Forest for price prediction
        self.price_model = RandomForestRegressor(
            n_estimators=100, 
            max_depth=10,
            random_state=42
        )
        
        self.price_model.fit(X_train, y_train)
        
        # Evaluate model
        y_pred = self.price_model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        logger.info(f"Model trained. Test MAE: {mae:.2f}")
        
        # Feature importance analysis
        feature_importance = pd.DataFrame({
            'feature': X.columns,
            'importance': self.price_model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        logger.info("Top 5 important features:")
        logger.info(feature_importance.head(5))
        
        return mae
    
    def save_model(self, file_path):
        """Save the trained model to disk."""
        if self.price_model is None:
            raise ValueError("No model to save. Train model first.")
        
        joblib.dump({
            'model': self.price_model,
            'scaler': self.scaler
        }, file_path)
        logger.info(f"Model saved to {file_path}")
    
    def load_model(self, file_path):
        """Load a trained model from disk."""
        try:
            saved_data = joblib.load(file_path)
            self.price_model = saved_data['model']
            self.scaler = saved_data['scaler']
            logger.info(f"Model loaded from {file_path}")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            raise
    
    def prepare_prediction_input(self, produce_data):
        """
        Prepare input data for price prediction.
        
        Parameters:
        - produce_data: Dictionary containing information about the produce
        """
        # Create a dataframe with one row
        input_df = pd.DataFrame([produce_data])
        
        # One-hot encode categorical features
        input_processed = pd.get_dummies(
            input_df, 
            columns=['product_type', 'quality_grade', 'season', 'weather_condition']
        )
        
        # Add missing columns that might be in the training data but not in input
        if self.price_model is not None:
            # Get feature names from the model
            if hasattr(self.price_model, 'feature_names_in_'):
                for feature in self.price_model.feature_names_in_:
                    if feature not in input_processed.columns:
                        input_processed[feature] = 0
                
                # Reorder columns to match the model's expected input
                input_processed = input_processed[self.price_model.feature_names_in_]
        
        # Scale numerical features
        numerical_features = ['quantity_kg', 'market_demand']
        for feature in numerical_features:
            if feature in input_processed.columns:
                input_processed[feature] = self.scaler.transform(input_processed[[feature]])
        
        return input_processed
    
    def predict_initial_price(self, produce_data):
        """
        Predict the initial price for a given produce.
        
        Parameters:
        - produce_data: Dictionary with produce information
        
        Returns:
        - predicted_price: The AI-predicted initial price
        """
        if self.price_model is None:
            raise ValueError("No model available. Train or load a model first.")
        
        # Prepare input data
        input_processed = self.prepare_prediction_input(produce_data)
        
        # Make prediction
        predicted_price = self.price_model.predict(input_processed)[0]
        
        # Add market adjustment based on current conditions
        if self.market_data is not None:
            market_adjustment = self.calculate_market_adjustment(produce_data)
            predicted_price *= (1 + market_adjustment)
        
        logger.info(f"Predicted initial price for {produce_data['product_type']}: ${predicted_price:.2f}")
        return predicted_price
    
    def calculate_market_adjustment(self, produce_data):
        """Calculate market adjustment factor based on current market conditions."""
        # This is a simplified example
        # In a real system, this would include more complex analysis
        
        product_type = produce_data['product_type']
        
        # Filter market data for the specific product
        product_market = self.market_data[self.market_data['product_type'] == product_type]
        
        if len(product_market) == 0:
            logger.warning(f"No market data found for {product_type}")
            return 0
        
        # Example adjustment calculation:
        # If current demand is high, increase price
        # If current supply is high, decrease price
        current_demand = product_market['demand_index'].values[0]
        current_supply = product_market['supply_index'].values[0]
        
        # Simple adjustment formula: (demand - supply) / 100
        adjustment = (current_demand - current_supply) / 100
        
        logger.info(f"Market adjustment for {product_type}: {adjustment:.2f}")
        return adjustment
    
    def evaluate_bid(self, produce_data, bid_price, seller_min_price):
        """
        Evaluate if a bid creates a win-win situation.
        
        Parameters:
        - produce_data: Dictionary with produce information
        - bid_price: Current bid price
        - seller_min_price: Seller's minimum acceptable price
        
        Returns:
        - Dictionary with evaluation results and recommendation
        """
        # Get predicted fair market price
        predicted_price = self.predict_initial_price(produce_data)
        
        # Calculate the benefit for buyer and seller
        buyer_benefit = (predicted_price - bid_price) / predicted_price
        seller_benefit = (bid_price - seller_min_price) / seller_min_price if seller_min_price > 0 else 0
        
        # Determine if this is a win-win situation
        # Win-win means both parties benefit at least a minimum threshold
        min_benefit_threshold = 0.05  # 5% minimum benefit
        is_win_win = (buyer_benefit >= min_benefit_threshold and seller_benefit >= min_benefit_threshold)
        
        # Calculate overall deal score (0-100)
        deal_score = (buyer_benefit + seller_benefit) * 50
        deal_score = min(100, max(0, deal_score))
        
        # Generate recommendation
        if is_win_win:
            recommendation = "ACCEPT"
            reason = "This bid creates value for both parties."
        elif buyer_benefit < min_benefit_threshold and seller_benefit < min_benefit_threshold:
            recommendation = "REJECT"
            reason = "This bid does not create enough value for either party."
        elif buyer_benefit < min_benefit_threshold:
            recommendation = "NEGOTIATE"
            reason = "This bid favors the seller too heavily."
        else:
            recommendation = "NEGOTIATE"
            reason = "This bid favors the buyer too heavily."
        
        evaluation = {
            'predicted_price': predicted_price,
            'bid_price': bid_price,
            'buyer_benefit_pct': buyer_benefit * 100,
            'seller_benefit_pct': seller_benefit * 100,
            'is_win_win': is_win_win,
            'deal_score': deal_score,
            'recommendation': recommendation,
            'reason': reason
        }
        
        logger.info(f"Bid evaluation for {produce_data['product_type']}: {recommendation}")
        return evaluation
    
    def run_bidding_session(self, produce_data, seller_min_price, max_rounds=5):
        """
        Run a complete bidding session in real-time.
        
        Parameters:
        - produce_data: Dictionary with produce information
        - seller_min_price: Seller's minimum acceptable price
        - max_rounds: Maximum number of bidding rounds
        
        Returns:
        - Dictionary with bidding session results
        """
        # Start with the AI-predicted initial price
        initial_price = self.predict_initial_price(produce_data)
        current_bid = initial_price * 0.9  # Start slightly below predicted price
        
        logger.info(f"Starting bidding session for {produce_data['product_type']}")
        logger.info(f"Initial price: ${initial_price:.2f}, Seller minimum: ${seller_min_price:.2f}")
        
        bidding_history = []
        final_result = None
        
        for round_num in range(1, max_rounds + 1):
            # Evaluate current bid
            evaluation = self.evaluate_bid(produce_data, current_bid, seller_min_price)
            bidding_history.append({
                'round': round_num,
                'bid_price': current_bid,
                'evaluation': evaluation
            })
            
            # Check if we have a win-win situation
            if evaluation['is_win_win']:
                final_result = {
                    'status': 'DEAL',
                    'final_price': current_bid,
                    'rounds': round_num
                }
                logger.info(f"Deal reached in round {round_num} at ${current_bid:.2f}")
                break
            
            # Adjust bid based on evaluation
            if evaluation['recommendation'] == 'NEGOTIATE':
                # Move bid closer to predicted price
                if current_bid < initial_price:
                    # Increase bid if too low
                    current_bid = current_bid + (initial_price - current_bid) * 0.3
                else:
                    # Decrease bid if too high
                    current_bid = current_bid - (current_bid - initial_price) * 0.3
                
                logger.info(f"Round {round_num}: Adjusted bid to ${current_bid:.2f}")
            else:
                # Reject scenario - exit bidding
                final_result = {
                    'status': 'NO DEAL',
                    'final_price': None,
                    'rounds': round_num
                }
                logger.info(f"No deal possible, ending after round {round_num}")
                break
        
        # If we reached max rounds without a deal
        if final_result is None:
            final_result = {
                'status': 'TIMEOUT',
                'final_price': None,
                'rounds': max_rounds
            }
            logger.info(f"Max rounds reached without deal")
        
        # Compile session results
        session_results = {
            'product': produce_data['product_type'],
            'quantity': produce_data['quantity_kg'],
            'quality': produce_data['quality_grade'],
            'initial_price': initial_price,
            'seller_min_price': seller_min_price,
            'bidding_history': bidding_history,
            'result': final_result,
            'timestamp': datetime.datetime.now().isoformat()
        }
        
        return session_results


# Example usage
if __name__ == "__main__":
    # Initialize the bidding system
    bidding_system = FarmProduceBiddingSystem(
        historical_data_path="historical_transactions.csv",
        market_data_path="current_market_conditions.csv"
    )
    
    # Train the price prediction model
    bidding_system.train_price_prediction_model()
    
    # Save the trained model
    bidding_system.save_model("farm_produce_pricing_model.joblib")
    
    # Example produce data
    sample_produce = {
        'product_type': 'organic_apples',
        'quality_grade': 'premium',
        'quantity_kg': 500,
        'season': 'fall',
        'weather_condition': 'good',
        'market_demand': 80
    }
    
    # Get predicted initial price
    predicted_price = bidding_system.predict_initial_price(sample_produce)
    print(f"Predicted initial price: ${predicted_price:.2f}")
    
    # Run a bidding session
    seller_min_price = predicted_price * 0.85  # Example: seller's minimum is 85% of predicted
    session_results = bidding_system.run_bidding_session(sample_produce, seller_min_price)
    
    # Print results
    print("\nBidding Session Results:")
    print(f"Product: {session_results['product']}")
    print(f"Initial Price: ${session_results['initial_price']:.2f}")
    print(f"Result: {session_results['result']['status']}")
    if session_results['result']['final_price']:
        print(f"Final Price: ${session_results['result']['final_price']:.2f}")
    print(f"Rounds: {session_results['result']['rounds']}")