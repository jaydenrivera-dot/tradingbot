const SUPABASE_URL = 'https://ecjyjhqotkavtajllxae.supabase.co;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjanlqaHFvdGthdnRhamxseGFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2NTAxMzAsImV4cCI6MjA4ODIyNjEzMH0.JTlAsV0NAGK7WyRaech-xvM_xmOawut1G0IKK_E3mpM;
const RENDER_URL = 'https://tradebot-backend-4zh2.onrender.com;

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let initialPurchaseBalance = 12000.00; 

window.onload = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) showDashboard();
    else document.getElementById('login-overlay').style.display = 'flex';
};

async function handleLogin() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) document.getElementById('auth-error').innerText = error.message;
    else showDashboard();
}

function showDashboard() {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('dashboard-content').style.display = 'block';
    pingServer();
    loadHistoryFromSupabase();
    subscribeToTrades();
}

async function triggerAutoTrade() {
    try {
        const res = await fetch(`${RENDER_URL}/api/trade`, { method: 'POST' });
        if (res.ok) console.log("Trade triggered");
    } catch (err) { console.error("Trade failed", err); }
}

function validateAndCheckSafety() {
    const current = parseFloat(document.getElementById('budgetText').innerText.replace(/[$,]/g, ''));
    const userLimit = parseFloat(document.getElementById('userLimitInput').value) || 100;
    const ceiling = initialPurchaseBalance * (1 + Math.min(userLimit, 100) / 100);

    if (current >= ceiling) {
        document.getElementById('tradeBtn').disabled = true;
        document.getElementById('tradeBtn').classList.add('btn-disabled');
        document.getElementById('emergency-zone').style.display = 'block';
    }
}

async function loadHistoryFromSupabase() {
    const { data } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
    if (data) {
        renderHistory(data);
        updatePriceAlert(data[0]?.price || 0); // Example check
    }
}

function renderHistory(data) {
    document.getElementById('historyBody').innerHTML = data.map(t => `
        <tr><td>${new Date(t.created_at).toLocaleDateString()}</td><td>${t.symbol}</td><td>${t.action}</td><td>$${t.price}</td></tr>
    `).join('');
}

// Helper: Sync Goal Bar
function updateGoalProgress() {
    const current = parseFloat(document.getElementById('budgetText').innerText.replace(/[$,]/g, '')) || 0;
    const target = parseFloat(document.getElementById('targetInput').value) || 1;
    const percent = Math.min((current / target) * 100, 100);
    document.getElementById('goalProgressBar').style.width = percent + '%';
}
