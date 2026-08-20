import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { fetchStockHistory } from '../../api/stockApi';
import { getStockPriceQueryKey, StockUpdate } from '../../hooks/useMarketData';
import { TradeModal } from '../../components/TradeModal';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

type Timeframe = '1D' | '1W' | '1M' | '1Y';

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();

  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [modalVisible, setModalVisible] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  const stockSymbol = symbol ? symbol.toUpperCase() : 'AAPL';

  // Live SSE price subscription
  const { data: liveData } = useQuery<StockUpdate>({
    queryKey: getStockPriceQueryKey(stockSymbol),
    queryFn: () => null as any,
    staleTime: Infinity,
    enabled: false,
  });

  // Historical data query
  const { data: historyData, isLoading, error } = useQuery({
    queryKey: ['stock-history', stockSymbol],
    queryFn: () => fetchStockHistory(stockSymbol),
  });

  const rawHistory: { date: string; price: number }[] = historyData?.history || [];

  // Filter history based on selected timeframe
  const filteredHistory = useMemo(() => {
    if (!rawHistory.length) return [];
    switch (timeframe) {
      case '1D': return rawHistory.slice(-7);
      case '1W': return rawHistory.slice(-14);
      case '1M': return rawHistory;
      case '1Y': return rawHistory;
      default: return rawHistory;
    }
  }, [rawHistory, timeframe]);

  const currentPrice = liveData?.price ?? (rawHistory.length ? rawHistory[0].price : 150.0);
  const openingPrice = rawHistory.length ? rawHistory[rawHistory.length - 1].price : currentPrice;
  const priceChange = currentPrice - openingPrice;
  const percentChange = (priceChange / openingPrice) * 100;
  const isPositive = priceChange >= 0;
  const themeColor = isPositive ? '#10b981' : '#ef4444';

  // SVG Chart path calculation
  const chartPath = useMemo(() => {
    if (filteredHistory.length < 2) return { linePath: '', areaPath: '' };

    const width = 340;
    const height = 180;
    const padding = 10;

    const prices = filteredHistory.map((h) => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min === 0 ? 1 : max - min;

    const points = filteredHistory.map((h, i) => {
      const x = (i / (filteredHistory.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((h.price - min) / range) * (height - padding * 2);
      return { x, y };
    });

    const line = `M ${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}`;
    const area = `${line} L ${points[points.length - 1].x.toFixed(1)},${height} L ${points[0].x.toFixed(1)},${height} Z`;

    return { linePath: line, areaPath: area };
  }, [filteredHistory]);

  const openTradeModal = (type: 'BUY' | 'SELL') => {
    setTradeType(type);
    setModalVisible(true);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: stockSymbol,
          headerStyle: { backgroundColor: '#111827' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Price Summary Header */}
        <View style={styles.headerBox}>
          <Text style={styles.symbolTitle}>{stockSymbol} Stock</Text>
          <Text style={styles.priceDisplay}>${currentPrice.toFixed(2)}</Text>
          <Text style={[styles.changeText, { color: themeColor }]}>
            {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{percentChange.toFixed(2)}%)
          </Text>
        </View>

        {/* Timeframe Selectors */}
        <View style={styles.timeframeRow}>
          {(['1D', '1W', '1M', '1Y'] as Timeframe[]).map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[styles.timeframeBtn, timeframe === tf && { backgroundColor: themeColor }]}
              onPress={() => setTimeframe(tf)}
            >
              <Text style={[styles.timeframeText, timeframe === tf && styles.timeframeTextActive]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Interactive Chart Section */}
        <View style={styles.chartContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={themeColor} style={{ height: 180 }} />
          ) : error ? (
            <Text style={styles.errorText}>Failed to load stock chart data.</Text>
          ) : (
            <Svg width={340} height={180}>
              <Defs>
                <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={themeColor} stopOpacity="0.35" />
                  <Stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
                </LinearGradient>
              </Defs>
              <Path d={chartPath.areaPath} fill="url(#chartGradient)" />
              <Path
                d={chartPath.linePath}
                fill="none"
                stroke={themeColor}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            </Svg>
          )}
        </View>

        {/* Market Statistics Grid */}
        <Text style={styles.sectionHeader}>Key Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Open Price</Text>
            <Text style={styles.statValue}>${openingPrice.toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Day High</Text>
            <Text style={styles.statValue}>${(currentPrice * 1.03).toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Day Low</Text>
            <Text style={styles.statValue}>${(currentPrice * 0.97).toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>52W Range</Text>
            <Text style={styles.statValue}>$110 - ${(currentPrice * 1.25).toFixed(2)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Volume</Text>
            <Text style={styles.statValue}>14.2M</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Market Cap</Text>
            <Text style={styles.statValue}>$2.85T</Text>
          </View>
        </View>
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={[styles.actionBtn, styles.buyBtn]} onPress={() => openTradeModal('BUY')}>
          <Text style={styles.btnText}>Trade BUY</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.sellBtn]} onPress={() => openTradeModal('SELL')}>
          <Text style={styles.btnText}>Trade SELL</Text>
        </TouchableOpacity>
      </View>

      {/* Trade Execution Modal */}
      <TradeModal
        visible={modalVisible}
        symbol={stockSymbol}
        currentPrice={currentPrice}
        initialType={tradeType}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  contentContainer: { padding: 16, paddingBottom: 100 },
  headerBox: { marginBottom: 16 },
  symbolTitle: { color: '#9ca3af', fontSize: 14, textTransform: 'uppercase' },
  priceDisplay: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', marginVertical: 4 },
  changeText: { fontSize: 16, fontWeight: '600' },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#1f2937',
    borderRadius: 8,
    padding: 4,
    marginBottom: 20,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  timeframeText: { color: '#9ca3af', fontWeight: 'bold', fontSize: 13 },
  timeframeTextActive: { color: '#ffffff' },
  chartContainer: {
    backgroundColor: '#1f2937',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  errorText: { color: '#ef4444', marginVertical: 40 },
  sectionHeader: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1f2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  statLabel: { color: '#9ca3af', fontSize: 12, marginBottom: 4 },
  statValue: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1f2937',
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buyBtn: { backgroundColor: '#059669' },
  sellBtn: { backgroundColor: '#dc2626' },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
