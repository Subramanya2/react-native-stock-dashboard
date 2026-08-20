import { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
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
const ConnectionStatus = ({ searchQuery, setSearchQuery }: { searchQuery: string; setSearchQuery: (q: string) => void }) => {
  const status = useSSEStore((state) => state.status);
  const session = useSSEStore((state) => state.session);

  const statusColor = status === 'connected' ? '#10b981' : '#f43f5e';

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
      {/* Reconnecting Alert Banner */}
      {status !== 'connected' && (
        <View style={styles.reconnectBanner}>
          <Text style={styles.reconnectText}>⚡ {status === 'connecting' ? 'Connecting to SSE market stream...' : 'Stream Disconnected (Attempting Reconnect)'}</Text>
        </View>
      )}

      <View style={styles.headerTitleRow}>
        <Text style={styles.headerTitle}>Watchlist</Text>
        <View style={[styles.badgePill, { backgroundColor: badge.color }]}>
          <Text style={styles.badgeText}>{badge.label}</Text>
        </View>
      </View>

      <View style={styles.topStatusRow}>
        <View style={styles.statusIndicator}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={styles.statusText}>Live Data Feed: {status.toUpperCase()}</Text>
        </View>
      </View>

      {/* Session Switcher Pills */}
      <View style={styles.sessionBar}>
        <Text style={styles.sessionLabel}>Vol Mode:</Text>
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

      {/* Live Stock Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search symbol (e.g. AAPL, TSLA)..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearchQuery('')}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function WatchlistScreen() {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWatchlist = useMemo(() => {
    if (!searchQuery.trim()) return WATCHLIST;
    return WATCHLIST.filter((item) =>
      item.symbol.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery]);

  return (
    <View style={styles.container}>
      <ConnectionStatus searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      {filteredWatchlist.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No stocks match "{searchQuery}"</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={filteredWatchlist}
            renderItem={({ item }) => (
              <StockRow
                symbol={item.symbol}
                openingPrice={item.openingPrice}
              />
            )}
            // @ts-ignore
            estimatedItemSize={72}
            keyExtractor={(item) => item.symbol}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f17',
  },
  statusBar: {
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 14,
    backgroundColor: '#141c2e',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 8,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  reconnectBanner: {
    backgroundColor: '#92400e',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  reconnectText: {
    color: '#fef3c7',
    fontSize: 11,
    fontWeight: 'bold',
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
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  sessionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  sessionLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 2,
  },
  sessionChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#0b0f17',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  sessionChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  sessionChipText: {
    color: '#94a3b8',
    fontSize: 10,
  },
  activeChipText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  searchContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  searchInput: {
    backgroundColor: '#0b0f17',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  clearBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  clearBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    paddingTop: 4,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    color: '#94a3b8',
    fontSize: 14,
    fontStyle: 'italic',
  },
});