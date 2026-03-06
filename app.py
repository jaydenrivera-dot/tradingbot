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
