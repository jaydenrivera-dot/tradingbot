const SB_URL = 'https://ecjyjhqotkavtajllxae.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM';
const RENDER_URL = 'https://tradebot-backend-4zh2.onrender.com';

const dbClient = supabase.createClient('https://ecjyjhqotkavtajllxae.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM');

console.log("🚀 script.js has successfully bypassed the naming conflict!");

window.onload = async () => {
 
    const { data: { session } } = await dbClient.auth.getSession();
    
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

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');

    const { error } = await dbClient.auth.signInWithPassword({ email, password });
    
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
    myBotDB.auth.signOut(); 
    localStorage.removeItem('rh_connected');
    location.reload();
}


function showRobinhoodGate() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('robinhood-modal').style.display = 'flex';
}

function revealFinalDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('robinhood-modal').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    
    pingServer();
    loadHistoryFromSupabase();
    
    setInterval(() => {
        pingServer();
        loadHistoryFromSupabase();
    }, 60000);
}

function toggleAuthMode() {
    console.log("Toggle function was clicked!"); 
    
    const title = document.getElementById('auth-title');
    const loginBtn = document.getElementById('loginBtn');
    const signupBtn = document.getElementById('signupBtn');
    const toggleLink = document.getElementById('toggle-link');
    const toggleText = document.getElementById('toggle-text');
    const authCard = document.querySelector('.auth-card'); 
   
    authCard.classList.remove('fade-in'); 
    void authCard.offsetWidth;            
    authCard.classList.add('fade-in');    
    
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

    if (signupBtn.style.display !== 'block') return; 
    
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

async function handleSignUp() {

    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const errorMsg = document.getElementById('auth-error');
    const signupBtn = document.getElementById('signupBtn');

    errorMsg.innerHTML = "";
    signupBtn.innerText = "Creating Account...";
    signupBtn.disabled = true;

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
        const { data, error } = await myBotDB.auth.signUp({
            email: email,
            password: password,
        });

        if (error) {
            if (error.message.includes("already registered") || error.status === 422) {
                errorMsg.innerHTML = `Account already exists. <a href="#" onclick="toggleAuthMode()" style="color: #3b82f6; text-decoration: underline; cursor: pointer;">Login instead.</a>`;
            } else {
                errorMsg.innerText = error.message;
            }
            signupBtn.innerText = "Create Account";
            signupBtn.disabled = false;
        } else {
            alert("Success! Please check your email inbox to confirm your account before logging in.");
            toggleAuthMode(); 
        }
    } catch (err) {
        errorMsg.innerText = "An unexpected error occurred. Please try again.";
        signupBtn.innerText = "Create Account";
        signupBtn.disabled = false;
    }
}
