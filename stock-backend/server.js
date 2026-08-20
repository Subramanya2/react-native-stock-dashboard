// Install: npm install express cors
const express = require('express');
const cors = require('cors');
const app = express();
const port = 8080;

app.use(cors());
app.use(express.json());

// Initialize smooth 30-tick historical price series for each stock
let openingPrices = {
    'AAPL': 146.50,
    'GOOGL': 2750.00,
    'TSLA': 718.00,
    'MSFT': 294.00,
};

let stocks = {
    'AAPL': 150.00,
    'GOOGL': 2800.00,
    'TSLA': 700.00,
    'MSFT': 300.00,
};

let stockHistory = {
    'AAPL': Array.from({ length: 30 }, (_, i) => parseFloat((146.50 + (i * 0.12) + (Math.sin(i) * 0.5)).toFixed(2))),
    'GOOGL': Array.from({ length: 30 }, (_, i) => parseFloat((2750.00 + (i * 1.66) + (Math.cos(i) * 5.0)).toFixed(2))),
    'TSLA': Array.from({ length: 30 }, (_, i) => parseFloat((718.00 - (i * 0.60) + (Math.sin(i) * 3.0)).toFixed(2))),
    'MSFT': Array.from({ length: 30 }, (_, i) => parseFloat((294.00 + (i * 0.20) + (Math.cos(i) * 0.8)).toFixed(2))),
};

// --- Part 1: SSE Endpoint ---
app.get('/sse/stocks', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    console.log('Client connected to SSE');

    const intervalId = setInterval(() => {
        // Pick a random stock and simulate realistic percentage-based market volatility (±0.4% to ±1.2%)
        const symbols = Object.keys(stocks);
        const symbol = symbols[Math.floor(Math.random() * symbols.length)];
        const openPrice = openingPrices[symbol];

        // Percentage drift between -1.2% and +1.2%
        const percentDrift = (Math.random() - 0.49) * 0.024;
        const priceChange = stocks[symbol] * percentDrift;

        stocks[symbol] = Math.max(20, stocks[symbol] + priceChange);

        const currentPrice = parseFloat(stocks[symbol].toFixed(2));
        const totalChange = currentPrice - openPrice;
        const percentChange = (totalChange / openPrice) * 100;

        // Push latest live tick into stockHistory buffer
        if (!stockHistory[symbol]) stockHistory[symbol] = [];
        stockHistory[symbol].push(currentPrice);
        if (stockHistory[symbol].length > 30) {
            stockHistory[symbol].shift();
        }

        const data = {
            symbol: symbol,
            price: currentPrice,
            openingPrice: openPrice,
            change: parseFloat(totalChange.toFixed(2)),
            percentChange: parseFloat(percentChange.toFixed(2)),
            history: stockHistory[symbol],
            timestamp: new Date().toISOString(),
        };

        // Send SSE message
        res.write(`id: ${new Date().getTime()}\n`);
        res.write(`event: stockUpdate\n`);
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 800); // Send update every 800ms for lively UI streaming

    req.on('close', () => {
        console.log('Client disconnected from SSE');
        clearInterval(intervalId);
        res.end();
    });
});

// --- Part 2: REST Endpoints ---
app.get('/stocks/:symbol/history', (req, res) => {
    const symbol = req.params.symbol;
    const priceSeries = stockHistory[symbol] || [stocks[symbol] || 100];
    const history = priceSeries.map((price, i) => ({
        date: `Tick-${i + 1}`,
        price,
    }));
    res.json({ symbol, history });
});

let userPortfolio = {
    userId: 'user123',
    cashBalance: 10000.00,
    holdings: [
        { symbol: 'AAPL', shares: 10 },
        { symbol: 'GOOGL', shares: 5 },
    ],
};

app.get('/portfolio', (req, res) => {
    // Simulate user portfolio
    res.json(userPortfolio);
});

app.post('/api/order', (req, res) => {
    const { symbol, type, shares, price, simulateError } = req.body;

    if (simulateError) {
        return res.status(400).json({ error: 'Simulated Order Execution Failure' });
    }

    const shareCount = Number(shares) || 1;
    const currentPrice = price || stocks[symbol] || 100;
    const totalCost = currentPrice * shareCount;

    if (type === 'BUY') {
        if (userPortfolio.cashBalance < totalCost) {
            return res.status(400).json({ error: 'Insufficient cash balance' });
        }
        userPortfolio.cashBalance -= totalCost;
        const existingHolding = userPortfolio.holdings.find(h => h.symbol === symbol);
        if (existingHolding) {
            existingHolding.shares += shareCount;
        } else {
            userPortfolio.holdings.push({ symbol, shares: shareCount });
        }
    } else if (type === 'SELL') {
        const existingHolding = userPortfolio.holdings.find(h => h.symbol === symbol);
        if (!existingHolding || existingHolding.shares < shareCount) {
            return res.status(400).json({ error: 'Insufficient shares to sell' });
        }
        userPortfolio.cashBalance += totalCost;
        existingHolding.shares -= shareCount;
        userPortfolio.holdings = userPortfolio.holdings.filter(h => h.shares > 0);
    } else {
        return res.status(400).json({ error: 'Invalid order type' });
    }

    res.json({
        success: true,
        message: `Successfully executed ${type} order for ${shareCount} shares of ${symbol}`,
        portfolio: userPortfolio,
    });
});


app.listen(port, () => {
    console.log(`Mock Stock API server running at http://localhost:${port}`);
});