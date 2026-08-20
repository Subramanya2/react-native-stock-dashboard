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
    const isGain = change >= 0;
    const textColor = isGain ? '#10b981' : '#f43f5e';
    const badgeBg = isGain ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

    const activeSparkline = liveData?.history?.slice(-20) || (sparklineTicks.length > 0 ? sparklineTicks : [baseOpen, (baseOpen + price) / 2, price]);

    // Reanimated Flash Highlight
    const prevPriceRef = useRef<number>(price);
    const flashOpacity = useSharedValue(0);
    const flashColor = useSharedValue('rgba(16, 185, 129, 0.25)');

    useEffect(() => {
        if (prevPriceRef.current !== price) {
            const isUp = price > prevPriceRef.current;
            prevPriceRef.current = price;
            flashColor.value = isUp ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)';
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
            <TouchableOpacity style={styles.cardContainer} onPress={handleRowPress} activeOpacity={0.88}>
                <Animated.View style={[styles.flashOverlay, animatedStyle]} pointerEvents="none" />

                <View style={styles.row}>
                    <View style={styles.leftContainer}>
                        <View style={styles.symbolBadge}>
                            <Text style={styles.symbol}>{symbol}</Text>
                        </View>
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.buyBtn]}
                                onPress={handleBuyPress}
                            >
                                <Text style={styles.actionBtnText}>+ Buy</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionBtn, styles.sellBtn]}
                                onPress={handleSellPress}
                            >
                                <Text style={styles.actionBtnText}>- Sell</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.sparklineContainer}>
                        <SparklineChart data={activeSparkline} width={90} height={34} />
                    </View>

                    <View style={styles.priceContainer}>
                        <Text style={styles.price}>${price.toFixed(2)}</Text>
                        <View style={[styles.changeBadge, { backgroundColor: badgeBg }]}>
                            <Text style={[styles.changeText, { color: textColor }]}>
                                {isGain ? '▲ +' : '▼ '}{Math.abs(percentChange).toFixed(2)}%
                            </Text>
                        </View>
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
    cardContainer: {
        backgroundColor: '#141c2e',
        borderRadius: 14,
        marginHorizontal: 16,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#1e293b',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2,
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    leftContainer: {
        width: 100,
    },
    symbolBadge: {
        marginBottom: 4,
    },
    symbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#f8fafc',
        letterSpacing: 0.5,
    },
    actionRow: {
        flexDirection: 'row',
        marginTop: 4,
        gap: 6,
    },
    actionBtn: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    buyBtn: {
        backgroundColor: '#059669',
    },
    sellBtn: {
        backgroundColor: '#e11d48',
    },
    actionBtnText: {
        color: '#ffffff',
        fontSize: 10,
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
        minWidth: 85,
    },
    price: {
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
    },
    changeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        marginTop: 4,
    },
    changeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
});

export default React.memo(StockRow);