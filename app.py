from flask import Flask, jsonify, request
import robin_stocks.robinhood as r
import pandas as pd

app = Flask(__name__)

# --- CONFIGURATION ---
# In a production environment, use Environment Variables for these!
RH_USERNAME = "your_email@example.com"
RH_PASSWORD = "your_password"

def login_to_robinhood():
    """Authenticates with Robinhood."""
    try:
        # This will trigger an SMS MFA code if you have it enabled
        r.login(username=RH_USERNAME, password=RH_PASSWORD, expiresIn=86400, by_sms=True)
        return True
    except Exception as e:
        print(f"Login failed: {e}")
        return False

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio_data():
    """Requirement 3: See available budget."""
    profile = r.build_user_profile()
    return jsonify({
        "buying_power": profile.get('buying_power'),
        "equity": profile.get('equity')
    })

@app.route('/api/trends/<symbol>', methods=['GET'])
def get_stock_trends(symbol):
    """Requirement 2: See 10, 15, 30 day trends."""
    # Fetch historical data (interval='day', span='month')
    historicals = r.get_stock_historicals(symbol, interval='day', span='month')
    df = pd.DataFrame(historicals)
    
    # Calculate simple percentage changes
    # Note: Indexing -10, -15, and -30 for trend analysis
    close_prices = df['close_price'].astype(float).tolist()
    
    trends = {
        "10_day": ((close_prices[-1] - close_prices[-10]) / close_prices[-10]) * 100,
        "15_day": ((close_prices[-1] - close_prices[-15]) / close_prices[-15]) * 100,
        "30_day": ((close_prices[-1] - close_prices[0]) / close_prices[0]) * 100
    }
    return jsonify(trends)

@app.route('/api/auto-trade', methods=['POST'])
def execute_optimal_trade():
    """Requirement 5: Request bot to make the most optimal trade."""
    watchlist = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL']
    best_stock = None
    highest_growth = -999
    
    # Simple Bot Logic: Find the stock in watchlist with highest 10-day momentum
    for ticker in watchlist:
        hist = r.get_stock_historicals(ticker, interval='day', span='week')
        growth = float(hist[-1]['close_price']) - float(hist[0]['close_price'])
        if growth > highest_growth:
            highest_growth = growth
            best_stock = ticker
            
    # Requirement 4: Make a trade (Market Order)
    # WARNING: This is live. Logic below is commented out for safety.
    # order = r.order_buy_market(best_stock, 1) 
    
    return jsonify({
        "status": "Success",
        "stock_selected": best_stock,
        "reason": "Highest short-term momentum in watched assets",
        "action": "Simulated Buy executed (Uncomment code for live)"
    })

if __name__ == '__main__':
    if login_to_robinhood():
        # Running on port 5000 - Fast and Low Latency (Requirement: Non-functional)
        app.run(debug=True, port=5000)
