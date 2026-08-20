import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getApiBaseUrl = (): string => {
    // 1. Check if running inside Expo Go on physical device or emulator
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).experienceUrl;
    if (hostUri) {
        const hostIp = hostUri.split(':')[0];
        if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
            return `http://${hostIp}:8080`;
        }
    }

    // 2. Android Emulator fallback
    if (Platform.OS === 'android') {
        return 'http://10.0.2.2:8080';
    }

    // 3. Web or iOS Simulator default
    return 'http://localhost:8080';
};

export interface OrderRequest {
    symbol: string;
    type: 'BUY' | 'SELL';
    shares: number;
    price: number;
    simulateError?: boolean;
}

export interface PortfolioHolding {
    symbol: string;
    shares: number;
    avgCost?: number;
}

export interface PortfolioResponse {
    userId: string;
    cashBalance?: number;
    holdings: PortfolioHolding[];
}

export const fetchStockHistory = async (symbol: string) => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/stocks/${symbol}/history`);
    if (!res.ok) {
        throw new Error(`Failed to fetch history for ${symbol}`);
    }
    return res.json();
};

export const fetchPortfolio = async (): Promise<PortfolioResponse> => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/portfolio`);
    if (!res.ok) {
        throw new Error('Failed to fetch portfolio');
    }
    return res.json();
};

export const executeOrder = async (order: OrderRequest) => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to execute order');
    }
    return data;
};

export const updateMarketSession = async (session: string) => {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/market-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session }),
    });
    return res.json();
};