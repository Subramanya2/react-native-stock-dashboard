import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import StockRow from '../../components/StockRow';
import { useSSEStore, MarketSession } from '../../store/useSSEStore';
import { updateMarketSession } from '../../api/stockApi';

// Mock data.
const WATCHLIST = [
  { symbol: 'AAPL', openingPrice: 146.50 },
  { symbol: 'GOOGL', openingPrice: 2750.00 },
  { symbol: 'TSLA', openingPrice: 718.00 },
  { symbol: 'MSFT', openingPrice: 294.00 },
];

// Connection & Market Session status header
const ConnectionStatus = () => {
  const status = useSSEStore((state) => state.status);
  const session = useSSEStore((state) => state.session);

  const statusColor = status === 'connected' ? '#10b981' : '#ef4444';

  const getSessionBadge = () => {
    switch (session) {
      case 'PRE_MARKET': return { label: '🟡 PRE-MARKET', color: '#f59e0b' };
      case 'AFTER_HOURS': return { label: '🔵 AFTER-HOURS', color: '#3b82f6' };
      case 'DEMO_LIVE': return { label: '🟢 24/7 DEMO', color: '#8b5cf6' };
      default: return { label: '🟢 REGULAR SESSION', color: '#10b981' };
    }
  };

  const badge = getSessionBadge();

  const handleSessionChange = (newSession: MarketSession) => {
    updateMarketSession(newSession).catch((err) => console.error('Failed to change session:', err));
  };

  return (
    <View style={styles.statusBar}>
      <View style={styles.topStatusRow}>
        <View style={styles.statusIndicator}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>Stream: {status.toUpperCase()}</Text>
        </View>

        <View style={[styles.badgePill, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      </View>

      {/* Session Switcher Pills */}
      <View style={styles.sessionBar}>
        <Text style={styles.sessionLabel}>Mode:</Text>
        <TouchableOpacity
          style={[styles.sessionChip, session === 'REGULAR_HOURS' && styles.sessionChipActive]}
          onPress={() => handleSessionChange('REGULAR_HOURS')}
        >
          <Text style={[styles.sessionChipText, session === 'REGULAR_HOURS' && styles.activeChipText]}>Regular</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionChip, session === 'PRE_MARKET' && styles.sessionChipActive]}
          onPress={() => handleSessionChange('PRE_MARKET')}
        >
          <Text style={[styles.sessionChipText, session === 'PRE_MARKET' && styles.activeChipText]}>Pre-Mkt</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionChip, session === 'AFTER_HOURS' && styles.sessionChipActive]}
          onPress={() => handleSessionChange('AFTER_HOURS')}
        >
          <Text style={[styles.sessionChipText, session === 'AFTER_HOURS' && styles.activeChipText]}>After-Hrs</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sessionChip, session === 'DEMO_LIVE' && styles.sessionChipActive]}
          onPress={() => handleSessionChange('DEMO_LIVE')}
        >
          <Text style={[styles.sessionChipText, session === 'DEMO_LIVE' && styles.activeChipText]}>24/7 Demo</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingTop: 44,
    paddingBottom: 12,
    backgroundColor: '#1f2937',
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  topStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#9ca3af',
    fontSize: 12,
    fontWeight: 'bold',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionLabel: {
    color: '#9ca3af',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 4,
  },
  sessionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
  },
  sessionChipActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  sessionChipText: {
    color: '#9ca3af',
    fontSize: 11,
  },
  activeChipText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});