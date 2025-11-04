// Install: npm install express cors
const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// In-memory data
let stocks = {
    'AAPL': 150.00, 'GOOGL': 2800.00, 'TSLA': 700.00, 'MSFT': 300.00,
};

// --- Part 1: SSE Endpoint ---
app.get('/sse/stocks', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log('Client connected to SSE');

    const intervalId = setInterval(() => {
        // Simulate realistic market data with volatility
        const symbol = Object.keys(stocks)[Math.floor(Math.random() * Object.keys(stocks).length)];
        const change = (Math.random() - 0.5) * 2; // -1 to +1
        stocks[symbol] = Math.max(50, stocks[symbol] + change); // Ensure price doesn't go too low

        const data = {
            symbol: symbol,
            price: parseFloat(stocks[symbol].toFixed(2)),
            timestamp: new Date().toISOString(),
        };

        // Send SSE message
        res.write(`id: ${new Date().getTime()}\n`);
        res.write(`event: stockUpdate\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 1000); // Send an update every second

    req.on('close', () => {
        console.log('Client disconnected from SSE');
        clearInterval(intervalId);
        res.end();
    });
});

// --- Part 2: REST Endpoints ---
app.get('/stocks/:symbol/history', (req, res) => {
    // Simulate historical data
    const history = Array.from({ length: 30 }, (_, i) => ({
        date: `2025-10-${30 - i}`,
        price: stocks[req.params.symbol] - (i * (Math.random() - 0.5)),
    }));
    res.json({ symbol: req.params.symbol, history });
});

app.get('/portfolio', (req, res) => {
    // Simulate user portfolio
    res.json({
        userId: 'user123',
        holdings: [
            { symbol: 'AAPL', shares: 10 },
            { symbol: 'GOOGL', shares: 5 },
        ],
    });
});

app.listen(port, () => {
    console.log(`Mock Stock API server running at http://localhost:${port}`);
});