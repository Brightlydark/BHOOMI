// app/(tabs)/index.tsx  (Home / Dashboard)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';

import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { InsightCard } from '../../components/insights/InsightCard';
import { useLocation } from '../../hooks/useLocation';
import { useFarms } from '../../hooks/useFarms';
import { useInsights } from '../../hooks/useInsights';
import { useUserStore } from '../../store/userStore';
import { CropHealthStatus } from '../../types/farm';
import { useState, useMemo } from 'react';

import { 
  generateMoistureTrends, 
  generateTemperatureTrends, 
  generateIrrigationTimeline, 
  generateSoilHealthData, 
  generateFarmComparison,
  generateAIPrediction
} from '../../services/analyticsService';
import { 
  MoistureChart, 
  TemperatureChart, 
  IrrigationTimeline, 
  SoilHealthChart, 
  FarmComparisonChart 
} from '../../components/analytics/AnalyticsCharts';
import { AIPredictionCard } from '../../components/analytics/AIPredictionCard';

// Health status styling
const healthColors: Record<CropHealthStatus, { bg: string; text: string; icon: string }> = {
  good: { bg: '#ECFDF5', text: '#059669', icon: '🌿' },
  moderate: { bg: '#FEFCE8', text: '#CA8A04', icon: '🌾' },
  poor: { bg: '#FEF2F2', text: '#DC2626', icon: '⚠️' },
};

