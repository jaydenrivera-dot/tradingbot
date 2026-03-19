const FINNHUB_KEY = process.env.FINNHUB_KEY; 

app.get('/api/quote/:symbol', async (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    
    if (!FINNHUB_KEY) {
        return res.status(500).json({ error: "API Key not configured on server" });
    }

    try {
        const apiResponse = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
        const data = await apiResponse.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Finnhub API Error" });
    }
});
