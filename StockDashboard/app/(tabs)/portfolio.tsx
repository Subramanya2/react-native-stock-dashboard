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

  if (isLoading && !data) return <View style={styles.container}><Text style={styles.text}>Loading Portfolio...</Text></View>;
  if (error && !data) return <View style={styles.container}><Text style={styles.text}>Error loading portfolio.</Text></View>;

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
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>My Portfolio</Text>

      {/* Net Worth Summary Card */}
      <View style={styles.netWorthCard}>
        <Text style={styles.balanceLabel}>Total Net Worth</Text>

        <Text style={styles.netWorthValue}>
          ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </Text>

        {/* Prominent All-Time Profit / Loss Indicator */}
        {totalCostBasis > 0 && (
          <View style={styles.pnlRow}>
            <Text style={[styles.pnlMainText, { color: isOverallPositive ? '#10b981' : '#ef4444' }]}>
              {isOverallPositive ? '▲ +' : '▼ '}
              ${Math.abs(totalPnlDollar).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({isOverallPositive ? '+' : ''}{totalPnlPercent.toFixed(2)}%)
            </Text>
            <Text style={styles.pnlSubLabel}>Total Unrealized Return</Text>
          </View>
        )}

        <View style={styles.subBalanceRow}>
          <Text style={styles.subBalanceText}>Available Cash: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
          <Text style={styles.subBalanceText}>Total Invested: ${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
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
            const pct = totalNetWorth > 0 ? (h.currentValue / totalNetWorth) * 100 : 0;
            return (
              <View key={h.symbol} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: HOLDING_COLORS[h.symbol] || '#6b7280' }]} />
                <Text style={styles.legendText}>{h.symbol} ({pct.toFixed(0)}%)</Text>
              </View>
            );
          })}
        </View>
      </View>

      <Text style={styles.sectionTitle}>Holdings & Profit / Loss</Text>

      {holdings.length === 0 && (
        <Text style={styles.emptyText}>No active stock holdings.</Text>
      )}

      {holdingValuations.map((holding) => {
        const isPos = holding.pnlDollar >= 0;
        const color = isPos ? '#10b981' : '#ef4444';

        return (
          <View key={holding.symbol} style={styles.holdingCard}>
            <View style={styles.holdingTopRow}>
              <View>
                <Text style={styles.symbolText}>{holding.symbol}</Text>
                <Text style={styles.sharesText}>{holding.shares} Shares</Text>
              </View>

              <View style={styles.pnlBadgeContainer}>
                <Text style={[styles.pnlBadgeText, { color }]}>
                  {isPos ? '+' : ''}${holding.pnlDollar.toFixed(2)} ({isPos ? '+' : ''}{holding.pnlPercent.toFixed(2)}%)
                </Text>
                <Text style={styles.pnlSubText}>Unrealized P/L</Text>
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
                <Text style={styles.btnText}>+ Buy 1 Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.sellBtn]}
                disabled={isPending}
                onPress={() => executeOrder({ symbol: holding.symbol, type: 'SELL', shares: 1, price: holding.currentPrice })}
              >
                <Text style={styles.btnText}>- Sell 1 Share</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
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
  netWorthValue: { color: '#ffffff', fontSize: 34, fontWeight: 'bold', marginTop: 4 },
  pnlRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2, marginBottom: 12 },
  pnlMainText: { fontSize: 16, fontWeight: 'bold' },
  pnlSubLabel: { color: '#6b7280', fontSize: 11, fontWeight: '500' },
  subBalanceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16, paddingTop: 10, borderTopWidth: 1, borderColor: '#374151' },
  subBalanceText: { color: '#9ca3af', fontSize: 12 },
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
  holdingCard: {
    backgroundColor: '#1f2937',
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  holdingTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  symbolText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  sharesText: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  pnlBadgeContainer: { alignItems: 'flex-end' },
  pnlBadgeText: { fontSize: 15, fontWeight: 'bold' },
  pnlSubText: { color: '#6b7280', fontSize: 10, marginTop: 1 },
  holdingDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#374151',
    marginBottom: 10,
  },
  detailCol: { alignItems: 'center' },
  detailLabel: { color: '#9ca3af', fontSize: 10, marginBottom: 2 },
  detailValue: { color: '#ffffff', fontSize: 12, fontWeight: '600' },
  holdingActionRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  buyBtn: { backgroundColor: '#059669' },
  sellBtn: { backgroundColor: '#dc2626' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 11 },
  text: { color: 'white', fontSize: 16 },
});