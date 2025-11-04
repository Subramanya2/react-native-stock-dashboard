import { StyleSheet, View, Text } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchPortfolio } from '../../api/stockApi';

export default function PortfolioScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['portfolio'],
    queryFn: fetchPortfolio,
    refetchInterval: 60000, // Refetch every 60 seconds
  });

  if (isLoading) return <Text style={styles.text}>Loading Portfolio...</Text>;
  if (error) return <Text style={styles.text}>Error loading portfolio.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Portfolio</Text>
      {data?.holdings.map((holding: any) => (
        <View key={holding.symbol} style={styles.holding}>
          <Text style={styles.text}>{holding.symbol}</Text>
          <Text style={styles.text}>{holding.shares} Shares</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#111827' },
  title: { fontSize: 24, fontWeight: 'bold', color: 'white', marginBottom: 16 },
  holding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#1f2937',
    borderRadius: 8,
    marginBottom: 8,
  },
  text: { color: 'white', fontSize: 16 },
});