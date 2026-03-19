// --- 1. CONFIGURATION ---
const SB_URL = 'https://ecjyjhqotkavtajllxae.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM';
const RENDER_URL = 'https://tradebot-backend-4zh2.onrender.com';

const dbClient = supabase.createClient(SB_URL, SB_KEY);

console.log("🚀 Dashboard Mode: Active");

// --- 2. INITIALIZATION ---
window.onload = async () => {
    // If Robinhood isn't connected, show the modal. Otherwise, stay on dashboard.
    if (localStorage.getItem('rh_connected') !== 'true') {
        showRobinhoodGate();
    } else {
        startDashboardServices();
    }
};

function startDashboardServices() {
    pingServer();
    // Add your data fetching here
    console.log("Monitoring Market Activity...");
}

// --- 3. NAVIGATION ---
function showRobinhoodGate() {
    document.getElementById('robinhood-modal').style.display = 'flex';
}

function handleLogout() {
    localStorage.removeItem('rh_connected');
    location.reload();
}

// --- 4. ROBINHOOD & TRADING ---
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

function validateAndCheckSafety() {
    const userLimit = parseFloat(document.getElementById('userLimitInput').value) || 100;
    document.getElementById('safetyStatus').innerText = `Safety set to ${userLimit}% profit.`;
}
