// 1. INITIALIZATION
const SUPABASE_URL = 'https://ecjyjhqotkavtajllxae.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM';
const RENDER_URL = 'https://tradebot-backend-4zh2.onrender.com';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let tradeLog = [];
let retryCount = 0;
const MAX_RETRIES = 3;

// 2. AUTHENTICATION GATING
window.onload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        showDashboard();
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
};

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        errorMsg.innerText = "Access Denied: " + error.message;
    } else {
        showDashboard();
    }
}

function showDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    
    // Start Services only after login
    pingServer();
    loadHistoryFromSupabase();
    subscribeToTrades();
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

// 3. CORE TRADING LOGIC
async function triggerAutoTrade() {
    const statusMsg = document.getElementById('statusText');
    statusMsg.innerText = "🤖 Executing Trade...";

    try {
        const response = await fetch(`${RENDER_URL}/api/trade`, { method: 'POST' });
        const result = await response.json();

        if (!response.ok) {
            handleTradeError(result.message);
            return;
        }

        // Note: Supabase Realtime will handle updating the table automatically!
        statusMsg.innerText = "✅ Trade Successful!";
        retryCount = 0; 
    } catch (err) {
        handleTradeError("Server is waking up...");
    }
}

// 4. ERROR & RETRY ENGINE
function handleTradeError(msg) {
    if (retryCount < MAX_RETRIES) {
        retryCount++;
        showOnSiteError(`${msg} (Attempt ${retryCount}/${MAX_RETRIES})`, triggerAutoTrade, true);
    } else {
        retryCount = 0;
        showOnSiteError("Max retries reached. Check Robinhood manually.", null, false);
    }
}

// 5. SUPABASE DATA SYNC
async function loadHistoryFromSupabase() {
    const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error) {
        tradeLog = data;
        renderHistory();
    }
}

function subscribeToTrades() {
    supabase.channel('public:trades')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'trades' }, 
        payload => {
            tradeLog.unshift(payload.new);
            renderHistory();
        }).subscribe();
}

// 6. UI HELPERS (Health, Table, Toasts)
async function pingServer() {
    const dot = document.getElementById('serverStatus');
    try {
        const res = await fetch(`${RENDER_URL}/api/health`);
        dot.className = res.ok ? 'status-dot online' : 'status-dot offline';
    } catch {
        dot.className = 'status-dot offline';
    }
}

function renderHistory() {
    const tableBody = document.getElementById('historyBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = tradeLog.map(trade => `
        <tr>
            <td>${new Date(trade.created_at).toLocaleString()}</td>
            <td>${trade.symbol}</td>
            <td>${trade.action}</td>
            <td>$${trade.price}</td>
        </tr>
    `).join('');
}
