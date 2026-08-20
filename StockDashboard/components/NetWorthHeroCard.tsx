import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { HOLDING_COLORS } from '../constants/mockData';

interface NetWorthHeroCardProps {
  totalNetWorth: number;
  totalCostBasis: number;
  totalPnlDollar: number;
  totalPnlPercent: number;
  cashBalance: number;
  holdingValuations: {
    symbol: string;
    currentValue: number;
  }[];
}

export const NetWorthHeroCard: React.FC<NetWorthHeroCardProps> = ({
  totalNetWorth,
  totalCostBasis,
  totalPnlDollar,
  totalPnlPercent,
  cashBalance,
  holdingValuations,
}) => {
  const isOverallPositive = totalPnlDollar >= 0;
  const cashPercent = totalNetWorth > 0 ? (cashBalance / totalNetWorth) * 100 : 100;

  return (
    <View style={styles.netWorthCard}>
      <Text style={styles.balanceLabel}>Total Net Worth</Text>

      <Text style={styles.netWorthValue}>
        ${totalNetWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </Text>

      {/* Prominent All-Time Profit / Loss Indicator */}
      {totalCostBasis > 0 && (
        <View style={styles.pnlRow}>
          <View
            style={[
              styles.pnlBadge,
              { backgroundColor: isOverallPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)' },
            ]}
          >
            <Text style={[styles.pnlMainText, { color: isOverallPositive ? '#10b981' : '#f43f5e' }]}>
              {isOverallPositive ? '▲ +' : '▼ '}
              ${Math.abs(totalPnlDollar).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              ({isOverallPositive ? '+' : ''}
              {totalPnlPercent.toFixed(2)}%)
            </Text>
          </View>
          <Text style={styles.pnlSubLabel}>Total Return</Text>
        </View>
      )}

      <View style={styles.subBalanceRow}>
        <Text style={styles.subBalanceText}>
          Cash Balance:{' '}
          <Text style={styles.highlightVal}>
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </Text>
        <Text style={styles.subBalanceText}>
          Invested Capital:{' '}
          <Text style={styles.highlightVal}>
            ${totalCostBasis.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </Text>
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
              <Text style={styles.legendText}>
                {h.symbol} ({pct.toFixed(0)}%)
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  balanceLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  netWorthValue: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: 4,
  },
  pnlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
    marginBottom: 14,
  },
  pnlBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pnlMainText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  pnlSubLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  subBalanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#1e293b',
  },
  subBalanceText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  highlightVal: {
    color: '#ffffff',
    fontWeight: '600',
  },
  allocationLabel: {
    color: '#94a3b8',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
    marginBottom: 8,
  },
  allocationBar: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#1e293b',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 12,
  },
  barSegment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
  },
});
