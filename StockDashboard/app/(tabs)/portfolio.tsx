import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { usePortfolioValuation } from '../../hooks/usePortfolioValuation';
import { NetWorthHeroCard } from '../../components/NetWorthHeroCard';
import { HoldingPositionCard } from '../../components/HoldingPositionCard';
import { TradeModal } from '../../components/TradeModal';
import { useMarketData } from '../../hooks/useMarketData';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PortfolioScreen() {
  const insets = useSafeAreaInsets();
  const {
    isLoading,
    error,
    cashBalance,
    holdings,
    holdingValuations,
    totalNetWorth,
    totalCostBasis,
    totalPnlDollar,
    totalPnlPercent,
  } = usePortfolioValuation();

  const [refreshing, setRefreshing] = useState(false);
  const { setupSSE } = useMarketData();
  const queryClient = useQueryClient();

  const handleRefresh = async () => {
    setRefreshing(true);
    setupSSE();
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  const [tradeModalState, setTradeModalState] = useState<{
    visible: boolean;
    symbol: string;
    currentPrice: number;
    initialType: 'BUY' | 'SELL';
  }>({
    visible: false,
    symbol: 'AAPL',
    currentPrice: 150.0,
    initialType: 'BUY',
  });

  const openTradeModal = (symbol: string, currentPrice: number, type: 'BUY' | 'SELL') => {
    setTradeModalState({
      visible: true,
      symbol,
      currentPrice,
      initialType: type,
    });
  };

  if (isLoading) return <SafeAreaView style={styles.container} edges={['top']}><Text style={styles.loadingText}>Loading Portfolio...</Text></SafeAreaView>;
  if (error) return <SafeAreaView style={styles.container} edges={['top']}><Text style={styles.errorText}>Error loading portfolio data.</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: 95 + insets.bottom }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#6366f1"
            colors={['#6366f1']}
          />
        }
      >
        <Text style={styles.title}>Portfolio Overview</Text>

        {/* Net Worth Hero Card */}
        <NetWorthHeroCard
          totalNetWorth={totalNetWorth}
          totalCostBasis={totalCostBasis}
          totalPnlDollar={totalPnlDollar}
          totalPnlPercent={totalPnlPercent}
          cashBalance={cashBalance}
          holdingValuations={holdingValuations}
        />

        {/* Holdings List Header */}
        <Text style={styles.sectionTitle}>Your Holdings ({holdings.length})</Text>

        {holdingValuations.map((holding) => (
          <HoldingPositionCard
            key={holding.symbol}
            holding={holding}
            onOpenTradeModal={openTradeModal}
          />
        ))}
      </ScrollView>

      {/* Trade Execution Modal */}
      <TradeModal
        visible={tradeModalState.visible}
        symbol={tradeModalState.symbol}
        currentPrice={tradeModalState.currentPrice}
        initialType={tradeModalState.initialType}
        onClose={() => setTradeModalState((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f17', maxWidth: 680, width: '100%', alignSelf: 'center' },
  contentContainer: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', marginBottom: 16, marginTop: 8 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  loadingText: { color: '#94a3b8', padding: 20, textAlign: 'center' },
  errorText: { color: '#f43f5e', padding: 20, textAlign: 'center' },
});