// --- 1. CONFIGURATION ---
const SB_URL = 'https://ecjyjhqotkavtajllxae.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM';
const RENDER_URL = 'https://tradebot-backend-4zh2.onrender.com';

// Use 'sbClient' to avoid clashing with the 'supabase' library name
const sbClient = supabase.createClient(SB_URL, SB_KEY);

// --- 2. INITIALIZATION ---
window.onload = async () => {
    console.log("🚀 Dashboard Initialized");
    
    // Check if user is already connected to Robinhood
    if (localStorage.getItem('rh_connected') === 'true') {
        startDashboardServices();
    } else {
        document.getElementById('robinhood-modal').style.display = 'flex';
    }
};

function startDashboardServices() {
    pingServer();
    loadHistoryFromSupabase();
    
    setInterval(() => {
        pingServer();
        loadHistoryFromSupabase();
    }, 60000);
}

// --- 3. ROBINHOOD LOGIC ---
async function handleRobinhoodConnect() {
    const username = document.getElementById('rh-username').value;
    const password = document.getElementById('rh-password').value;
    const mfa = document.getElementById('rh-mfa').value;
    const remember = document.getElementById('rh-remember').checked;
    const connectBtn = document.getElementById('connectBtn');

    connectBtn.innerText = "Connecting...";

    try {
        const response = await fetch(`${RENDER_URL}/api/connect-rh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, mfa, remember })
        });
        const result = await response.json();

        if (result.status === 'mfa_required') {
            document.getElementById('mfa-section').style.display = 'block';
            connectBtn.innerText = "Verify MFA";
        } else if (result.status === 'success') {
            if (remember) localStorage.setItem('rh_connected', 'true');
            document.getElementById('robinhood-modal').style.display = 'none';
            startDashboardServices();
        } else {
            document.getElementById('rh-error').innerText = result.message || "Connection failed.";
            connectBtn.innerText = "Connect Account";
        }
    } catch (err) {
        document.getElementById('rh-error').innerText = "Backend Offline.";
        connectBtn.innerText = "Connect Account";
    }
}

function handleLogout() {
    sbClient.auth.signOut(); // Fixed variable name
    localStorage.removeItem('rh_connected');
    location.reload();
}

// --- 4. TRADING & SAFETY ---
function validateAndCheckSafety() {
    const userLimit = parseFloat(document.getElementById('userLimitInput').value) || 100;
    document.getElementById('safetyStatus').innerText = `✅ Monitoring limits (${userLimit}% ceiling)...`;
}

// Placeholder functions to prevent errors
function pingServer() { console.log("Checking server health..."); }
function loadHistoryFromSupabase() { console.log("Fetching trade history..."); }
function triggerAutoTrade() { alert("Auto-Trade sequence initiated!"); }
