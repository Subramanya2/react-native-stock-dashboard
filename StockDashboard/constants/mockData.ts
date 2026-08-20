export interface StockInfo {
  symbol: string;
  name: string;
  openingPrice: number;
  color: string;
}

export const WATCHLIST: StockInfo[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', openingPrice: 146.50, color: '#3b82f6' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', openingPrice: 2750.00, color: '#f97316' },
  { symbol: 'TSLA', name: 'Tesla Inc.', openingPrice: 718.00, color: '#eab308' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', openingPrice: 294.00, color: '#8b5cf6' },
];

export const DEFAULT_AVG_COST: Record<string, number> = {
  AAPL: 145.0,
  GOOGL: 2700.0,
  TSLA: 718.0,
  MSFT: 294.0,
};

export const HOLDING_COLORS: Record<string, string> = {
  Cash: '#10b981',
  AAPL: '#3b82f6',
  GOOGL: '#f97316',
  TSLA: '#eab308',
  MSFT: '#8b5cf6',
};
