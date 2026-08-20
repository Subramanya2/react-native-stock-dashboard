import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { useSSEStore, MarketSession } from '../store/useSSEStore';
import { updateMarketSession } from '../api/stockApi';

interface ConnectionStatusHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onManualReconnect?: () => void;
}

export const ConnectionStatusHeader: React.FC<ConnectionStatusHeaderProps> = ({
  searchQuery,
  setSearchQuery,
  onManualReconnect,
}) => {
  const status = useSSEStore((state) => state.status);
  const session = useSSEStore((state) => state.session);

  const isConnected = status === 'connected';

  const getSessionBadge = () => {
    switch (session) {
      case 'PRE_MARKET':
        return { label: 'PRE-MARKET', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' };
      case 'AFTER_HOURS':
        return { label: 'AFTER-HOURS', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' };
      case 'DEMO_LIVE':
        return { label: '24/7 DEMO', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.15)' };
      default:
        return { label: 'REGULAR SESSION', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' };
    }
  };

  const badge = getSessionBadge();

  const handleSessionChange = (newSession: MarketSession) => {
    updateMarketSession(newSession).catch((err) => console.error('Failed to change session:', err));
  };

  return (
    <View style={styles.statusBar}>
      {/* Reconnecting Alert Banner */}
      {!isConnected && (
        <TouchableOpacity
          style={styles.reconnectBanner}
          onPress={onManualReconnect}
          activeOpacity={0.8}
        >
          <Text style={styles.reconnectText}>
            {status === 'connecting'
              ? 'Connecting to real-time market stream...'
              : '⚡ Stream Disconnected • Tap to Reconnect Now 🔄'}
          </Text>
        </TouchableOpacity>
      )}

      {/* Main Header Title Row */}
      <View style={styles.headerTitleRow}>
        <View>
          <Text style={styles.headerTitle}>Watchlist</Text>
          <Text style={styles.headerSubtitle}>Real-Time Streaming Quotes</Text>
        </View>

        <View style={[styles.marketPill, { backgroundColor: badge.bg, borderColor: badge.color }]}>
          <View style={[styles.glowingDot, { backgroundColor: isConnected ? badge.color : '#f43f5e' }]} />
          <Text style={[styles.marketPillText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>

      {/* Market Volatility Mode Selector */}
      <View style={styles.sessionSegmentCard}>
        <Text style={styles.sessionControlLabel}>MARKET SESSION SIMULATION</Text>
        <View style={styles.sessionBar}>
          <TouchableOpacity
            style={[styles.sessionChip, session === 'REGULAR_HOURS' && styles.sessionChipActive]}
            onPress={() => handleSessionChange('REGULAR_HOURS')}
          >
            <Text style={[styles.sessionChipText, session === 'REGULAR_HOURS' && styles.activeChipText]}>
              Regular
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sessionChip, session === 'PRE_MARKET' && styles.sessionChipActive]}
            onPress={() => handleSessionChange('PRE_MARKET')}
          >
            <Text style={[styles.sessionChipText, session === 'PRE_MARKET' && styles.activeChipText]}>
              Pre-Market
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sessionChip, session === 'AFTER_HOURS' && styles.sessionChipActive]}
            onPress={() => handleSessionChange('AFTER_HOURS')}
          >
            <Text style={[styles.sessionChipText, session === 'AFTER_HOURS' && styles.activeChipText]}>
              After-Hours
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.sessionChip, session === 'DEMO_LIVE' && styles.sessionChipActiveDemo]}
            onPress={() => handleSessionChange('DEMO_LIVE')}
          >
            <Text style={[styles.sessionChipText, session === 'DEMO_LIVE' && styles.activeChipText]}>
              24/7 Demo
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Live Stock Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search stock symbol or name..."
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

const styles = StyleSheet.create({
  statusBar: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    backgroundColor: '#0b0f17',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 16,
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  reconnectBanner: {
    backgroundColor: '#92400e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reconnectText: {
    color: '#fef3c7',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  marketPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  glowingDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  marketPillText: {
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  sessionSegmentCard: {
    backgroundColor: '#0b0f17',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  sessionControlLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sessionBar: {
    flexDirection: 'row',
    gap: 6,
  },
  sessionChip: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 2,
    borderRadius: 8,
    backgroundColor: '#141c2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionChipActive: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  sessionChipActiveDemo: {
    backgroundColor: '#8b5cf6',
    borderColor: '#8b5cf6',
  },
  sessionChipText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
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
    paddingHorizontal: 14,
    paddingVertical: 10,
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
});
