import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CloudRain, Sun, Moon, Wind, Droplets, Cloud, CloudFog, CloudDrizzle, CloudSnow, Snowflake, CloudLightning } from 'lucide-react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { useWeather } from '../../hooks/useWeather';
import { LoadingSkeleton } from './LoadingSkeleton';

import { useTranslation } from 'react-i18next';

interface WeatherCardProps {
  lat?: number;
  lon?: number;
  title?: string;
  compact?: boolean;
}

const IconMap: Record<string, any> = {
  'Sun': Sun,
  'Moon': Moon,
  'Cloud': Cloud,
  'CloudFog': CloudFog,
  'CloudDrizzle': CloudDrizzle,
  'CloudRain': CloudRain,
  'CloudSnow': CloudSnow,
  'Snowflake': Snowflake,
  'CloudLightning': CloudLightning,
};

export const WeatherCard = React.memo(({ lat, lon, title, compact = false }: WeatherCardProps) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();

  const { weather, loading, error } = useWeather(lat, lon);
  
  const displayTitle = title || t('home.weatherSummary', 'Weather Forecast');

  if (!lat || !lon) {
    return null; // or empty state if we wanted
  }

  if (loading) {
    return (
      <View style={styles.container}>
         <LoadingSkeleton count={1} height={140} />
      </View>
    );
  }

  if (error || !weather) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.textSecondary }}>{t('common.weatherError', 'Failed to load weather data.')}</Text>
      </View>
    );
  }

  const WeatherIcon = weather.icon && IconMap[weather.icon] ? IconMap[weather.icon] : Cloud;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{displayTitle}</Text>
        <Text style={styles.subtitle}>{t('common.realTime', 'Real-time')}</Text>
      </View>

      <View style={styles.mainRow}>
        <View style={styles.tempContainer}>
          <WeatherIcon color={isDark ? '#FCD34D' : '#F59E0B'} size={48} />
          <Text style={styles.temperature}>{Math.round(weather.temperature)}°</Text>
        </View>
        <Text style={styles.condition}>{weather.condition}</Text>
      </View>

      {!compact && (
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <CloudRain color="#3B82F6" size={20} />
            <Text style={styles.statLabel}>{t('common.precipitation', 'Precipitation')}</Text>
            {/* If current rainfall is > 0 show it, otherwise show today's probability */}
            <Text style={styles.statValue}>
              {weather.rainfall > 0 
                ? `${weather.rainfall.toFixed(1)} mm` 
                : `${weather.forecast[0]?.rainfall ?? 0}%`}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Droplets color="#10B981" size={20} />
            <Text style={styles.statLabel}>{t('home.humidity', 'Humidity')}</Text>
            <Text style={styles.statValue}>{Math.round(weather.humidity)}%</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Wind color="#8B5CF6" size={20} />
            <Text style={styles.statLabel}>{t('common.wind', 'Wind')}</Text>
            <Text style={styles.statValue}>{Math.round(weather.windSpeed)} km/h</Text>
          </View>
        </View>
      )}
    </View>
  );
});

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    shadowColor: isDark ? colors.shadow : '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 0.05,
    shadowRadius: 12,
    elevation: 3,
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
    color: colors.success,
    fontWeight: '600',
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
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 22,
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
