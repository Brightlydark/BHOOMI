import React from 'react';
import { View, Text } from 'react-native';
import { LineChart, BarChart } from 'react-native-gifted-charts';
import { ChartCard } from './ChartCard';
import { ChartDataPoint } from '../../services/analyticsService';

export const MoistureChart = ({ 
  data, 
  trendValue, 
  trendDirection 
}: { 
  data: ChartDataPoint[], 
  trendValue?: string, 
  trendDirection?: 'up'|'down'|'neutral' 
}) => {
  return (
    <ChartCard 
      title="Moisture Trends" 
      icon="water" 
      iconColor="#06B6D4"
      trendValue={trendValue}
      trendDirection={trendDirection}
    >
      <LineChart
        data={data}
        color="#06B6D4"
        thickness={3}
        dataPointsColor="#0891B2"
        dataPointsRadius={4}
        startFillColor="#06B6D4"
        endFillColor="#E0F2FE"
        startOpacity={0.4}
        endOpacity={0.1}
        areaChart
        curved
        hideRules
        xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        width={280}
        height={140}
        maxValue={100}
        noOfSections={4}
        isAnimated
        animationDuration={1200}
      />
    </ChartCard>
  );
};

export const TemperatureChart = ({ 
  data, 
  trendValue, 
  trendDirection 
}: { 
  data: ChartDataPoint[], 
  trendValue?: string, 
  trendDirection?: 'up'|'down'|'neutral' 
}) => {
  return (
    <ChartCard 
      title="Temperature Trends" 
      icon="thermometer" 
      iconColor="#EF4444"
      trendValue={trendValue}
      trendDirection={trendDirection}
    >
      <LineChart
        data={data}
        color="#EF4444"
        thickness={3}
        dataPointsColor="#DC2626"
        dataPointsRadius={4}
        startFillColor="#EF4444"
        endFillColor="#FEE2E2"
        startOpacity={0.4}
        endOpacity={0.1}
        areaChart
        curved
        hideRules
        xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        width={280}
        height={140}
        maxValue={45}
        noOfSections={5}
        isAnimated
        animationDuration={1200}
      />
    </ChartCard>
  );
};

export const IrrigationTimeline = ({ data }: { data: ChartDataPoint[] }) => {
  const isLarge = data.length > 7;
  return (
    <ChartCard title="Irrigation Timeline" icon="calendar" iconColor="#3B82F6">
      <BarChart
        data={data}
        barWidth={isLarge ? 8 : 22}
        spacing={isLarge ? 8 : 24}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        noOfSections={3}
        maxValue={50}
        width={280}
        height={140}
        isAnimated
        animationDuration={1000}
      />
    </ChartCard>
  );
};

export const SoilHealthChart = ({ data }: { data: ChartDataPoint[] }) => {
  return (
    <ChartCard title="Soil Health Profile" icon="leaf" iconColor="#10B981">
      <BarChart
        data={data}
        barWidth={28}
        spacing={28}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 11, fontWeight: 'bold' }}
        noOfSections={4}
        maxValue={100}
        width={280}
        height={140}
        isAnimated
        animationDuration={1000}
      />
    </ChartCard>
  );
};

export const FarmComparisonChart = ({ data }: { data: ChartDataPoint[] }) => {
  return (
    <ChartCard title="Farm Productivity Comparison" icon="business" iconColor="#6366F1">
      <BarChart
        data={data}
        barWidth={24}
        spacing={20}
        roundedTop
        roundedBottom
        hideRules
        xAxisThickness={0}
        yAxisThickness={0}
        yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
        xAxisLabelTextStyle={{ color: '#6B7280', fontSize: 10, fontWeight: 'bold' }}
        noOfSections={4}
        maxValue={100}
        width={280}
        height={140}
        isAnimated
        animationDuration={1000}
      />
    </ChartCard>
  );
};
