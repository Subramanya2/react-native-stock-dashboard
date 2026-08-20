import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSSEStore } from '../store/useSSEStore';
import { CustomEventSource } from '../services/eventSource';

import { getApiBaseUrl } from '../api/stockApi';

// Define the shape of our real-time data
export interface StockUpdate {
    symbol: string;
    price: number;
    openingPrice?: number;
    change?: number;
    percentChange?: number;
    history?: number[];
    session?: 'REGULAR_HOURS' | 'PRE_MARKET' | 'AFTER_HOURS' | 'DEMO_LIVE';
    exchange?: string;
    marketOpen?: boolean;
    timestamp: string;
}

// Define the query key for a single stock's live price
export const getStockPriceQueryKey = (symbol: string) => ['stock-price', symbol];
export const getStockSparklineQueryKey = (symbol: string) => ['stock-sparkline', symbol];

export const useMarketData = () => {
    const queryClient = useQueryClient();
    const { setStatus, setSession } = useSSEStore.getState();
    const eventSourceRef = useRef<CustomEventSource | null>(null);
    const reconnectAttempt = useRef(0);
    const maxReconnectDelay = 30000; // 30 seconds

    const setupSSE = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setStatus('connecting');
        const sseUrl = `${getApiBaseUrl()}/sse/stocks`;
        const es = new CustomEventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
            console.log('SSE Connection Opened');
            setStatus('connected');
            reconnectAttempt.current = 0; // Reset backoff on successful connection
        };

        // This handles the 'stockUpdate' event from our backend
        es.addEventListener('stockUpdate', (event) => {
            if (event.data) {
                const update = JSON.parse(event.data) as StockUpdate;

                if (update.session) {
                    setSession(update.session);
                }

                // 1. Update the 'live price' query data directly.
                queryClient.setQueryData(
                    getStockPriceQueryKey(update.symbol),
                    update
                );

                // 2. Sync sparkline chart array directly with the live history stream
                queryClient.setQueryData<number[]>(
                    getStockSparklineQueryKey(update.symbol),
                    () => {
                        if (update.history && update.history.length > 0) {
                            return update.history.slice(-20);
                        }
                        const old = queryClient.getQueryData<number[]>(getStockSparklineQueryKey(update.symbol)) || [];
                        return [...old, update.price].slice(-20);
                    }
                );

                // 3. Intelligently invalidate related queries (stale-while-revalidate)
                queryClient.invalidateQueries({
                    queryKey: ['stock-history', update.symbol],
                });

                // 4. Invalidate portfolio
                queryClient.invalidateQueries({
                    queryKey: ['portfolio'],
                });
            }
        });

        es.onerror = (error) => {
            console.error('SSE Error:', error);
            if (es.readyState === 2) {
                setStatus('error');
                es.close();
                handleReconnect();
            }
        };
    };

    const handleReconnect = () => {
        if (eventSourceRef.current?.readyState === 1) {
            return;
        }

        setStatus('disconnected');
        reconnectAttempt.current++;

        // **Exponential Backoff Logic**
        const delay = Math.min(
            1000 * Math.pow(2, reconnectAttempt.current), // 1s, 2s, 4s, 8s...
            maxReconnectDelay
        );

        console.log(`SSE disconnected. Reconnecting in ${delay / 1000}s...`);

        setTimeout(() => {
            setupSSE();
        }, delay);
    };

    const cleanupSSE = () => {
        if (eventSourceRef.current) {
            console.log('Cleaning up SSE connection');
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
    };

    return { setupSSE, cleanupSSE };
};