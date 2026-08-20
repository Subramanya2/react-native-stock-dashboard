import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio, PortfolioHolding } from '../../api/stockApi';
import { useOrderExecution } from '../../hooks/useOrderExecution';

export default function PortfolioScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  const { mutate: executeOrder, isPending } = useOrderExecution();

  if (isLoading && !data) return <View style={styles.container}><Text style={styles.text}>Loading Portfolio...</Text></View>;
  if (error && !data) return <View style={styles.container}><Text style={styles.text}>Error loading portfolio.</Text></View>;

  const cashBalance = data?.cashBalance ?? 10000;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>My Portfolio</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available Cash</Text>
        <Text style={styles.balanceValue}>${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
      </View>

      <Text style={styles.sectionTitle}>Holdings</Text>

      {data?.holdings.length === 0 && (
        <Text style={styles.emptyText}>No active stock holdings.</Text>
      )}

      {data?.holdings.map((holding: PortfolioHolding) => (
        <View key={holding.symbol} style={styles.holding}>
          <View>
            <Text style={styles.symbolText}>{holding.symbol}</Text>
            <Text style={styles.sharesText}>{holding.shares} Shares</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.buyBtn]}
              disabled={isPending}
              onPress={() => executeOrder({ symbol: holding.symbol, type: 'BUY', shares: 1, price: 150 })}
            >
              <Text style={styles.btnText}>+ Buy 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.sellBtn]}
              disabled={isPending}
              onPress={() => executeOrder({ symbol: holding.symbol, type: 'SELL', shares: 1, price: 150 })}
            >
              <Text style={styles.btnText}>- Sell 1</Text>
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
  balanceCard: {
    backgroundColor: '#1f2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#374151',
  },
  balanceLabel: { color: '#9ca3af', fontSize: 14, marginBottom: 4 },
  balanceValue: { color: '#10b981', fontSize: 28, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#e5e7eb', marginBottom: 12 },
  emptyText: { color: '#9ca3af', fontStyle: 'italic', marginVertical: 12 },
  holding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#1f2937',
    borderRadius: 10,
    marginBottom: 10,
  },
  symbolText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  sharesText: { color: '#9ca3af', fontSize: 14, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  buyBtn: { backgroundColor: '#059669' },
  sellBtn: { backgroundColor: '#dc2626' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  text: { color: 'white', fontSize: 16 },
});