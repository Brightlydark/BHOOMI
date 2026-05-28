import React from 'react';
import { View, Text } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { ChartCard } from './ChartCard';
import { ChartDataPoint } from '../../services/analyticsService';
import { useAppTheme } from '../../theme/useAppTheme';

export const MoistureChart = React.memo(({ 
  data, 
  trendValue, 
  trendDirection 
}: { 
  data: ChartDataPoint[], 
  trendValue?: string, 
  trendDirection?: 'up'|'down'|'neutral' 
}) => {
  const { colors, isDark } = useAppTheme();
  return (
    <ChartCard 
      title="Moisture Trends" 
      icon="water" 
      iconColor={colors.info}
      trendValue={trendValue}
      trendDirection={trendDirection}
    >
      <LineChart
        data={data}
        color={colors.info}
        thickness={3}
        dataPointsColor={colors.info}
        dataPointsRadius={4}
        startFillColor={colors.info}
        endFillColor={isDark ? `${colors.info}30` : '#E0F2FE'}
        startOpacity={0.4}
        endOpacity={0.1}
        areaChart
        curved
        hideRules
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, width: 40, textAlign: 'center', marginLeft: -10 }}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextNumberOfLines={1}
        width={280}
        height={140}
        maxValue={100}
        noOfSections={4}
        isAnimated
        animationDuration={1200}
      />
    </ChartCard>
  );
});

export const TemperatureChart = React.memo(({ 
  data, 
  trendValue, 
  trendDirection 
}: { 
  data: ChartDataPoint[], 
  trendValue?: string, 
  trendDirection?: 'up'|'down'|'neutral' 
}) => {
  const { colors, isDark } = useAppTheme();
  return (
    <ChartCard 
      title="Temperature Trends" 
      icon="thermometer" 
      iconColor={colors.danger}
      trendValue={trendValue}
      trendDirection={trendDirection}
    >
      <LineChart
        data={data}
        color={colors.danger}
        thickness={3}
        dataPointsColor={colors.danger}
        dataPointsRadius={4}
        startFillColor={colors.danger}
        endFillColor={isDark ? `${colors.danger}30` : '#FEE2E2'}
        startOpacity={0.4}
        endOpacity={0.1}
        areaChart
        curved
        hideRules
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, width: 40, textAlign: 'center', marginLeft: -10 }}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextNumberOfLines={1}
        width={280}
        height={140}
        maxValue={45}
        noOfSections={5}
        isAnimated
        animationDuration={1200}
      />
    </ChartCard>
  );
});

export const IrrigationTimeline = React.memo(({ data }: { data: ChartDataPoint[] }) => {
  const { colors } = useAppTheme();
  const isLarge = data.length > 7;
  return (
    <ChartCard title="Irrigation Timeline" icon="calendar" iconColor={colors.primary}>
      <BarChart
        data={data}
        barWidth={isLarge ? 8 : 22}
        spacing={isLarge ? 8 : 24}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextNumberOfLines={1}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, width: 40, textAlign: 'center' }}
        noOfSections={3}
        maxValue={50}
        width={280}
        height={140}
        isAnimated
        animationDuration={1000}
      />
    </ChartCard>
  );
});

export const SoilHealthChart = React.memo(({ data }: { data: ChartDataPoint[] }) => {
  const { colors } = useAppTheme();
  return (
    <ChartCard title="Soil Health Profile" icon="leaf" iconColor={colors.success}>
      <BarChart
        data={data}
        barWidth={28}
        spacing={28}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextNumberOfLines={1}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11, fontWeight: 'bold', width: 40, textAlign: 'center' }}
        noOfSections={4}
        maxValue={100}
        width={280}
        height={140}
        isAnimated
        animationDuration={1000}
      />
    </ChartCard>
  );
});

export const FarmComparisonChart = React.memo(({ data }: { data: ChartDataPoint[] }) => {
  const { colors } = useAppTheme();
  return (
    <ChartCard title="Farm Productivity Comparison" icon="business" iconColor={colors.warning}>
      <BarChart
        data={data}
        barWidth={24}
        spacing={20}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: colors.textSecondary, fontSize: 10 }}
        yAxisTextNumberOfLines={1}
        xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 10, fontWeight: 'bold', width: 40, textAlign: 'center' }}
        noOfSections={4}
        maxValue={100}
        width={280}
        height={140}
        isAnimated
        animationDuration={1000}
      />
    </ChartCard>
  );
});
