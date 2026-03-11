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
let retryTimer = null; // Global reference to the timer

function showOnSiteError(msg, retryAction) {
    const existingToast = document.querySelector('.toast-error');
    if (existingToast) existingToast.remove();
    if (retryTimer) clearInterval(retryTimer); // Reset any old countdowns

    const toast = document.createElement('div');
    toast.className = 'toast-error';
    
    let countdown = 5; // Start at 5 seconds

    // 1. Create the UI elements
    const text = document.createElement('span');
    text.innerHTML = `<strong>⚠️ Bot Alert:</strong> ${msg}`;
    
    const retryBtn = document.createElement('button');
    retryBtn.className = "btn-retry";
    retryBtn.innerText = `Retry in ${countdown}s`;
    
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = " &times;";
    closeBtn.className = "close-toast";

    // 2. Logic to handle the countdown
    retryTimer = setInterval(() => {
        countdown--;
        retryBtn.innerText = `Retry in ${countdown}s`;

        if (countdown <= 0) {
            clearInterval(retryTimer);
            toast.remove();
            retryAction(); // 3. Automatic Trigger
        }
    }, 1000);

    // 4. Manual override
    retryBtn.onclick = () => {
        clearInterval(retryTimer);
        toast.remove();
        retryAction();
    };

    closeBtn.onclick = () => {
        clearInterval(retryTimer);
        toast.remove();
    };

    toast.appendChild(text);
    toast.appendChild(retryBtn);
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
}
let retryCount = 0;
const MAX_RETRIES = 3;
let retryTimer = null;

async function triggerAutoTrade() {
    const statusMsg = document.getElementById('botStatus');
    statusMsg.innerText = retryCount > 0 ? `🤖 Retrying (${retryCount}/${MAX_RETRIES})...` : "🤖 Executing trade...";

    try {
        const response = await fetch('http://localhost:5000/api/trade', { method: 'POST' });
        const result = await response.json();

        if (!response.ok) {
            handleTradeError(result.message);
            return;
        }
        
        // SUCCESS: Reset the counter for the next time the user trades
        retryCount = 0;
        statusMsg.innerText = "✅ Trade Successful!";
        addToHistory(result.order.symbol, result.order.price);
        
    } catch (err) {
        handleTradeError("Connection lost. Bot might be waking up.");
    }
}

function handleTradeError(msg) {
    if (retryCount < MAX_RETRIES) {
        retryCount++;
        showOnSiteError(`${msg} (Attempt ${retryCount} of ${MAX_RETRIES})`, triggerAutoTrade, true);
    } else {
        // MAX RETRIES REACHED: Stop and ask for manual intervention
        retryCount = 0; // Reset for next manual attempt
        showOnSiteError("Max retries reached. Please check your Robinhood login or balance manually.", null, false);
    }
}

