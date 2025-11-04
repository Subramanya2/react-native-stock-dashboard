// We'll use a simple fetch. Use of axios is also preferable.
const API_URL = 'http://localhost:8080';

export const fetchStockHistory = async (symbol: string) => {
    const res = await fetch(`${API_URL}/stocks/${symbol}/history`);
    if (!res.ok) {
        throw new Error(`Failed to fetch history for ${symbol}`);
    }
    return res.json();
};

export const fetchPortfolio = async () => {
    const res = await fetch(`${API_URL}/portfolio`);
    if (!res.ok) {
        throw new Error('Failed to fetch portfolio');
    }
    return res.json();
};