import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { getStockPriceQueryKey, getStockSparklineQueryKey, StockUpdate } from '../hooks/useMarketData';
import { SparklineChart } from './SparklineChart';
import { useOrderExecution } from '../hooks/useOrderExecution';

interface StockRowProps {
    symbol: string;
    openingPrice: number;
}

const StockRow = ({ symbol, openingPrice }: StockRowProps) => {
    const { data: liveData } = useQuery<StockUpdate>({
        queryKey: getStockPriceQueryKey(symbol),
        queryFn: () => null as any,
        staleTime: Infinity,
        gcTime: Infinity,
        enabled: false,
    });

    const { data: sparklineTicks = [] } = useQuery<number[]>({
        queryKey: getStockSparklineQueryKey(symbol),
        queryFn: () => [],
        staleTime: Infinity,
        gcTime: Infinity,
        enabled: false,
    });

    const { mutate: executeOrder, isPending } = useOrderExecution();

    const price = liveData?.price ?? openingPrice;
    const change = price - openingPrice;
    const percentChange = (change / openingPrice) * 100;
    const color = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';

    const handleBuy = () => {
        executeOrder({
            symbol,
            type: 'BUY',
            shares: 1,
            price,
        });
    };

    const handleSell = () => {
        executeOrder({
            symbol,
            type: 'SELL',
            shares: 1,
            price,
        });
    };

    return (
        <View style={styles.row}>
            <View style={styles.leftContainer}>
                <Text style={styles.symbol}>{symbol}</Text>
                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.buyBtn]}
                        onPress={handleBuy}
                        disabled={isPending}
                    >
                        <Text style={styles.actionBtnText}>Buy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.actionBtn, styles.sellBtn]}
                        onPress={handleSell}
                        disabled={isPending}
                    >
                        <Text style={styles.actionBtnText}>Sell</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.sparklineContainer}>
                <SparklineChart data={sparklineTicks} width={85} height={32} />
            </View>

            <View style={styles.priceContainer}>
                <Text style={[styles.price, { color }]}>${price.toFixed(2)}</Text>
                <Text style={[styles.change, { backgroundColor: color }]}>
                    {percentChange >= 0 ? `+${percentChange.toFixed(2)}%` : `${percentChange.toFixed(2)}%`}
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
    leftContainer: {
        width: 90,
    },
    symbol: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#fff',
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 6,
        gap: 4,
    },
    actionBtn: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    buyBtn: {
        backgroundColor: '#059669',
    },
    sellBtn: {
        backgroundColor: '#dc2626',
    },
    actionBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    sparklineContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
    },
    priceContainer: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    price: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    change: {
        fontSize: 12,
        color: '#fff',
        fontWeight: 'bold',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
        marginTop: 4,
    },
});

export default React.memo(StockRow);