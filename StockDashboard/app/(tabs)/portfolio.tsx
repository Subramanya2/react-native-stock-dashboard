import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio, PortfolioHolding } from '../../api/stockApi';
import { useOrderExecution } from '../../hooks/useOrderExecution';
import { getStockPriceQueryKey, StockUpdate } from '../../hooks/useMarketData';

const HOLDING_COLORS: Record<string, string> = {
  Cash: '#10b981',
  AAPL: '#3b82f6',
  GOOGL: '#f97316',
  TSLA: '#eab308',
  MSFT: '#8b5cf6',
};

const DEFAULT_AVG_COST: Record<string, number> = {
  AAPL: 145.0,
  GOOGL: 2700.0,
  TSLA: 718.0,
  MSFT: 294.0,
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
    AAPL: aaplQuery.data?.price ?? 150.0,
    GOOGL: googlQuery.data?.price ?? 2800.0,
    TSLA: tslaQuery.data?.price ?? 700.0,
    MSFT: msftQuery.data?.price ?? 300.0,
  };

  if (isLoading && !data) return <SafeAreaView style={styles.container} edges={['top']}><Text style={styles.text}>Loading Portfolio...</Text></SafeAreaView>;
  if (error && !data) return <SafeAreaView style={styles.container} edges={['top']}><Text style={styles.text}>Error loading portfolio.</Text></SafeAreaView>;

  const cashBalance = data?.cashBalance ?? 10000;
  const holdings = data?.holdings || [];

  // Calculate live market valuation & Cost Basis P/L for holdings
  let totalHoldingsValue = 0;
  let totalCostBasis = 0;

  const holdingValuations = holdings.map((h: PortfolioHolding) => {
    const currentPrice = livePrices[h.symbol] || DEFAULT_AVG_COST[h.symbol] || 100;
    const avgCost = h.avgCost ?? DEFAULT_AVG_COST[h.symbol] ?? currentPrice;
    const totalSpent = h.shares * avgCost;
    const currentValue = h.shares * currentPrice;
    const pnlDollar = currentValue - totalSpent;
    const pnlPercent = totalSpent > 0 ? (pnlDollar / totalSpent) * 100 : 0;

    totalHoldingsValue += currentValue;
    totalCostBasis += totalSpent;

    return {
      ...h,
      avgCost,
      totalSpent,
      currentPrice,
      currentValue,
      pnlDollar,
      pnlPercent,
    };
  });

  const totalNetWorth = cashBalance + totalHoldingsValue;
  const totalPnlDollar = totalHoldingsValue - totalCostBasis;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnlDollar / totalCostBasis) * 100 : 0;
  const isOverallPositive = totalPnlDollar >= 0;

  // Asset allocation percentages
  const cashPercent = totalNetWorth > 0 ? (cashBalance / totalNetWorth) * 100 : 100;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <Text style={styles.title}>My Portfolio</Text>

      {/* Net Worth Hero Card */}
      <View style={styles.netWorthCard}>
        <Text style={styles.balanceLabel}>Total Net Worth</Text>

        <Text style={styles.netWorthValue}>
          ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Prominent All-Time Profit / Loss Indicator */}
        {totalCostBasis > 0 && (
          <View style={styles.pnlRow}>
            <View style={[styles.pnlBadge, { backgroundColor: isOverallPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' }]}>
              <Text style={[styles.pnlMainText, { color: isOverallPositive ? '#10b981' : '#f43f5e' }]}>
                {isOverallPositive ? '▲ +' : '▼ '}
                ${Math.abs(totalPnlDollar).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isOverallPositive ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
              </Text>
            </View>
            <Text style={styles.pnlSubLabel}>Unrealized Return</Text>
          </View>
        )}

        <View style={styles.subBalanceRow}>
          <Text style={styles.subBalanceText}>Available Cash: <Text style={styles.highlightVal}>${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Text>
          <Text style={styles.subBalanceText}>Invested: <Text style={styles.highlightVal}>${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text></Text>
        </View>

        {/* Asset Allocation Multi-Color Bar */}
        <Text style={styles.allocationLabel}>Asset Allocation</Text>
        <View style={styles.allocationBar}>
          <View style={[styles.barSegment, { width: `${cashPercent}%`, backgroundColor: HOLDING_COLORS.Cash }]} />
          {holdingValuations.map((h) => {
            const pct = totalNetWorth > 0 ? (h.currentValue / totalNetWorth) * 100 : 0;
            return (
              <View
                key={h.symbol}
                style={[styles.barSegment, { width: `${pct}%`, backgroundColor: HOLDING_COLORS[h.symbol] || '#64748b' }]}
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
            const pct = totalNetWorth > 0 ? (h.currentValue / totalNetWorth) * 100 : 0;
            return (
              <View key={h.symbol} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: HOLDING_COLORS[h.symbol] || '#64748b' }]} />
                <Text style={styles.legendText}>{h.symbol} ({pct.toFixed(0)}%)</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Active Positions</Text>

      {holdings.length === 0 && (
        <Text style={styles.emptyText}>No active stock holdings.</Text>
      )}

      {holdingValuations.map((holding) => {
        const isPos = holding.pnlDollar >= 0;
        const textColor = isPos ? '#10b981' : '#f43f5e';
        const badgeBg = isPos ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)';

        return (
          <View key={holding.symbol} style={styles.holdingCard}>
            <View style={styles.holdingTopRow}>
              <View>
                <Text style={styles.symbolText}>{holding.symbol}</Text>
                <Text style={styles.sharesText}>{holding.shares} Shares</Text>
              </View>

              <View style={[styles.pnlBadgeContainer, { backgroundColor: badgeBg }]}>
                <Text style={[styles.pnlBadgeText, { color: textColor }]}>
                  {isPos ? '▲ +' : '▼ '}${Math.abs(holding.pnlDollar).toFixed(2)} ({isPos ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
                </Text>
              </View>
            </View>

            <View style={styles.holdingDetailsRow}>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Avg Cost</Text>
                <Text style={styles.detailValue}>${holding.avgCost.toFixed(2)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Total Spent</Text>
                <Text style={styles.detailValue}>${holding.totalSpent.toFixed(2)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Live Price</Text>
                <Text style={styles.detailValue}>${holding.currentPrice.toFixed(2)}</Text>
              </View>
              <View style={styles.detailCol}>
                <Text style={styles.detailLabel}>Current Value</Text>
                <Text style={styles.detailValue}>${holding.currentValue.toFixed(2)}</Text>
              </View>
            </View>

            <View style={styles.holdingActionRow}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.buyBtn]}
                disabled={isPending}
                onPress={() => executeOrder({ symbol: holding.symbol, type: 'BUY', shares: 1, price: holding.currentPrice })}
              >
                <Text style={styles.btnText}>+ Buy Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.sellBtn]}
                disabled={isPending}
                onPress={() => executeOrder({ symbol: holding.symbol, type: 'SELL', shares: 1, price: holding.currentPrice })}
              >
                <Text style={styles.btnText}>- Sell Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17' },
  contentContainer: { padding: 16 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 16, marginTop: 8 },
  netWorthCard: {
    backgroundColor: '#141c2e',
    padding: 18,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  balanceLabel: { color: '#94a3b8', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '600' },
  netWorthValue: { color: '#ffffff', fontSize: 36, fontWeight: 'bold', marginTop: 4 },
  pnlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, marginBottom: 14 },
  pnlBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pnlMainText: { fontSize: 13, fontWeight: 'bold' },
  pnlSubLabel: { color: '#64748b', fontSize: 11, fontWeight: '500' },
  subBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingTop: 12, borderTopWidth: 1, borderColor: '#1e293b' },
  subBalanceText: { color: '#94a3b8', fontSize: 12 },
  highlightVal: { color: '#f8fafc', fontWeight: 'bold' },
  allocationLabel: { color: '#cbd5e1', fontSize: 12, fontWeight: '600', marginBottom: 6 },
  allocationBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  barSegment: { height: '100%' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: '#94a3b8', fontSize: 11 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginBottom: 12 },
  emptyText: { color: '#94a3b8', fontStyle: 'italic', marginVertical: 12 },
  holdingCard: {
    backgroundColor: '#141c2e',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  holdingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  symbolText: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', letterSpacing: 0.5 },
  sharesText: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  pnlBadgeContainer: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  pnlBadgeText: { fontSize: 13, fontWeight: 'bold' },
  holdingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  detailCol: { alignItems: 'center' },
  detailLabel: { color: '#64748b', fontSize: 10, marginBottom: 2, textTransform: 'uppercase', fontWeight: '600' },
  detailValue: { color: '#f8fafc', fontSize: 12, fontWeight: '600' },
  holdingActionRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  buyBtn: { backgroundColor: '#059669' },
  sellBtn: { backgroundColor: '#e11d48' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  text: { color: 'white', fontSize: 16 },
});