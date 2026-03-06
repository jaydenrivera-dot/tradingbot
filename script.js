// Mock Data representing Robinhood API response
const stocks = [
    { symbol: 'AAPL', price: 175.20, trend10: +2.5, trend30: +5.1 },
    { symbol: 'TSLA', price: 240.50, trend10: -1.2, trend30: +12.4 },
    { symbol: 'NVDA', price: 460.10, trend10: +8.3, trend30: +22.1 }
];

const stockList = document.getElementById('stockList');
const autoBtn = document.getElementById('autoTradeBtn');
const statusMsg = document.getElementById('botStatus');

// 1. Render Stocks with Trends
function displayStocks() {
    stockList.innerHTML = stocks.map(stock => `
        <div class="stock-card">
            <div>
                <strong>${stock.symbol}</strong>
                <p>$${stock.price.toFixed(2)}</p>
            </div>
            <div class="trends">
                <span class="trend-badge">10d: ${stock.trend10}%</span>
                <span class="trend-badge">30d: ${stock.trend30}%</span>
            </div>
            <button onclick="makeTrade('${stock.symbol}')" class="btn-trade">Trade</button>
        </div>
    `).join('');
}

// 2. Manual Trade Action
function makeTrade(symbol) {
    alert(`Manual trade interface opened for ${symbol}. Connecting to Robinhood...`);
}

// 3. Bot Logic: Auto-Trade (Requirement 5)
autoBtn.addEventListener('click', () => {
    statusMsg.innerText = "Analyzing market trends and trusted sources...";
    
    // Simulate latency for "research"
    setTimeout(() => {
        const bestStock = stocks.reduce((prev, current) => 
            (prev.trend10 > current.trend10) ? prev : current
        );
        
        statusMsg.innerText = `Optimization Complete! Bought ${bestStock.symbol} at $${bestStock.price}.`;
        statusMsg.style.color = "#22c55e";
    }, 1500);
});

// Initialize
displayStocks();
// Change this from localhost to your new Render URL
const response = await fetch('https://tradebot-backend.onrender.com/api/trade', { 
    method: 'POST',
    // ... rest of the code
// Add this to your script.js
async function pingServer() {
    const statusDot = document.getElementById('serverStatus');
    statusDot.className = 'status-dot loading'; // Show "loading" state
    
    try {
        const response = await fetch('https://your-render-url.onrender.com/api/health');
        if (response.ok) {
            statusDot.className = 'status-dot online'; // Green light
        }
    } catch (error) {
        statusDot.className = 'status-dot offline'; // Red light
    }
}

// Ping automatically when the page loads
window.onload = pingServer;
async function triggerAutoTrade() {
    const statusMsg = document.getElementById('botStatus');
    
    try {
        const response = await fetch('http://localhost:5000/api/trade', { method: 'POST' });
        const result = await response.json();

        if (!response.ok) {
            // This triggers if the backend sends a 500 error
            showOnSiteError(result.message);
            return;
        }

        statusMsg.innerText = "Trade Successful!";
    } catch (err) {
        // This triggers if the server is offline or unreachable
        showOnSiteError("Server Unreachable: The bot might be sleeping.");
    }
}

function showOnSiteError(msg) {
    // Create a toast notification element
    const toast = document.createElement('div');
    toast.className = 'toast-error';
    toast.innerHTML = `<strong>⚠️ Bot Alert:</strong> ${msg}`;
    
    document.body.appendChild(toast);

    // Automatically remove after 5 seconds
    setTimeout(() => { toast.remove(); }, 5000);
}
/**
 * Displays a persistent error toast with a Retry button.
 * @param {string} msg - The error message to display.
 * @param {Function} retryAction - The function to call when 'Retry' is clicked.
 */
function showOnSiteError(msg, retryAction) {
    // 1. Remove any existing error toasts to avoid clutter
    const existingToast = document.querySelector('.toast-error');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-error';
    
    // Create the text container
    const text = document.createElement('span');
    text.innerHTML = `<strong>⚠️ Bot Alert:</strong> ${msg}`;
    
    // 2. Create the Retry Button
    const retryBtn = document.createElement('button');
    retryBtn.innerText = "Retry Trade";
    retryBtn.className = "btn-retry";
    
    retryBtn.onclick = () => {
        toast.remove(); // Clear the error first
        retryAction();  // Re-trigger the trade
    };

    // 3. Create a Close Button (X) for dismissal
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = " &times;";
    closeBtn.className = "close-toast";
    closeBtn.onclick = () => toast.remove();

    toast.appendChild(text);
    toast.appendChild(retryBtn);
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
}

// Update your main trade function to pass itself as the retryAction
async function triggerAutoTrade() {
    const statusMsg = document.getElementById('botStatus');
    statusMsg.innerText = "🤖 Retrying trade...";

    try {
        const response = await fetch('http://localhost:5000/api/trade', { method: 'POST' });
        const result = await response.json();

        if (!response.ok) {
            // Pass the function name 'triggerAutoTrade' so the button knows what to do
            showOnSiteError(result.message, triggerAutoTrade);
            return;
        }
        
        // Success logic...
        statusMsg.innerText = "✅ Trade Successful!";
    } catch (err) {
        showOnSiteError("Connection lost. Your bot might be waking up.", triggerAutoTrade);
    }
}
