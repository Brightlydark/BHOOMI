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
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

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
import { HomeHeader } from '../../components/home/HomeHeader';
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

  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

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



  const isLoading = farmsLoading || insightsLoading;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Greeting Header */}
        <HomeHeader
          userName={user?.name ?? t('home.farmer')}
          criticalCount={criticalCount}
          avgTemp={avgTemp}
          isStable={(healthCounts.poor ?? 0) === 0 && (healthCounts.moderate ?? 0) === 0}
        />

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
            <QuickActionCard
              icon="map"
              label={t('home.actionMap')}
              iconColor="#10B981"
              onPress={() => router.push('/(tabs)/map')}
            />
            <QuickActionCard
              icon="bulb"
              label={t('home.actionInsights')}
              iconColor="#F59E0B"
              onPress={() => router.push('/(tabs)/insights')}
            />
            <QuickActionCard
              icon="cloud"
              label={t('home.actionWeather')}
              iconColor="#3B82F6"
              onPress={() => {}}
            />
            <QuickActionCard
              icon="person"
              label={t('home.actionProfile')}
              iconColor="#8B5CF6"
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
  const { colors } = useAppTheme();
  const statStyles = useMemo(() => createStatStyles(colors), [colors]);
  return (
    <View style={statStyles.pill}>
      <Ionicons name={icon as any} size={22} color={iconColor} />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function SectionTitle({ title, onMore }: { title: string; onMore?: () => void }) {
  const { colors } = useAppTheme();
  const sectionTitleStyles = useMemo(() => createSectionTitleStyles(colors), [colors]);
  return (
    <View style={sectionTitleStyles.row}>
      <Text style={sectionTitleStyles.text}>{title}</Text>
      {onMore && (
        <Pressable onPress={onMore}>
          <Text style={sectionTitleStyles.more}>See all</Text>
        </Pressable>
      )}
    </View>
  );
}

interface QuickActionProps {
  icon: string;
  label: string;
  iconColor: string;
  onPress: () => void;
}

function QuickActionCard({ icon, iconColor, label, onPress }: QuickActionProps) {
  const { colors } = useAppTheme();
  const actionStyles = useMemo(() => createActionStyles(colors), [colors]);
  return (
    <Pressable style={actionStyles.card} onPress={onPress}>
      <View style={[actionStyles.iconBg, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      <Text style={actionStyles.label}>{label}</Text>
    </Pressable>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  farmSelectorScroll: {
    backgroundColor: colors.background,
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 200,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  farmTabActive: {
    backgroundColor: isDark ? `${colors.primary}20` : colors.successLight,
    borderColor: colors.primary,
  },
  farmTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  farmTabTextActive: {
    color: colors.success,
  },
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  timeframeContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceActive,
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
    backgroundColor: colors.card,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timeframeText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  timeframeTextActive: {
    color: colors.text,
  },
  statDivider: { width: 1, backgroundColor: colors.border, marginVertical: 4 },
  sectionPad: { paddingHorizontal: 16, paddingTop: 16 },
  section: { paddingHorizontal: 16, paddingTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 },
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
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});

const createStatStyles = (colors: ColorPalette) => StyleSheet.create({
  pill: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 18, fontWeight: '700', color: colors.text },
  label: { fontSize: 11, color: colors.textSecondary },
});

const createSectionTitleStyles = (colors: ColorPalette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  text: { fontSize: 16, fontWeight: '700', color: colors.text },
  more: { fontSize: 13, color: colors.primary, fontWeight: '600' },
});

const createActionStyles = (colors: ColorPalette) => StyleSheet.create({
  card: {
    width: '46%',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    shadowColor: colors.shadow,
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
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
});
