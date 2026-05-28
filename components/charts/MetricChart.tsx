import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { useMemo } from 'react';

interface MetricChartProps {
  data: { value: number; label: string }[];
  color?: string;
  title: string;
  suffix?: string;
}

const { width } = Dimensions.get('window');

export const MetricChart: React.FC<MetricChartProps> = ({ 
  data, 
  color = '#10B981', 
  title,
  suffix = ''
}) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        <LineChart
          data={data}
          width={width - 80}
          height={160}
          thickness={3}
          color={color}
          startFillColor={`${color}50`}
          endFillColor={`${color}00`}
          startOpacity={0.9}
          endOpacity={0.2}
          initialSpacing={10}
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideRules
          hideYAxisText={false}
          yAxisLabelSuffix={suffix}
          pointerConfig={{
            pointerStripHeight: 140,
            pointerStripColor: isDark ? colors.border : 'lightgray',
            pointerStripWidth: 2,
            pointerColor: isDark ? colors.border : 'lightgray',
            radius: 6,
            pointerLabelWidth: 80,
            pointerLabelHeight: 30,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: false,
            pointerLabelComponent: (items: any) => {
              return (
                <View style={styles.tooltip}>
                  <Text style={styles.tooltipText}>{items[0].value}{suffix}</Text>
                </View>
              );
            },
          }}
        />
      </View>
    </View>
  );
};

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginLeft: -10,
  },
  axisText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  tooltip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.text,
  },
  tooltipText: {
    color: colors.textInverse || colors.background,
    fontSize: 12,
    fontWeight: '600',
  },
});
