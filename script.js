const SUPABASE_URL = 'https://ecjyjhqotkavtajllxae.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM';
const RENDER_URL = 'https://tradebot-backend-4zh2.onrender.com';const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let initialPurchaseBalance = 12000.00; // Set your starting point here

// --- INITIALIZATION ---
window.onload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // If user "Remembered" Robinhood, go straight to dashboard
        if (localStorage.getItem('rh_connected') === 'true') {
            revealFinalDashboard();
        } else {
            showRobinhoodGate(); 
        }
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
};

// --- AUTH & NAVIGATION ---
async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        document.getElementById('auth-error').innerText = error.message;
    } else {
        showRobinhoodGate();
    }
}

function showRobinhoodGate() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('robinhood-modal').style.display = 'flex';
}

function revealFinalDashboard() {
    document.getElementById('robinhood-modal').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    
    // Start Services
    pingServer();
    loadHistoryFromSupabase();
    subscribeToTrades();
    
    // Heartbeat: Refresh every 60 seconds
    setInterval(() => {
        pingServer();
        loadHistoryFromSupabase();
    }, 60000);
}

// --- ROBINHOOD CONNECTION ---
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
            revealFinalDashboard();
        } else {
            document.getElementById('rh-error').innerText = result.message || "Failed.";
            connectBtn.innerText = "Connect Account";
        }
    } catch (err) {
        document.getElementById('rh-error').innerText = "Backend Offline.";
        connectBtn.innerText = "Retry Connection";
    }
}

// --- RISK & SAFETY LOGIC ---
function validateAndCheckSafety() {
    const currentText = document.getElementById('budgetText').innerText;
    const current = parseFloat(currentText.replace(/[$,]/g, '')) || 0;
    const userLimit = parseFloat(document.getElementById('userLimitInput').value) || 100;
    
    // Ceiling logic: Capped at 100% gain
    const ceiling = initialPurchaseBalance * (1 + Math.min(userLimit, 100) / 100);

    if (current >= ceiling) {
        document.getElementById('tradeBtn').disabled = true;
        document.getElementById('tradeBtn').classList.add('btn-disabled');
        document.getElementById('emergency-zone').style.display = 'block';
        document.getElementById('safetyStatus').innerText = "🛑 Profit Target Reached.";
    } else {
        document.getElementById('tradeBtn').disabled = false;
        document.getElementById('tradeBtn').classList.remove('btn-disabled');
        document.getElementById('emergency-zone').style.display = 'none';
        document.getElementById('safetyStatus').innerText = "✅ Monitoring limits...";
    }
    updateGoalProgress();
}

// --- UI UPDATES ---
function updateSyncTimestamp() {
    const syncElement = document.getElementById('lastSynced');
    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    syncElement.innerText = `Last synced: ${timeString}`;
    syncElement.style.color = "#10b981"; 
    setTimeout(() => { syncElement.style.color = "#94a3b8"; }, 1000);
}

function updateGoalProgress() {
    const current = parseFloat(document.getElementById('budgetText').innerText.replace(/[$,]/g, '')) || 0;
    const target = parseFloat(document.getElementById('targetInput').value) || 1;
    const percent = Math.min((current / target) * 100, 100);
    
    const bar = document.getElementById('goalProgressBar');
    bar.style.width = percent + '%';
    if (percent >= 100) bar.classList.add('goal-reached');
    else bar.classList.remove('goal-reached');
}
/**
 * Toggles the UI between Login and Sign Up modes
 */
function toggleAuthMode() {
    const title = document.getElementById('auth-title');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const toggleLink = document.getElementById('toggle-link');
    const toggleText = document.getElementById('toggle-text');
    const errorMsg = document.getElementById('auth-error');

    // Clear any existing errors
    errorMsg.innerText = "";

    if (loginBtn.style.display === 'none') {
        // Switch to Login Mode
        title.innerText = "🔐 TradeBot Access";
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'none';
        toggleText.innerText = "Don't have an account?";
        toggleLink.innerText = "Sign Up";
    } else {
        // Switch to Sign Up Mode
        title.innerText = "🚀 Create Your Account";
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'block';
        toggleText.innerText = "Already have an account?";
        toggleLink.innerText = "Login";
    }
}

/**
 * Handles account creation via Supabase
 */
async function handleSignUp() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    const signupBtn = document.getElementById('signupBtn');

    if (!email || !password) {
        errorMsg.innerText = "Please fill in both fields.";
        return;
    }

    signupBtn.innerText = "Creating...";
    signupBtn.disabled = true;

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        errorMsg.innerText = error.message;
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
    } else {
        // By default, Supabase sends a confirmation email
        alert("Success! Please check your email inbox to confirm your account before logging in.");
        toggleAuthMode(); // Switch back to login view for them
    }
}
