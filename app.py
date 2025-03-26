from flask import Flask, request, jsonify
from market_analyzer import MarketAnalyzer  # Importing the MarketAnalyzer class

app = Flask(__name__)
market_analyzer = MarketAnalyzer()

@app.route('/analyze', methods=['POST'])
def analyze_stock():
    try:
        data = request.get_json()
        stock_symbol = data.get('stock_symbol')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        
        if not stock_symbol or not start_date or not end_date:
            return jsonify({'error': 'Missing required parameters'}), 400
        
        result = market_analyzer.analyze_stock(stock_symbol, start_date, end_date)
        return jsonify({'analysis_result': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
