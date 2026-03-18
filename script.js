// --- CONFIGURATION ---
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
    
    // --- UI CLEANUP LOGIC ---
    // 1. Reset password visibility to 'hidden'
    const passwordInput = document.getElementById('auth-password');
    passwordInput.type = 'password';
    document.getElementById('eye-icon').innerText = '👁️';

    // 2. Clear any error messages
    errorMsg.innerHTML = "";
    document.getElementById('auth-email').style.borderColor = "#334155";

    // 3. Hide the Strength Meter (it should only show during Sign Up)
    const strengthMeter = document.getElementById('strength-meter-container');
    
    // --- TOGGLE LOGIC ---
    if (loginBtn.style.display === 'none') {
        // Switching to LOGIN MODE
        title.innerText = "🔐 TradeBot Access";
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'none';
        toggleText.innerText = "Don't have an account?";
        toggleLink.innerText = "Sign Up";
        strengthMeter.style.display = 'none'; // Ensure meter is hidden
    } else {
        // Switching to SIGN UP MODE
        title.innerText = "🚀 Create Your Account";
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'block';
        toggleText.innerText = "Already have an account?";
        toggleLink.innerText = "Login";
        // Meter will be shown by checkPasswordStrength() as the user types
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
// 1. Function to switch between "Login" and "Sign Up" screens
function toggleAuthMode() {
    // --- START PRO-TIP ADDITION ---
    // 1. Reset the password field to 'hidden' (dots)
    const passwordInput = document.getElementById('auth-password');
    passwordInput.type = 'password';
    
    // 2. Reset the eye icon to the default state
    const eyeIcon = document.getElementById('eye-icon');
    if (eyeIcon) eyeIcon.innerText = '👁️';

    // 3. Clear and hide the strength meter immediately
    const strengthBar = document.getElementById('strength-bar');
    if (strengthBar) strengthBar.style.width = '0%';
    
    const strengthMeter = document.getElementById('strength-meter-container');
    if (strengthMeter) strengthMeter.style.display = 'none';
    // --- END PRO-TIP ADDITION ---

    const title = document.getElementById('auth-title');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const toggleLink = document.getElementById('toggle-link');
    const toggleText = document.getElementById('toggle-text');

    if (loginBtn.style.display === 'none') {
        title.innerText = "🔐 TradeBot Access";
        loginBtn.style.display = 'block';
        signupBtn.style.display = 'none';
        toggleText.innerText = "Don't have an account?";
        toggleLink.innerText = "Sign Up";
    } else {
        title.innerText = "🚀 Create Your Account";
        loginBtn.style.display = 'none';
        signupBtn.style.display = 'block';
        toggleText.innerText = "Already have an account?";
        toggleLink.innerText = "Login";
    }
}

// 2. Function to register the user in Supabase
async function handleSignUp() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');

    const { data, error } = await supabase.auth.signUp({
        email: email,
        password: password,
    });

    if (error) {
        errorMsg.innerText = error.message;
    } else {
        alert("Success! Please check your email inbox to confirm your account before logging in.");
        toggleAuthMode(); // Send them back to the login screen
    }
}
// 1. Toggle View/Un-view Password
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('auth-password');
    const eyeIcon = document.getElementById('eye-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerText = '🙈'; // Icon for "Hide"
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerText = '👁️'; // Icon for "View"
    }
}

// 2. Password Strength Meter Logic
function checkPasswordStrength() {
    const password = document.getElementById('auth-password').value;
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    
    // Only show meter if we are in Sign Up mode
    const signupBtn = document.getElementById('signupBtn');
    document.getElementById('strength-meter-container').style.display = signupBtn.style.display === 'block' ? 'block' : 'none';

    let strength = 0;
    if (password.length > 7) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    bar.style.width = strength + '%';

    if (strength <= 25) {
        bar.style.backgroundColor = "#ef4444"; // Red
        text.innerText = "Weak (Needs numbers/caps)";
    } else if (strength <= 75) {
        bar.style.backgroundColor = "#f59e0b"; // Amber
        text.innerText = "Good";
    } else {
        bar.style.backgroundColor = "#10b981"; // Green
        text.innerText = "Strong Password";
    }
}
// 1. Email Format Validator
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 2. Updated Handle Sign Up
async function handleSignUp() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    const emailInput = document.getElementById('auth-email');

    // Reset styles
    errorMsg.innerHTML = "";
    emailInput.style.borderColor = "#334155";

    // Client-side Validation
    if (!isValidEmail(email)) {
        errorMsg.innerText = "Please enter a valid email address (e.g., name@gmail.com).";
        emailInput.style.borderColor = "#ef4444"; // Highlight red
        return;
    }

    if (password.length < 6) {
        errorMsg.innerText = "Password must be at least 6 characters.";
        return;
    }

    // Supabase Attempt
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        // Catch "User already registered" error
        if (error.message.includes("already registered") || error.status === 422) {
            errorMsg.innerHTML = `Account already exists. <a href="#" onclick="toggleAuthMode()" style="color: #3b82f6; text-decoration: underline;">Click here to Login instead.</a>`;
        } else {
            errorMsg.innerText = error.message;
        }
    } else {
        alert("Success! Check your email for a confirmation link.");
        toggleAuthMode();
    }
}
function validateEmailOnBlur() {
    const emailInput = document.getElementById('auth-email');
    if (emailInput.value && !isValidEmail(emailInput.value)) {
        emailInput.style.borderColor = "#ef4444";
    } else {
        emailInput.style.borderColor = "#334155";
    }
}
// 1. Toggle Password Visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('auth-password');
    const eyeIcon = document.getElementById('eye-icon');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerText = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerText = '👁️';
    }
}

// 2. Validate Email Format
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// 3. Visual Border Feedback for Email
function validateEmailOnBlur() {
    const emailInput = document.getElementById('auth-email');
    if (emailInput.value && !isValidEmail(emailInput.value)) {
        emailInput.style.borderColor = "#ef4444";
    } else {
        emailInput.style.borderColor = "#334155";
    }
}
window.onload = async () => {
    // 1. Check if Supabase has a logged-in user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
        // 2. If logged in, check if Robinhood is also connected
        if (localStorage.getItem('rh_connected') === 'true') {
            revealFinalDashboard(); // This shows the stocks and trade buttons
        } else {
            showRobinhoodGate(); // Shows the connect modal
        }
    } else {
        // 3. If no user, stay on the Login Overlay
        document.getElementById('login-overlay').style.display = 'flex';
    }
};
