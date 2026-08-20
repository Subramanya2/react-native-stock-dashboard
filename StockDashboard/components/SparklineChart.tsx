import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface SparklineChartProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
}

const SparklineChartComponent: React.FC<SparklineChartProps> = ({
  data,
  width = 90,
  height = 32,
  strokeWidth = 2,
}) => {
  const pathData = useMemo(() => {
    if (!data || data.length < 2) return { path: '', strokeColor: '#6b7280' };

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min === 0 ? 1 : max - min;
    const padding = 3;

    const points = data.map((val, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const path = `M ${points.join(' L ')}`;
    const strokeColor = data[data.length - 1] >= data[0] ? '#10b981' : '#ef4444';

    return { path, strokeColor };
  }, [data, width, height]);

  if (!data || data.length < 2) {
    return <View style={[styles.placeholder, { width, height }]} />;
  }

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height}>
        <Path
          d={pathData.path}
          fill="none"
          stroke={pathData.strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#1f2937',
    borderRadius: 4,
    opacity: 0.5,
  },
});

export const SparklineChart = React.memo(SparklineChartComponent);