export default function HomeScreen() {
  const { t } = useTranslation();
  const { user } = useUserStore();
  const { location } = useLocation();
  const { farms, loading: farmsLoading, refreshFarms, selectedFarm, selectFarm } = useFarms(location);
  const { insights, loading: insightsLoading, criticalCount } = useInsights(farms);
  const [refreshing, setRefreshing] = useState(false);
  const [timeframe, setTimeframe] = useState<7 | 30 | 90>(7);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshFarms();
    setRefreshing(false);
  };

  // Filter farms for stats based on selection
  const displayFarms = selectedFarm ? [selectedFarm] : farms;

  // Compute aggregated farm stats
  const avgMoisture =
    displayFarms.length > 0
      ? Math.round(displayFarms.reduce((s, f) => s + f.soilMoisture, 0) / displayFarms.length)
      : 0;
  const avgTemp =
    displayFarms.length > 0
      ? Math.round((displayFarms.reduce((s, f) => s + f.temperature, 0) / displayFarms.length) * 10) / 10
      : 0;
  const healthCounts = displayFarms.reduce(
    (acc, f) => ({ ...acc, [f.cropHealth]: (acc[f.cropHealth] ?? 0) + 1 }),
    {} as Record<CropHealthStatus, number>
  );

  // Generate Chart Data
  const moistureInfo = useMemo(() => generateMoistureTrends(avgMoisture, timeframe), [avgMoisture, timeframe]);
  const tempInfo = useMemo(() => generateTemperatureTrends(avgTemp, timeframe), [avgTemp, timeframe]);
  const irrigationData = useMemo(() => generateIrrigationTimeline(timeframe), [selectedFarm, timeframe]);
  const soilData = useMemo(() => selectedFarm ? generateSoilHealthData(selectedFarm.id) : [], [selectedFarm]);
  const comparisonInfo = useMemo(() => !selectedFarm ? generateFarmComparison(farms) : { data: [] }, [farms, selectedFarm]);
  const aiPrediction = useMemo(() => generateAIPrediction(selectedFarm), [selectedFarm, avgMoisture, avgTemp]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('home.goodMorning');
    if (hour < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const isLoading = farmsLoading || insightsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10B981"
          />
        }
      >
        {/* Greeting Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()}</Text>
            <Text style={styles.userName}>
              {user?.name ?? t('home.farmer')} 👋
            </Text>
          </View>
          <Pressable
            style={styles.notifBtn}
            onPress={() => router.push('/(tabs)/profile')}
          >
            {criticalCount > 0 && (
              <View style={styles.notifDot}>
                <Text style={styles.notifDotText}>{criticalCount}</Text>
              </View>
            )}
            <Ionicons name="notifications-outline" size={24} color="#111827" />
          </Pressable>
        </View>

        {/* Farm Selector */}
        {!isLoading && farms.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.farmSelectorScroll}
            contentContainerStyle={styles.farmSelectorContainer}
          >
            <Pressable
              style={[styles.farmTab, !selectedFarm && styles.farmTabActive]}
              onPress={() => selectFarm(null)}
            >
              <Text style={[styles.farmTabText, !selectedFarm && styles.farmTabTextActive]}>
                All Farms
              </Text>
            </Pressable>
            {farms.map((farm) => (
              <Pressable
                key={farm.id}
                style={[styles.farmTab, selectedFarm?.id === farm.id && styles.farmTabActive]}
                onPress={() => selectFarm(farm)}
              >
                <Text 
                  style={[styles.farmTabText, selectedFarm?.id === farm.id && styles.farmTabTextActive]}
                  numberOfLines={1}
                >
                  {farm.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Quick Stats Banner */}
        {isLoading ? (
          <View style={styles.sectionPad}>
            <LoadingSkeleton count={1} height={80} />
          </View>
        ) : (
          <View style={styles.statsBanner}>
            <StatPill
              icon="business"
              iconColor="#3B82F6"
              label={selectedFarm ? "Active Field" : t('home.statFarms')}
              value={String(displayFarms.length)}
            />
            <View style={styles.statDivider} />
            <StatPill
              icon="water"
              iconColor="#06B6D4"
              label={t('home.statMoisture')}
              value={`${avgMoisture}%`}
            />
            <View style={styles.statDivider} />
            <StatPill
              icon="thermometer"
              iconColor="#EF4444"
              label={t('home.statTemp')}
              value={`${avgTemp}°C`}
            />
          </View>
        )}

        {/* Crop Health Overview */}
        <View style={styles.section}>
          <SectionTitle
            title={t('home.cropHealthTitle')}
            onMore={() => router.push('/(tabs)/map')}
          />
          {isLoading ? (
            <LoadingSkeleton count={3} height={72} />
          ) : (
            <View style={styles.healthRow}>
              {(['good', 'moderate', 'poor'] as CropHealthStatus[]).map((status) => {
                const cfg = healthColors[status];
                return (
                  <View key={status} style={[styles.healthCard, { backgroundColor: cfg.bg }]}>
                    <Text style={styles.healthEmoji}>{cfg.icon}</Text>
                    <Text style={[styles.healthCount, { color: cfg.text }]}>
                      {healthCounts[status] ?? 0}
                    </Text>
                    <Text style={[styles.healthLabel, { color: cfg.text }]}>
                      {t(`map.healthStatus.${status}`)}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Analytics Section */}
        {!isLoading && (
          <View style={styles.section}>
            <SectionTitle title="Analytics & Trends" />
            
            <View style={styles.timeframeContainer}>
              {([7, 30, 90] as const).map((days) => (
                <Pressable
                  key={days}
                  style={[styles.timeframeBtn, timeframe === days && styles.timeframeBtnActive]}
                  onPress={() => setTimeframe(days)}
                >
                  <Text style={[styles.timeframeText, timeframe === days && styles.timeframeTextActive]}>
                    {days}D
                  </Text>
                </Pressable>
              ))}
            </View>

            <AIPredictionCard prediction={aiPrediction} />
            
            {/* Scrollable Horizontal Charts or Stacked? Stacked is better for readability */}
            <MoistureChart 
              data={moistureInfo.data} 
              trendValue={moistureInfo.trendValue}
              trendDirection={moistureInfo.trendDirection} 
            />
            <TemperatureChart 
              data={tempInfo.data} 
              trendValue={tempInfo.trendValue}
              trendDirection={tempInfo.trendDirection}
            />
            
            {selectedFarm ? (
              <>
                <IrrigationTimeline data={irrigationData} />
                <SoilHealthChart data={soilData} />
              </>
            ) : (
              <FarmComparisonChart data={comparisonInfo.data} />
            )}
          </View>
        )}

        {/* Recent Insights */}
        <View style={styles.section}>
          <SectionTitle
            title={t('home.insightsTitle')}
            onMore={() => router.push('/(tabs)/insights')}
          />
          {isLoading ? (
            <LoadingSkeleton count={2} />
          ) : insights.length === 0 ? (
            <View style={styles.emptyInsights}>
              <Text style={styles.emptyText}>{t('home.noInsights')}</Text>
            </View>
          ) : (
            insights.slice(0, 3).map((insight) => (
              <InsightCard key={insight.id} insight={insight} compact />
            ))
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            <QuickAction
              icon="map"
              label={t('home.actionMap')}
              color="#10B981"
              onPress={() => router.push('/(tabs)/map')}
            />
            <QuickAction
              icon="bulb"
              label={t('home.actionInsights')}
              color="#F59E0B"
              onPress={() => router.push('/(tabs)/insights')}
            />
            <QuickAction
              icon="cloud"
              label={t('home.actionWeather')}
              color="#3B82F6"
              onPress={() => {}}
            />
            <QuickAction
              icon="person"
              label={t('home.actionProfile')}
              color="#8B5CF6"
              onPress={() => router.push('/(tabs)/profile')}
            />
          </View>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Sub-components ─────────────────────────────────────────────
function StatPill({
  icon,
  iconColor,
  label,
  value,
}: {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}) {
  return (
    <View style={statStyles.pill}>
      <Ionicons name={icon as any} size={18} color={iconColor} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, onMore }: { title: string; onMore?: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={sectionTitleStyles.row}>
      <Text style={sectionTitleStyles.text}>{title}</Text>
      {onMore && (
        <Pressable onPress={onMore}>
          <Text style={sectionTitleStyles.more}>{t('common.seeAll')}</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuickAction({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={actionStyles.card} onPress={onPress}>
      <View style={[actionStyles.iconBg, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={26} color={color} />
      </View>
      <Text style={actionStyles.label}>{label}</Text>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: { fontSize: 14, color: '#6B7280' },
  userName: { fontSize: 22, fontWeight: '700', color: '#111827' },
  notifBtn: { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  notifDotText: { fontSize: 10, fontWeight: '700', color: '#FFFFFF' },
  farmSelectorScroll: {
    backgroundColor: '#F9FAFB',
    maxHeight: 56,
  },
  farmSelectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    flexDirection: 'row',
  },
  farmTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  farmTabActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
  },
  farmTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  farmTabTextActive: {
    color: '#059669',
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#8C92AC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  timeframeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 12,
  },
  timeframeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  timeframeTextActive: {
    color: '#111827',
  },
  statDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  sectionPad: { paddingHorizontal: 16, paddingTop: 16 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  healthRow: { flexDirection: 'row', gap: 10 },
  healthCard: {
    flex: 1,
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 4,
  },
  healthEmoji: { fontSize: 22 },
  healthCount: { fontSize: 22, fontWeight: '700' },
  healthLabel: { fontSize: 12, fontWeight: '500' },
  emptyInsights: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  emptyText: { color: '#9CA3AF', fontSize: 14 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

const statStyles = StyleSheet.create({
  pill: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 18, fontWeight: '700', color: '#111827' },
  label: { fontSize: 11, color: '#6B7280' },
});

const sectionTitleStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  text: { fontSize: 16, fontWeight: '700', color: '#111827' },
  more: { fontSize: 13, color: '#10B981', fontWeight: '600' },
});

const actionStyles = StyleSheet.create({
  card: {
    width: '46%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: { fontSize: 13, fontWeight: '600', color: '#374151' },
});
