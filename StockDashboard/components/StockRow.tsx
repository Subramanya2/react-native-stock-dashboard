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
    name?: string;
    openingPrice: number;
    brandColor?: string;
}

const STOCK_NAMES: Record<string, string> = {
    AAPL: 'Apple Inc.',
    GOOGL: 'Alphabet Inc.',
    TSLA: 'Tesla Inc.',
    MSFT: 'Microsoft Corp.',
};

const STOCK_COLORS: Record<string, string> = {
    AAPL: '#3b82f6',
    GOOGL: '#f97316',
    TSLA: '#eab308',
    MSFT: '#8b5cf6',
};

const StockRow = ({ symbol, name, openingPrice, brandColor }: StockRowProps) => {
    const router = useRouter();
    const [modalVisible, setModalVisible] = useState(false);
    const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

    const displayName = name || STOCK_NAMES[symbol] || symbol;
    const accentColor = brandColor || STOCK_COLORS[symbol] || '#6366f1';

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
            flashColor.value = isUp ? 'rgba(16, 185, 129, 0.28)' : 'rgba(244, 63, 94, 0.28)';
            flashOpacity.value = withSequence(
                withTiming(1, { duration: 150 }),
                withTiming(0, { duration: 650 })
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

                {/* Top Section: Avatar, Info, Sparkline, Price */}
                <View style={styles.topSection}>
                    <View style={styles.leftInfoGroup}>
                        <View style={[styles.avatarCircle, { backgroundColor: `${accentColor}25`, borderColor: `${accentColor}50` }]}>
                            <Text style={[styles.avatarText, { color: accentColor }]}>{symbol[0]}</Text>
                        </View>
                        <View style={styles.symbolGroup}>
                            <Text style={styles.symbol}>{symbol}</Text>
                            <Text style={styles.companyName} numberOfLines={1}>{displayName}</Text>
                        </View>
                    </View>

                    <View style={styles.sparklineContainer}>
                        <SparklineChart data={activeSparkline} width={85} height={32} />
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

                {/* Bottom Section: Action Buttons */}
                <View style={styles.cardFooter}>
                    <Text style={styles.tapDetailText}>Tap card for detailed chart ↗</Text>
                    <View style={styles.actionBtnGroup}>
                        <TouchableOpacity style={[styles.actionBtn, styles.buyBtn]} onPress={handleBuyPress}>
                            <Text style={styles.buyBtnText}>+ Buy</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, styles.sellBtn]} onPress={handleSellPress}>
                            <Text style={styles.sellBtnText}>- Sell</Text>
                        </TouchableOpacity>
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
        borderRadius: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#1e293b',
        overflow: 'hidden',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 3,
    },
    flashOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 10,
    },
    leftInfoGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        width: 125,
    },
    avatarCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 17,
        fontWeight: 'bold',
    },
    symbolGroup: {
        flex: 1,
    },
    symbol: {
        fontSize: 17,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    companyName: {
        fontSize: 11,
        color: '#94a3b8',
        marginTop: 1,
    },
    sparklineContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 2,
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
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: '#0f172a',
        borderTopWidth: 1,
        borderTopColor: '#1e293b',
    },
    tapDetailText: {
        color: '#64748b',
        fontSize: 11,
        fontWeight: '500',
    },
    actionBtnGroup: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    buyBtn: {
        backgroundColor: '#059669',
    },
    sellBtn: {
        backgroundColor: '#e11d48',
    },
    buyBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
    sellBtnText: {
        color: '#ffffff',
        fontSize: 11,
        fontWeight: 'bold',
    },
});

export default React.memo(StockRow);