function showOnSiteError(msg, retryAction, allowAutoRetry) {
    const existingToast = document.querySelector('.toast-error');
    if (existingToast) existingToast.remove();
    if (retryTimer) clearInterval(retryTimer);

    const toast = document.createElement('div');
    toast.className = 'toast-error';
    
    const text = document.createElement('span');
    text.innerHTML = `<strong>⚠️ Alert:</strong> ${msg}`;
    toast.appendChild(text);

    if (allowAutoRetry && retryAction) {
        let countdown = 5;
        const retryBtn = document.createElement('button');
        retryBtn.className = "btn-retry";
        retryBtn.innerText = `Retry in ${countdown}s`;
        
        retryTimer = setInterval(() => {
            countdown--;
            retryBtn.innerText = `Retry in ${countdown}s`;
            if (countdown <= 0) {
                clearInterval(retryTimer);
                toast.remove();
                retryAction();
            }
        }, 1000);

        retryBtn.onclick = () => {
            clearInterval(retryTimer);
            toast.remove();
            retryAction();
        };
        toast.appendChild(retryBtn);
    }

    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = " &times;";
    closeBtn.className = "close-toast";
    closeBtn.onclick = () => {
        clearInterval(retryTimer);
        toast.remove();
    };
    toast.appendChild(closeBtn);
    document.body.appendChild(toast);
}
function exportToCSV() {
    // 1. Check if there is even any data to export
    if (tradeLog.length === 0) {
        alert("No trade history available to export.");
        return;
    }

    // 2. Define the CSV Headers
    const headers = ["Date/Time", "Stock Symbol", "Action", "Price ($)"];
    
    // 3. Convert the tradeLog array into CSV rows
    const csvContent = [
        headers.join(","), // Put headers at the top
        ...tradeLog.map(item => [
            `"${item.time}"`,   // Use quotes to handle spaces/commas in dates
            item.symbol,
            item.action,
            item.price
        ].join(","))
    ].join("\n");

    // 4. Create a "Blob" (the file data)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // 5. Create a hidden link to trigger the download
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `TradeBot_Export_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click(); // Programmatically click the link to start download
    document.body.removeChild(link); // Clean up
}
// Replace these with your actual Supabase credentials
const SUPABASE_URL = 'https://ecjyjhqotkavtajllxae.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
async function loadHistoryFromSupabase() {
    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching data:", error);
    } else {
        tradeLog = data; // Assign the cloud data to our local variable
        renderHistory();
    }
}

// Call this instead of the old localStorage logic
window.onload = () => {
    pingServer(); // Your existing wake-up call
    loadHistoryFromSupabase();
};
async function addToHistory(symbol, price) {
    const { data, error } = await supabase
        .from('trades')
        .insert([
            { symbol: symbol, price: price, action: 'BUY' }
        ]);

    if (error) {
        showOnSiteError("Cloud sync failed, but trade was recorded locally.");
    } else {
        // Refresh the local view
        loadHistoryFromSupabase();
    }
}
function subscribeToTrades() {
    supabase
        .channel('public:trades') // Create a channel
        .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'trades' 
        }, (payload) => {
            console.log('New trade detected!', payload.new);
            
            // 1. Add the new trade to our local array
            tradeLog.unshift(payload.new);
            
            // 2. Re-render the table instantly
            renderHistory();
            
            // 3. (Optional) Show a success toast
            showOnSiteSuccess(`Bot just bought ${payload.new.symbol}!`);
        })
        .subscribe();
}

// Update your window.onload to include the subscription
window.onload = () => {
    pingServer();
    loadHistoryFromSupabase();
    subscribeToTrades(); // <--- Start listening!
};
function showOnSiteSuccess(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast-success';
    toast.innerHTML = `<strong>✨ Realtime Update:</strong> ${msg}`;
    document.body.appendChild(toast);

    setTimeout(() => { toast.remove(); }, 4000);
}
// 1. Check current session on load
window.onload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        showDashboard();
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
};

// 2. The Login Function
async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');

    const { error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
    });

    if (error) {
        errorMsg.innerText = error.message;
    } else {
        showDashboard();
    }
}

// 3. Reveal Dashboard & Start Services
function showDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    
    // Start all your existing services
    pingServer();
    loadHistoryFromSupabase();
    subscribeToTrades();
}
window.onload = async () => {
    // 1. Ask Supabase: "Is there a saved session in this browser?"
    const { data: { session }, error } = await supabase.auth.getSession();

    if (session) {
        console.log("Welcome back!", session.user.email);
        showDashboard(); // User is already logged in, skip the gate
    } else {
        // No session found, show the login overlay
        document.getElementById('login-overlay').style.display = 'flex';
    }
};
// Add this anywhere in your script.js
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        showDashboard();
    }
    if (event === 'SIGNED_OUT') {
        // Force the app back to the login screen
        document.getElementById('login-overlay').style.display = 'flex';
        document.getElementById('dashboard-content').style.display = 'none';
    }
});

// 4. Add a Logout Option for safety
async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload(); // Refresh to lock the app again
}
