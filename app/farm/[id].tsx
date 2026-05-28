import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Droplets, Thermometer, Sprout, ShieldAlert, CheckCircle2, ChevronRight, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

import { useFarmStore } from '../../store/farmStore';
import { removeInsightsForFarm } from '../../services/insightStore';

import { useFarms } from '../../hooks/useFarms';
import { useLocation } from '../../hooks/useLocation';
import { useWeather } from '../../hooks/useWeather';
import { generateCropRecommendations, generateRecentActivity, calculateFarmHealthScore } from '../../services/analyticsService';
import { MetricChart } from '../../components/charts/MetricChart';
import { WeatherCard } from '../../components/common/WeatherCard';
import { HealthScoreCard } from '../../components/analytics/HealthScoreCard';
import { Card } from '../../components/common/Card';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { location } = useLocation();
  const { farms } = useFarms(location);
  
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { removeFarm } = useFarmStore();

  const farm = useMemo(() => farms.find(f => f.id === id), [id, farms]);
  const { weather } = useWeather(farm?.location?.latitude, farm?.location?.longitude);

  const { t } = useTranslation();
  const dynamicRecommendations = useMemo(() => farm ? generateCropRecommendations(farm, weather, t) : [], [farm, weather, t]);
  const dynamicActivities = useMemo(() => farm ? generateRecentActivity(farm, weather, t) : [], [farm, weather, t]);
  const farmHealthData = useMemo(() => farm ? calculateFarmHealthScore([farm], farm, weather, t) : null, [farm, weather, t]);

  if (!farm) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>{t('farmDetail.notFound', 'Farm not found')}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>{t('farmDetail.goBack', 'Go Back')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Generate mock chart data
  const moistureData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.floor(Math.random() * 20) + (farm.soilMoisture - 10),
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));

  const temperatureData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.floor(Math.random() * 5) + (farm.temperature - 2),
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));

  const getHealthColor = (health: string) => {
    if (health === 'good') return colors.success;
    if (health === 'moderate') return colors.warning;
    return colors.danger;
  };

  const handleDelete = () => {
    if (!farm) return;
    Alert.alert(
      t('farmDetail.removeFarm', "Remove Farm"),
      t('farmDetail.removeConfirmMsg', "Are you sure you want to remove this farm? All associated analytics and insights will be deleted."),
      [
        { text: t('farmDetail.cancel', "Cancel"), style: "cancel" },
        {
          text: t('farmDetail.remove', "Remove"),
          style: "destructive",
          onPress: async () => {
            removeFarm(farm.id);
            await removeInsightsForFarm(farm.id);
            router.replace('/(tabs)/map');
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft color={colors.text} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{farm.name}</Text>
        <TouchableOpacity style={styles.iconButton} onPress={handleDelete}>
          <Trash2 color={colors.danger} size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Premium Health Score */}
        {farmHealthData && <HealthScoreCard healthData={farmHealthData} detailed={true} />}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? `${colors.info}20` : '#DBEAFE' }]}>
              <Droplets color={colors.info} size={20} />
            </View>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>{farm.soilMoisture}%</Text>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t('farmDetail.moisture', 'Moisture')}</Text>
          </View>
          
          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? `${colors.danger}20` : '#FEE2E2' }]}>
              <Thermometer color={colors.danger} size={20} />
            </View>
            <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit>
              {weather ? Math.round(weather.temperature) : farm.temperature}°C
            </Text>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t('farmDetail.temperature', 'Temperature')}</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? `${getHealthColor(farm.cropHealth)}20` : '#ECFDF5' }]}>
              <Sprout color={getHealthColor(farm.cropHealth)} size={20} />
            </View>
            <Text style={[styles.statValue, { color: getHealthColor(farm.cropHealth) }]} numberOfLines={1} adjustsFontSizeToFit>
              {farm.cropHealth.toUpperCase()}
            </Text>
            <Text style={styles.statLabel} numberOfLines={1} adjustsFontSizeToFit>{t('farmDetail.health', 'Health')}</Text>
          </View>
        </View>

        {/* Address Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('farmDetail.locationDetails', 'Location Details')}</Text>
          <Text style={styles.infoText}>{farm.address}</Text>
          {farm.distance !== undefined && farm.distance !== null ? (
            <Text style={styles.distanceText}>📍 {t('farmDetail.kmAway', { distance: farm.distance.toFixed(2), defaultValue: `${farm.distance.toFixed(2)} km away` })}</Text>
          ) : null}
        </Card>

        {/* Weather Forecast */}
        <WeatherCard lat={farm.location.latitude} lon={farm.location.longitude} />

        {/* Historical Charts */}
        <MetricChart 
          title={t('farmDetail.soilMoistureHistory', "Soil Moisture History (Last 7 Days)")} 
          data={moistureData} 
          color={colors.info} 
          suffix="%" 
        />
        
        <MetricChart 
          title={t('farmDetail.temperatureHistory', "Temperature History (Last 7 Days)")} 
          data={temperatureData} 
          color={colors.danger} 
          suffix="°C" 
        />

        {/* Crop Recommendations */}
        <Card style={styles.listCard}>
          <Text style={styles.listTitle}>{t('farmDetail.cropRecommendations', 'Crop Recommendations')}</Text>
          {dynamicRecommendations.map((rec, i) => (
            <View key={i} style={styles.listItem}>
              <CheckCircle2 color={colors.success} size={20} />
              <Text style={styles.listText}>{rec}</Text>
            </View>
          ))}
        </Card>

        {/* Recent Activity */}
        <Card style={styles.listCard}>
          <Text style={styles.listTitle}>{t('farmDetail.recentActivity', 'Recent Activity')}</Text>
          {dynamicActivities.map((activity, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listText}>{activity.action}</Text>
                <Text style={styles.timeText}>{activity.time}</Text>
              </View>
              <ChevronRight color={colors.textMuted} size={16} />
            </View>
          ))}
        </Card>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.actionButton}>
          <ShieldAlert color={colors.textInverse || '#FFFFFF'} size={20} />
          <Text style={styles.actionButtonText}>{t('farmDetail.reportIssue', 'Report Issue')}</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 18,
    color: colors.danger,
    textAlign: 'center',
    marginTop: 40,
  },
  backButton: {
    padding: 16,
    backgroundColor: colors.border,
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  backText: {
    color: colors.text,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: colors.card,
    flex: 1,
    padding: 12,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  infoCard: {
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  distanceText: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '500',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  actionButtonText: {
    color: colors.textInverse || '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listCard: {
    marginBottom: 8,
    marginTop: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  listText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 12,
    marginTop: 2,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.info,
    marginLeft: 6,
  }
});
