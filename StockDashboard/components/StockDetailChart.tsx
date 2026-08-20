import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface StockDetailChartProps {
  filteredHistory: { date: string; price: number }[];
  isLoading: boolean;
  error: any;
  themeColor: string;
  chartWidth: number;
  chartHeight: number;
}

export const StockDetailChart: React.FC<StockDetailChartProps> = ({
  filteredHistory,
  isLoading,
  error,
  themeColor,
  chartWidth,
  chartHeight,
}) => {
  // Dynamic SVG Chart path calculation
  const chartPath = useMemo(() => {
    if (filteredHistory.length < 2) return { linePath: '', areaPath: '' };

    const padding = 10;
    const prices = filteredHistory.map((h) => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;

    const points = filteredHistory.map((h, index) => {
      const x = padding + (index / (filteredHistory.length - 1)) * (chartWidth - 2 * padding);
      const y = chartHeight - padding - ((h.price - min) / range) * (chartHeight - 2 * padding);
      return { x, y };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      linePath += ` L ${points[i].x} ${points[i].y}`;
    }

    const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`;

    return { linePath, areaPath };
  }, [filteredHistory, chartWidth, chartHeight]);

  return (
    <View style={styles.chartContainer}>
      {isLoading ? (
        <ActivityIndicator size="large" color={themeColor} style={{ height: chartHeight }} />
      ) : error ? (
        <Text style={styles.errorText}>Failed to load stock chart data.</Text>
      ) : (
        <Svg width={chartWidth} height={chartHeight}>
          <Defs>
            <LinearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor={themeColor} stopOpacity="0.35" />
              <Stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
            </LinearGradient>
          </Defs>
          <Path d={chartPath.areaPath} fill="url(#chartGradient)" />
          <Path
            d={chartPath.linePath}
            fill="none"
            stroke={themeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
        </Svg>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    backgroundColor: '#141c2e',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  errorText: {
    color: '#f43f5e',
    marginVertical: 40,
  },
});
