import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQuery } from '@tanstack/react-query';
import { fetchStockHistory } from '../../api/stockApi';
import { getStockPriceQueryKey, StockUpdate } from '../../hooks/useMarketData';
import { StockDetailChart } from '../../components/StockDetailChart';
import { KeyStatisticsGrid } from '../../components/KeyStatisticsGrid';
import { TradeModal } from '../../components/TradeModal';

type Timeframe = '1D' | '1W' | '1M' | '1Y';

export default function StockDetailScreen() {
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [timeframe, setTimeframe] = useState<Timeframe>('1M');
  const [modalVisible, setModalVisible] = useState(false);
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');

  const stockSymbol = symbol ? symbol.toUpperCase() : 'AAPL';
  const chartWidth = Math.max(280, windowWidth - 48);
  const chartHeight = 180;

  // Live SSE price subscription
  const { data: liveData } = useQuery<StockUpdate>({
    queryKey: getStockPriceQueryKey(stockSymbol),
    queryFn: () => null as any,
    staleTime: Infinity,
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

  const currentPrice = liveData?.price ?? (rawHistory.length ? rawHistory[rawHistory.length - 1].price : 150.0);
  const baseOpenPrice = liveData?.openingPrice ?? (rawHistory.length ? rawHistory[0].price : currentPrice);
  const priceChange = liveData?.change ?? (currentPrice - baseOpenPrice);
  const percentChange = liveData?.percentChange ?? (baseOpenPrice ? (priceChange / baseOpenPrice) * 100 : 0);
  const isPositive = priceChange >= 0;
  const themeColor = isPositive ? '#10b981' : '#f43f5e';

  const openTradeModal = (type: 'BUY' | 'SELL') => {
    setTradeType(type);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Safe-Area Aware Header Bar */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <FontAwesome name="chevron-left" size={16} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stockSymbol} Detailed Analytics</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={[styles.contentContainer, { paddingBottom: 90 + insets.bottom }]}>
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

        {/* Modular SVG Chart Component */}
        <StockDetailChart
          filteredHistory={filteredHistory}
          isLoading={isLoading}
          error={error}
          themeColor={themeColor}
          chartWidth={chartWidth}
          chartHeight={chartHeight}
        />

        {/* Modular Market Statistics Grid */}
        <KeyStatisticsGrid
          baseOpenPrice={baseOpenPrice}
          currentPrice={currentPrice}
        />
      </ScrollView>

      {/* Floating Bottom Action Bar */}
      <View style={[styles.actionBar, { paddingBottom: Math.max(14, insets.bottom) }]}>
        <TouchableOpacity style={[styles.actionBtn, styles.buyBtn]} onPress={() => openTradeModal('BUY')}>
          <Text style={styles.btnText}>Buy Shares</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.sellBtn]} onPress={() => openTradeModal('SELL')}>
          <Text style={styles.btnText}>Sell Shares</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17', maxWidth: 680, width: '100%', alignSelf: 'center' },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#141c2e',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerPlaceholder: {
    width: 34,
  },
  scrollContainer: { flex: 1 },
  contentContainer: { padding: 16 },
  headerBox: { marginBottom: 16 },
  symbolTitle: { color: '#94a3b8', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' },
  priceDisplay: { color: '#ffffff', fontSize: 38, fontWeight: 'bold', marginVertical: 4 },
  changeText: { fontSize: 15, fontWeight: 'bold' },
  timeframeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#141c2e',
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  timeframeText: { color: '#94a3b8', fontWeight: 'bold', fontSize: 13 },
  timeframeTextActive: { color: '#ffffff' },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#141c2e',
    paddingTop: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  actionBtn: { flex: 1, paddingVertical: 14, borderRadius: 10, alignItems: 'center' },
  buyBtn: { backgroundColor: '#059669' },
  sellBtn: { backgroundColor: '#e11d48' },
  btnText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
