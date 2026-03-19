// --- 1. CONFIGURATION ---
// Replace the URL below with your actual Supabase Project URL from your dashboard
const SUPABASE_URL = 'https://ecjyjhqotkavtajllxae.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM';
const RENDER_URL = 'https://tradebot-backend-4zh2.onrender.com';
// --- 1. CONFIGURATION ---
// We are using 'myBotDB' to make sure it doesn't conflict with anything else
const myBotDB = supabase.createClient('https://ecjyjhqotkavtajllxae.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM');

console.log("🚀 Script loaded successfully!"); // This will prove the file updated

// --- 2. INITIALIZATION ---
window.onload = async () => {
    // Note: We use 'myBotDB' now
    const { data: { session } } = await myBotDB.auth.getSession();
    
    if (session) {
        if (localStorage.getItem('rh_connected') === 'true') {
            revealFinalDashboard();
        } else {
            showRobinhoodGate(); 
        }
    } else {
        document.getElementById('login-overlay').style.display = 'flex';
    }
};
// --- 3. AUTHENTICATION LOGIC ---

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');

    const { error } = await myBotDB.auth.signInWithPassword({ email, password });
    
    if (error) {
        errorMsg.innerText = error.message;
    } else {
        showRobinhoodGate();
    }
}

async function handleSignUp() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    const emailInput = document.getElementById('auth-email');

    errorMsg.innerHTML = "";
    emailInput.style.borderColor = "#334155";

    // Validation
    if (!isValidEmail(email)) {
        errorMsg.innerText = "Please enter a valid email address.";
        emailInput.style.borderColor = "#ef4444";
        return;
    }

    if (password.length < 6) {
        errorMsg.innerText = "Password must be at least 6 characters.";
        return;
    }

    const { data, error } = await myBotDB.auth.signUp({ email, password });

    if (error) {
        if (error.message.includes("already registered") || error.status === 422) {
            errorMsg.innerHTML = `Account exists. <a href="#" onclick="toggleAuthMode()" style="color: #3b82f6; text-decoration: underline;">Login instead.</a>`;
        } else {
            errorMsg.innerText = error.message;
        }
    } else {
        alert("Check your email for a confirmation link!");
        toggleAuthMode();
    }
}

function handleLogout() {
    supabase.auth.signOut();
    localStorage.removeItem('rh_connected');
    location.reload();
}

// --- 4. NAVIGATION & UI TOGGLES ---

function showRobinhoodGate() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('robinhood-modal').style.display = 'flex';
}

function revealFinalDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('robinhood-modal').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    
    // Start Background Services
    pingServer();
    loadHistoryFromSupabase();
    
    // Refresh loop every 60s
    setInterval(() => {
        pingServer();
        loadHistoryFromSupabase();
    }, 60000);
}

function toggleAuthMode() {
    function toggleAuthMode() {
    console.log("Toggle function was clicked!"); // This will show up in your Console
    
    const title = document.getElementById('auth-title');
    // ... the rest of your code
    const title = document.getElementById('auth-title');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const toggleLink = document.getElementById('toggle-link');
    const toggleText = document.getElementById('toggle-text');
    const authCard = document.querySelector('.auth-card'); // Select the card
   
    // --- TRIGGER ANIMATION ---
    authCard.classList.remove('fade-in'); // Remove first
    void authCard.offsetWidth;            // "Magic" line to reset the animation
    authCard.classList.add('fade-in');    // Re-add to play it again
    
    // Reset inputs
    document.getElementById('auth-password').type = 'password';
    document.getElementById('eye-icon').innerText = '👁️';
    document.getElementById('strength-meter-container').style.display = 'none';

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

// --- 5. SECURITY & UTILS ---

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

function checkPasswordStrength() {
    const password = document.getElementById('auth-password').value;
    const bar = document.getElementById('strength-bar');
    const text = document.getElementById('strength-text');
    const signupBtn = document.getElementById('signupBtn');

    if (signupBtn.style.display !== 'block') return; // Only show for Sign Up
    
    document.getElementById('strength-meter-container').style.display = 'block';
    let strength = 0;
    if (password.length > 7) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    bar.style.width = strength + '%';
    bar.style.backgroundColor = strength <= 25 ? "#ef4444" : strength <= 75 ? "#f59e0b" : "#10b981";
    text.innerText = strength <= 25 ? "Weak" : strength <= 75 ? "Good" : "Strong";
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmailOnBlur() {
    const emailInput = document.getElementById('auth-email');
    emailInput.style.borderColor = (emailInput.value && !isValidEmail(emailInput.value)) ? "#ef4444" : "#334155";
}

// --- 6. ROBINHOOD & TRADING ---

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
    }
}

function validateAndCheckSafety() {
    const currentText = document.getElementById('budgetText').innerText;
    const current = parseFloat(currentText.replace(/[$,]/g, '')) || 0;
    const userLimit = parseFloat(document.getElementById('userLimitInput').value) || 100;
    
    const ceiling = initialPurchaseBalance * (1 + Math.min(userLimit, 100) / 100);

    if (current >= ceiling) {
        document.getElementById('tradeBtn').disabled = true;
        document.getElementById('emergency-zone').style.display = 'block';
        document.getElementById('safetyStatus').innerText = "🛑 Profit Target Reached.";
    } else {
        document.getElementById('tradeBtn').disabled = false;
        document.getElementById('emergency-zone').style.display = 'none';
        document.getElementById('safetyStatus').innerText = "✅ Monitoring limits...";
    }
}
/**
 * Handles the "Create Account" process using Supabase Auth
 */
async function handleSignUp() {
    // 1. Grab values from the input fields
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    const signupBtn = document.getElementById('signupBtn');

    // 2. Clear previous errors and show "Loading" state
    errorMsg.innerHTML = "";
    signupBtn.innerText = "Creating Account...";
    signupBtn.disabled = true;

    // 3. Basic Validation
    if (!isValidEmail(email)) {
        errorMsg.innerText = "Please enter a valid email address.";
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
        return;
    }

    if (password.length < 6) {
        errorMsg.innerText = "Password must be at least 6 characters.";
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
        return;
    }

    try {
        // 4. Call Supabase to create the user
        // Note: We use '_supabase' to avoid the naming conflict error
        const { data, error } = await myBotDB.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            // Check if the user already exists
            if (error.message.includes("already registered") || error.status === 422) {
                errorMsg.innerHTML = `Account already exists. <a href="#" onclick="toggleAuthMode()" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">Login instead.</a>`;
            } else {
                errorMsg.innerText = error.message;
            }
            signupBtn.innerText = "Create Account";
            signupBtn.disabled = false;
        } else {
            // 5. Success! Prompt for email confirmation
            alert("Success! Please check your email inbox to confirm your account before logging in.");
            toggleAuthMode(); // Switches the UI back to the Login screen
        }
    } catch (err) {
        errorMsg.innerText = "An unexpected error occurred. Please try again.";
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
    }
}
