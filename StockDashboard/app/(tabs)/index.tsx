import { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import StockRow from '../../components/StockRow';
import { ConnectionStatusHeader } from '../../components/ConnectionStatusHeader';
import { WATCHLIST } from '../../constants/mockData';
import { useMarketData } from '../../hooks/useMarketData';

export default function WatchlistScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { setupSSE } = useMarketData();
  const queryClient = useQueryClient();

  // Manual Pull-to-Refresh & Reconnect Handler
  const handleRefresh = async () => {
    setRefreshing(true);
    setupSSE();
    await queryClient.invalidateQueries();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  };

  // 200ms Debounce timer for smooth keyboard typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const filteredWatchlist = useMemo(() => {
    if (!debouncedQuery.trim()) return WATCHLIST;
    const query = debouncedQuery.trim().toLowerCase();
    return WATCHLIST.filter(
      (item) =>
        item.symbol.toLowerCase().includes(query) ||
        item.name.toLowerCase().includes(query)
    );
  }, [debouncedQuery]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ConnectionStatusHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onManualReconnect={handleRefresh}
      />
      {filteredWatchlist.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsText}>No stocks match "{debouncedQuery}"</Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          <FlashList
            data={filteredWatchlist}
            renderItem={({ item }) => (
              <StockRow
                symbol={item.symbol}
                name={item.name}
                openingPrice={item.openingPrice}
                brandColor={item.color}
              />
            )}
            // @ts-ignore
            estimatedItemSize={110}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={{ paddingBottom: 95 + insets.bottom }}
            keyExtractor={(item) => item.symbol}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f17',
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