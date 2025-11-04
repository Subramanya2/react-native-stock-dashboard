import { useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { EventSource } from 'eventsource';
import { useSSEStore } from '../store/useSSEStore';

// Define the shape of our real-time data
export interface StockUpdate {
    symbol: string;
    price: number;
    timestamp: string;
}

// Define the query key for a single stock's live price
export const getStockPriceQueryKey = (symbol: string) => ['stock-price', symbol];

const SSE_URL = 'http://localhost:8080/sse/stocks';

export const useMarketData = () => {
    const queryClient = useQueryClient();
    const { setStatus } = useSSEStore.getState();
    const eventSourceRef = useRef<EventSource | null>(null);
    const reconnectAttempt = useRef(0);
    const maxReconnectDelay = 30000; // 30 seconds

    const setupSSE = () => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        setStatus('connecting');
        const es = new EventSource(SSE_URL);
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

                // 1. Update the 'live price' query data directly.
                // Any component using useQuery(getStockPriceQueryKey(update.symbol)) will re-render.
                queryClient.setQueryData(
                    getStockPriceQueryKey(update.symbol),
                    update
                );

                // 2. Intelligently invalidate related queries (stale-while-revalidate)
                // This marks 'stock-history' as stale. The next time a user
                // views it, it will refetch in the background.
                queryClient.invalidateQueries({
                    queryKey: ['stock-history', update.symbol],
                });

                // 3. Invalidate portfolio (in case it holds this stock)
                queryClient.invalidateQueries({
                    queryKey: ['portfolio'],
                });
            }
        });

        es.onerror = (error) => {
            console.error('SSE Error:', error);
            setStatus('error');
            es.close();
            handleReconnect();
        };
    };

    const handleReconnect = () => {
        if (eventSourceRef.current?.readyState === EventSource.OPEN) {
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