import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getStockPriceQueryKey, StockUpdate } from '../hooks/useMarketData';

// Define the props
interface StockRowProps {
    symbol: string;
    openingPrice: number; // To calculate change
}

const StockRow = ({ symbol, openingPrice }: StockRowProps) => {
    // This hook subscribes to the live cache data!
    const { data: liveData } = useQuery<StockUpdate>({
        queryKey: getStockPriceQueryKey(symbol),
        staleTime: Infinity, // The SSE provides the "fresh" data
    });

    const price = liveData?.price ?? openingPrice;
    const change = price - openingPrice;
    const percentChange = (change / openingPrice) * 100;

    const color = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';

    return (
        <View style={styles.row}>
            <View>
                <Text style={styles.symbol}>{symbol}</Text>
                <Text style={styles.companyName}>[Company Name]</Text>
            </View>
            <View style={styles.priceContainer}>
                <Text style={[styles.price, { color }]}>{price.toFixed(2)}</Text>
                <Text style={[styles.change, { backgroundColor: color }]}>
                    {percentChange.toFixed(2)}%
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
    },
    symbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    companyName: {
        fontSize: 14,
        color: '#9ca3af',
    },
    priceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 18,
        fontWeight: '600',
        color: '#fff',
    },
    change: {
        fontSize: 14,
        color: '#fff',
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 4,
    },
});

// Memoize the component for performance
export default React.memo(StockRow);