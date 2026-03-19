// Add this route to your Render backend
app.get('/api/quote/:symbol', async (req, res) => {
    // 1. Grab the stock symbol from the URL (e.g., 'AAPL')
    const symbol = req.params.symbol.toUpperCase();
    
    // 2. Use your Finnhub key (Store this in Render's Environment Variables later!)
    const FINNHUB_KEY = 'd6j9ddhr01ql467ipck0d6j9ddhr01ql467ipckg'; 

    try {
        // 3. Make the request to Finnhub
        const apiResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
        const data = await apiResponse.json();
        
        // 4. Send the data back to your dashboard
        res.json(data);
    } catch (error) {
        console.error("Finnhub API Error:", error);
        res.status(500).json({ error: "Failed to fetch market data" });
    }
});
