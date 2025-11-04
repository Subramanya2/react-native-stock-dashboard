import { StyleSheet, View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import StockRow from '../../components/StockRow';
import { useSSEStore } from '../../store/useSSEStore';

// Mock data.
const WATCHLIST = [
  { symbol: 'AAPL', openingPrice: 150.00 },
  { symbol: 'GOOGL', openingPrice: 2800.00 },
  { symbol: 'TSLA', openingPrice: 700.00 },
  { symbol: 'MSFT', openingPrice: 300.00 },
];

// Status bar to show connection
const ConnectionStatus = () => {
  const status = useSSEStore((state) => state.status);
  const color = status === 'connected' ? '#10b981' : '#ef4444';

  return (
    <View style={[styles.statusBar, { backgroundColor: color }]}>
      <Text style={styles.statusText}>
        Market Data: {status.toUpperCase()}
      </Text>
    </View>
  );
};

export default function WatchlistScreen() {
  return (
    <View style={styles.container}>
      <ConnectionStatus />
      <FlashList
        data={WATCHLIST}
        renderItem={({ item }) => (
          <StockRow
            symbol={item.symbol}
            openingPrice={item.openingPrice}
          />
        )}
        // @ts-ignore
        estimatedItemSize={60}
        keyExtractor={(item) => item.symbol}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  statusBar: {
    padding: 8,
    alignItems: 'center',
    paddingTop: 40,
  },
  statusText: {
    color: 'white',
    fontWeight: 'bold',
  },
});