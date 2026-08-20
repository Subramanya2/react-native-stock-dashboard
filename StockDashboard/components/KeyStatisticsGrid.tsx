import React from 'react';
import { StyleSheet, View, Text } from 'react-native';

interface KeyStatisticsGridProps {
  baseOpenPrice: number;
  currentPrice: number;
}

export const KeyStatisticsGrid: React.FC<KeyStatisticsGridProps> = ({
  baseOpenPrice,
  currentPrice,
}) => {
  return (
    <>
      <Text style={styles.sectionHeader}>Key Statistics</Text>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Open</Text>
          <Text style={styles.statValue}>${baseOpenPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>High</Text>
          <Text style={styles.statValue}>${(currentPrice * 1.03).toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Low</Text>
          <Text style={styles.statValue}>${(currentPrice * 0.97).toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>52-Wk Range</Text>
          <Text style={styles.statValue}>$110 - ${(currentPrice * 1.25).toFixed(2)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Volume</Text>
          <Text style={styles.statValue}>14.2M</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Market Cap</Text>
          <Text style={styles.statValue}>$2.85T</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#141c2e',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
