import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

interface HoldingPositionCardProps {
  holding: {
    symbol: string;
    shares: number;
    avgCost: number;
    totalSpent: number;
    currentPrice: number;
    currentValue: number;
    pnlDollar: number;
    pnlPercent: number;
  };
  onOpenTradeModal: (symbol: string, currentPrice: number, type: 'BUY' | 'SELL') => void;
}

export const HoldingPositionCard: React.FC<HoldingPositionCardProps> = ({
  holding,
  onOpenTradeModal,
}) => {
  const isPos = holding.pnlDollar >= 0;

  return (
    <View style={styles.holdingCard}>
      {/* Header Row */}
      <View style={styles.holdingHeaderRow}>
        <View>
          <Text style={styles.holdingSymbol}>{holding.symbol}</Text>
          <Text style={styles.holdingShares}>
            {holding.shares} {holding.shares === 1 ? 'Share' : 'Shares'}
          </Text>
        </View>
        <View style={styles.holdingRightPnl}>
          <Text style={styles.holdingValText}>
            ${holding.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
          <Text style={[styles.holdingPnlBadgeText, { color: isPos ? '#10b981' : '#f43f5e' }]}>
            {isPos ? '▲ +' : '▼ '}${Math.abs(holding.pnlDollar).toFixed(2)} ({isPos ? '+' : ''}
            {holding.pnlPercent.toFixed(2)}%)
          </Text>
        </View>
      </View>

      {/* Metrics 2x2 Grid with Optimal Spacing */}
      <View style={styles.holdingDetailsGrid}>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Avg Buy Price</Text>
          <Text style={styles.detailValue}>${holding.avgCost.toFixed(2)}</Text>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Total Spent</Text>
          <Text style={styles.detailValue}>${holding.totalSpent.toFixed(2)}</Text>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Current Price</Text>
          <Text style={styles.detailValue}>${holding.currentPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.detailLabel}>Current Value</Text>
          <Text style={styles.detailValue}>${holding.currentValue.toFixed(2)}</Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.holdingActionRow}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.buyBtn]}
          onPress={() => onOpenTradeModal(holding.symbol, holding.currentPrice, 'BUY')}
        >
          <Text style={styles.btnText}>Buy More</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.sellBtn]}
          onPress={() => onOpenTradeModal(holding.symbol, holding.currentPrice, 'SELL')}
        >
          <Text style={styles.btnText}>Sell</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  holdingCard: {
    backgroundColor: '#141c2e',
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  holdingHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  holdingSymbol: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  holdingShares: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 1,
  },
  holdingRightPnl: {
    alignItems: 'flex-end',
  },
  holdingValText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  holdingPnlBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  holdingDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  detailCard: {
    width: '48.5%',
    backgroundColor: '#0b0f17',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  detailLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 3,
  },
  detailValue: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  holdingActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buyBtn: {
    backgroundColor: '#059669',
  },
  sellBtn: {
    backgroundColor: '#e11d48',
  },
  btnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
