import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CloudRain, Sun, Wind, Droplets } from 'lucide-react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { useMemo } from 'react';

export const WeatherCard = () => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Weather Forecast</Text>
        <Text style={styles.subtitle}>Next 24 Hours</Text>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.tempContainer}>
          <Sun color="#F59E0B" size={48} />
          <Text style={styles.temperature}>32°</Text>
        </View>
        <Text style={styles.condition}>Sunny with brief showers expected</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <CloudRain color="#3B82F6" size={20} />
          <Text style={styles.statLabel}>Precipitation</Text>
          <Text style={styles.statValue}>20%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Droplets color="#10B981" size={20} />
          <Text style={styles.statLabel}>Humidity</Text>
          <Text style={styles.statValue}>65%</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <Wind color="#8B5CF6" size={20} />
          <Text style={styles.statLabel}>Wind</Text>
          <Text style={styles.statValue}>12 km/h</Text>
        </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  tempContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  temperature: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 12,
  },
  condition: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'space-between',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 6,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
