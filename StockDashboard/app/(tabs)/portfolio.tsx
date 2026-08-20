import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio, PortfolioHolding } from '../../api/stockApi';
import { useOrderExecution } from '../../hooks/useOrderExecution';
import { getStockPriceQueryKey, StockUpdate } from '../../hooks/useMarketData';

const HOLDING_COLORS: Record<string, string> = {
  Cash: '#10b981',
  AAPL: '#3b82f6',
  GOOGL: '#ea580c',
  TSLA: '#eab308',
  MSFT: '#8b5cf6',
};

const DEFAULT_PRICES: Record<string, number> = {
  AAPL: 150.0,
  GOOGL: 2800.0,
  TSLA: 700.0,
  MSFT: 300.0,
};

export default function PortfolioScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    refetchInterval: 60000,
  });

  const { mutate: executeOrder, isPending } = useOrderExecution();

  // Subscribe to live SSE prices for all holdings
  const aaplQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('AAPL'), queryFn: () => null as any, staleTime: Infinity });
  const googlQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('GOOGL'), queryFn: () => null as any, staleTime: Infinity });
  const tslaQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('TSLA'), queryFn: () => null as any, staleTime: Infinity });
  const msftQuery = useQuery<StockUpdate>({ queryKey: getStockPriceQueryKey('MSFT'), queryFn: () => null as any, staleTime: Infinity });

  const livePrices: Record<string, number> = {
    AAPL: aaplQuery.data?.price ?? DEFAULT_PRICES.AAPL,
    GOOGL: googlQuery.data?.price ?? DEFAULT_PRICES.GOOGL,
    TSLA: tslaQuery.data?.price ?? DEFAULT_PRICES.TSLA,
    MSFT: msftQuery.data?.price ?? DEFAULT_PRICES.MSFT,
  };

  if (isLoading && !data) return <View style={styles.container}><Text style={styles.text}>Loading Portfolio...</Text></View>;
  if (error && !data) return <View style={styles.container}><Text style={styles.text}>Error loading portfolio.</Text></View>;

  const cashBalance = data?.cashBalance ?? 10000;
  const holdings = data?.holdings || [];

  // Calculate live market valuation of holdings
  let totalHoldingsValue = 0;
  const holdingValuations = holdings.map((h: PortfolioHolding) => {
    const currentPrice = livePrices[h.symbol] || DEFAULT_PRICES[h.symbol] || 100;
    const value = h.shares * currentPrice;
    totalHoldingsValue += value;
    return { ...h, currentPrice, value };
  });

  const totalNetWorth = cashBalance + totalHoldingsValue;

  // Asset allocation percentages
  const cashPercent = totalNetWorth > 0 ? (cashBalance / totalNetWorth) * 100 : 100;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>My Portfolio</Text>

      {/* Net Worth Summary Card */}
      <View style={styles.netWorthCard}>
        <Text style={styles.balanceLabel}>Total Net Worth</Text>
        <Text style={styles.netWorthValue}>
          ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>
        <View style={styles.subBalanceRow}>
          <Text style={styles.subBalanceText}>Cash: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.subBalanceText}>Invested: ${totalHoldingsValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
        </View>

        {/* Asset Allocation Multi-Color Bar */}
        <Text style={styles.allocationLabel}>Asset Allocation</Text>
        <View style={styles.allocationBar}>
          <View style={[styles.barSegment, { width: `${cashPercent}%`, backgroundColor: HOLDING_COLORS.Cash }]} />
          {holdingValuations.map((h) => {
            const pct = totalNetWorth > 0 ? (h.value / totalNetWorth) * 100 : 0;
            return (
              <View
                key={h.symbol}
                style={[styles.barSegment, { width: `${pct}%`, backgroundColor: HOLDING_COLORS[h.symbol] || '#6b7280' }]}
              />
            );
          })}
        </View>

        {/* Allocation Legend */}
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: HOLDING_COLORS.Cash }]} />
            <Text style={styles.legendText}>Cash ({cashPercent.toFixed(0)}%)</Text>
          </View>
          {holdingValuations.map((h) => {
            const pct = totalNetWorth > 0 ? (h.value / totalNetWorth) * 100 : 0;
            return (
              <View key={h.symbol} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: HOLDING_COLORS[h.symbol] || '#6b7280' }]} />
                <Text style={styles.legendText}>{h.symbol} ({pct.toFixed(0)}%)</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Holdings & Actions</Text>

      {holdings.length === 0 && (
        <Text style={styles.emptyText}>No active stock holdings.</Text>
      )}

      {holdingValuations.map((holding) => (
        <View key={holding.symbol} style={styles.holding}>
          <View style={{ flex: 1 }}>
            <Text style={styles.symbolText}>{holding.symbol}</Text>
            <Text style={styles.sharesText}>
              {holding.shares} Shares @ ${holding.currentPrice.toFixed(2)}
            </Text>
          </View>

          <View style={styles.valuationContainer}>
            <Text style={styles.holdingValueText}>${holding.value.toFixed(2)}</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.buyBtn]}
              disabled={isPending}
              onPress={() => executeOrder({ symbol: holding.symbol, type: 'BUY', shares: 1, price: holding.currentPrice })}
            >
              <Text style={styles.btnText}>+ Buy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.sellBtn]}
              disabled={isPending}
              onPress={() => executeOrder({ symbol: holding.symbol, type: 'SELL', shares: 1, price: holding.currentPrice })}
            >
              <Text style={styles.btnText}>- Sell</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111827' },
  contentContainer: { padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 16, marginTop: 40 },
  netWorthCard: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  balanceLabel: { color: '#9ca3af', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  netWorthValue: { color: '#ffffff', fontSize: 32, fontWeight: 'bold', marginVertical: 4 },
  subBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  subBalanceText: { color: '#9ca3af', fontSize: 13 },
  allocationLabel: { color: '#d1d5db', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  allocationBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#374151',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 10,
  },
  barSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#9ca3af', fontSize: 11 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#e5e7eb', marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', marginVertical: 12 },
  holding: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    marginBottom: 10,
  },
  symbolText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  sharesText: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  valuationContainer: { paddingHorizontal: 10, alignItems: 'flex-end' },
  holdingValueText: { color: '#10b981', fontSize: 15, fontWeight: 'bold' },
  actionRow: { flexDirection: 'row', gap: 6, marginLeft: 8 },
  actionBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 6 },
  buyBtn: { backgroundColor: '#059669' },
  sellBtn: { backgroundColor: '#dc2626' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  text: { color: 'white', fontSize: 16 },
});