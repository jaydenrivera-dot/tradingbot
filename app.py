import os
from flask import Flask, jsonify
from dotenv import load_dotenv
import robin_stocks.robinhood as r

# 1. Load the vault (the .env file)
load_dotenv()

app = Flask(__name__)

# 2. Retrieve credentials safely from memory
USER = os.getenv('RH_USERNAME')
PASS = os.getenv('RH_PASSWORD')

def secure_login():
    try:
        # Some accounts require multi-factor authentication (MFA)
        # robin_stocks will prompt you in the terminal the first time
        login = r.login(username=USER, password=PASS, expiresIn=86400, by_sms=True)
        return login
    except Exception as e:
        print(f"Login failed: {e}")
        return None

@app.route('/api/status', methods=['GET'])
def check_connection():
    session = secure_login()
    if session:
        return jsonify({"status": "Connected", "user": USER})
    return jsonify({"status": "Authentication Failed"}), 401

if __name__ == '__main__':
    app.run(debug=True)
@app.route('/api/health', methods=['GET'])
def health_check():
    # Just a simple response to say "I'm awake!"
    return jsonify({"status": "awake"}), 200
from flask import Flask, jsonify, request
from flask_cors import CORS
import logging

app = Flask(__name__)
CORS(app)

@app.route('/api/trade', methods=['POST'])
def execute_trade():
    try:
        # SIMULATION: This is where your Robinhood logic lives
        # We will manually trigger an error to test the alert
        raise Exception("Insufficient buying power for this trade.")
        
    except Exception as e:
        # Instead of emailing, we send the error back to the browser
        return jsonify({
            "status": "error",
            "message": str(e),
            "type": "Critical"
        }), 500 # 500 tells the browser "something went wrong"
import robin_stocks.robinhood as rh
from flask import Flask, request, jsonify

@app.route('/api/connect-rh', methods=['POST'])
def connect_robinhood():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    mfa_code = data.get('mfa')

    try:
        # If mfa_code is provided, try logging in with it
        if mfa_code:
            login = rh.login(username, password, mfa_code=mfa_code)
        else:
            login = rh.login(username, password)

        # Check if Robinhood is asking for MFA
        if login.get('detail') == 'mfa_required' or 'mfa_code' in str(login):
            return jsonify({"status": "mfa_required"}), 200

        # Success!
        return jsonify({"status": "success", "message": "Logged in"}), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 400
