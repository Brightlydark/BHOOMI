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
          areaChart
          curved
          isAnimated
          animationDuration={1000}
          startFillColor={color}
          endFillColor={color}
          startOpacity={0.25}
          endOpacity={0.05}
          initialSpacing={15}
          spacing={(width - 110) / Math.max(1, data.length - 1)}
          noOfSections={4}
          yAxisTextStyle={styles.axisText}
          xAxisLabelTextStyle={styles.axisText}
          hideRules
          hideYAxisText={false}
          yAxisLabelSuffix={suffix}
          dataPointsRadius={4}
          dataPointsColor={color}
          focusEnabled
          showStripOnFocus
          showTextOnFocus
          pointerConfig={{
            pointerStripHeight: 140,
            pointerStripColor: color,
            pointerStripWidth: 2,
            pointerColor: colors.card,
            radius: 6,
            pointerLabelWidth: 80,
            pointerLabelHeight: 30,
            activatePointersOnLongPress: false,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: any) => {
              if (!items || !items[0]) return null;
              return (
                <View style={[styles.tooltip, { backgroundColor: color }]}>
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
    marginLeft: -15,
  },
  axisText: {
    color: colors.textMuted,
    fontSize: 10,
  },
  tooltip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  tooltipText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
