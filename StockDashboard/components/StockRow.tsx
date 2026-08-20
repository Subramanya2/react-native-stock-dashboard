import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withTiming } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getStockPriceQueryKey, getStockSparklineQueryKey, StockUpdate } from '../hooks/useMarketData';
import { SparklineChart } from './SparklineChart';
import { TradeModal } from './TradeModal';

interface StockRowProps {
    symbol: string;
    openingPrice: number;
}

const StockRow = ({ symbol, openingPrice }: StockRowProps) => {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

    const { data: liveData } = useQuery<StockUpdate>({
        queryKey: getStockPriceQueryKey(symbol),
        queryFn: () => null as any,
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const { data: sparklineTicks = [] } = useQuery<number[]>({
        queryKey: getStockSparklineQueryKey(symbol),
        queryFn: () => [],
        staleTime: Infinity,
        gcTime: Infinity,
    });

    const price = liveData?.price ?? openingPrice;
    const baseOpen = liveData?.openingPrice ?? openingPrice;
    const change = liveData?.change ?? (price - baseOpen);
    const percentChange = liveData?.percentChange ?? ((change / baseOpen) * 100);
    const color = change > 0 ? '#10b981' : change < 0 ? '#ef4444' : '#6b7280';

    // Reanimated Flash Highlight
    const prevPriceRef = useRef<number>(price);
    const flashOpacity = useSharedValue(0);
    const flashColor = useSharedValue('rgba(16, 185, 129, 0.25)');

    useEffect(() => {
        if (prevPriceRef.current !== price) {
            const isUp = price > prevPriceRef.current;
            prevPriceRef.current = price;
            flashColor.value = isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
            flashOpacity.value = withSequence(
                withTiming(1, { duration: 150 }),
                withTiming(0, { duration: 600 })
            );
        }
    }, [price]);

    const animatedStyle = useAnimatedStyle(() => ({
        backgroundColor: flashColor.value,
        opacity: flashOpacity.value,
    }));

    const handleRowPress = () => {
        router.push({ pathname: '/stock/[symbol]', params: { symbol } });
    };

    const handleBuyPress = () => {
        setTradeType('BUY');
        setModalVisible(true);
    };

    const handleSellPress = () => {
        setTradeType('SELL');
        setModalVisible(true);
    };

    return (
        <>
            <TouchableOpacity style={styles.rowWrapper} onPress={handleRowPress} activeOpacity={0.85}>
                <Animated.View style={[styles.flashOverlay, animatedStyle]} pointerEvents="none" />

                <View style={styles.row}>
                    <View style={styles.leftContainer}>
                        <Text style={styles.symbol}>{symbol}</Text>
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.buyBtn]}
                                onPress={handleBuyPress}
                            >
                                <Text style={styles.actionBtnText}>Buy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.sellBtn]}
                                onPress={handleSellPress}
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
            </TouchableOpacity>

            <TradeModal
                visible={modalVisible}
                symbol={symbol}
                currentPrice={price}
                initialType={tradeType}
                onClose={() => setModalVisible(false)}
            />
        </>
    );
};

const styles = StyleSheet.create({
    rowWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: '#374151',
        position: 'relative',
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
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