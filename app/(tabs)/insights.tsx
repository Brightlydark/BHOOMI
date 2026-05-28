// app/(tabs)/insights.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { InsightCard } from '../../components/insights/InsightCard';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { useInsights } from '../../hooks/useInsights';
import { useFarmStore } from '../../store/farmStore';
import { useLocation } from '../../hooks/useLocation';
import { useFarms } from '../../hooks/useFarms';
import { Insight, InsightType } from '../../types/insight';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

// Filter tabs
const FILTER_TABS: { key: 'all' | InsightType; labelKey: string; icon: string }[] = [
  { key: 'all', labelKey: 'insights.filterAll', icon: 'apps' },
  { key: 'irrigation_recommendation', labelKey: 'insights.filterIrrigation', icon: 'water' },
  { key: 'soil_analysis', labelKey: 'insights.filterSoil', icon: 'layers' },
  { key: 'weather_forecast', labelKey: 'insights.filterWeather', icon: 'cloud' },
  { key: 'fertilizer_recommendation', labelKey: 'insights.filterCrop', icon: 'leaf' },
  { key: 'pest_control', labelKey: 'insights.filterPest', icon: 'bug' },
  { key: 'crop_suggestion', labelKey: 'insights.filterCropSuggestion', icon: 'nutrition' },
];

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { location } = useLocation();
  const { loading: farmsLoading } = useFarms(location);

  // Always use the full farm list from global store for insights
  const { farms, selectedFarm, selectFarm } = useFarmStore();

  const { insights, loading: insightsLoading, error, refreshInsights, criticalCount } =
    useInsights(farms);

  const [activeFilter, setActiveFilter] = useState<'all' | InsightType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshInsights();
    setRefreshing(false);
  };

  // Filter by selected farm (if any) and by active tab
  // Use strict equality for farmId to isolate only that farm's data
  const farmFilteredInsights = selectedFarm
    ? insights.filter((i) => i.farmId === selectedFarm.id)
    : insights;

  const filteredInsights =
    activeFilter === 'all'
      ? farmFilteredInsights
      : farmFilteredInsights.filter((i) => i.type === activeFilter);

  // Recalculate critical count for the filtered view
  const currentCriticalCount = farmFilteredInsights.filter(i => i.severity === 'critical' || i.severity === 'high').length;

  const loading = farmsLoading || (insightsLoading && !refreshing);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {selectedFarm ? `${selectedFarm.name} Insights` : t('insights.title')}
          </Text>
          {farms.length > 0 && (
            <Text style={styles.headerSubtitle}>
              {selectedFarm 
                ? t('insights.farmSpecific', 'Showing farm-specific data and alerts') 
                : t('insights.monitoringFields', { count: farms.length, defaultValue: `Monitoring ${farms.length} field${farms.length !== 1 ? 's' : ''}` })}
            </Text>
          )}
        </View>
        {currentCriticalCount > 0 && (
          <View style={styles.alertBadge}>
            <Ionicons name="warning" size={13} color="#FFFFFF" />
            <Text style={styles.alertBadgeText}>{currentCriticalCount} {t('alerts.urgent', 'urgent')}</Text>
          </View>
        )}
      </View>

      {/* Farm Selector (if multiple farms) */}
      {!loading && farms.length > 1 && (
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
              {t('analytics.ui.allFarms', 'All Farms')}
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

      {/* Summary Cards */}
      {!loading && farms.length > 0 && (
        <View style={styles.summaryRow}>
          <SummaryCard
            icon="flash"
            iconColor={colors.primary}
            bg={isDark ? `${colors.primary}20` : colors.successLight}
            label={t('insights.summaryTotal', 'Total Insights')}
            value={String(farmFilteredInsights.length)}
          />
          <SummaryCard
            icon="warning"
            iconColor={colors.danger}
            bg={isDark ? `${colors.danger}20` : colors.dangerLight}
            label={t('alerts.title', 'Alerts')}
            value={String(currentCriticalCount)}
          />
          <SummaryCard
            icon="business"
            iconColor={colors.info}
            bg={isDark ? `${colors.info}20` : colors.infoLight}
            label={selectedFarm ? t('analytics.ui.activeField', 'Active Field') : t('insights.summaryFarms', 'Fields')}
            value={selectedFarm ? "1" : String(farms.length)}
          />
        </View>
      )}

      {/* Filter Tabs */}
      {!loading && insights.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? farmFilteredInsights.length
                : farmFilteredInsights.filter((i) => i.type === tab.key).length;
            
            return (
              <Pressable
                key={tab.key}
                style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Ionicons
                  name={tab.icon as any}
                  size={16}
                  color={activeFilter === tab.key ? colors.textInverse || '#FFFFFF' : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.filterTabText,
                    activeFilter === tab.key && styles.filterTabTextActive,
                  ]}
                >
                  {t(tab.labelKey)}
                </Text>
                {count > 0 && tab.key !== 'all' && (
                  <View
                    style={[
                      styles.filterCount,
                      activeFilter === tab.key && styles.filterCountActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterCountText,
                        activeFilter === tab.key && styles.filterCountTextActive,
                      ]}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.listContent,
          (loading || error || farms.length === 0 || filteredInsights.length === 0) && styles.emptyScrollContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {loading ? (
          <LoadingSkeleton count={4} />
        ) : error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title={t('insights.errorTitle')}
            description={t('insights.errorDescription')}
            actionLabel={t('common.retry')}
            onAction={refreshInsights}
          />
        ) : farms.length === 0 ? (
          <EmptyState
            icon="map-outline"
            title="No Farms Loaded"
            description="Open the Map tab to load nearby farms, then come back for personalised insights."
          />
        ) : filteredInsights.length === 0 ? (
          <EmptyState
            icon="bulb-outline"
            title={t('insights.emptyTitle')}
            description={t('insights.emptyDescription')}
          />
        ) : (
          filteredInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ icon, iconColor, bg, label, value }: { icon: string; iconColor: string; bg: string; label: string; value: string; }) {
  const { colors } = useAppTheme();
  const summaryStyles = useMemo(() => createSummaryStyles(colors), [colors]);
  return (
    <View style={summaryStyles.summaryCard}>
      <View style={[summaryStyles.summaryIconBg, { backgroundColor: bg }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={summaryStyles.summaryTextContainer}>
        <Text style={summaryStyles.summaryValue}>{value}</Text>
        <Text style={summaryStyles.summaryLabel}>{label}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.danger,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  alertBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
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
    backgroundColor: isDark ? `${colors.primary}20` : colors.text,
    borderColor: isDark ? colors.primary : colors.text,
  },
  farmTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  farmTabTextActive: {
    color: isDark ? colors.primary : '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    backgroundColor: colors.background,
  },
  filterScroll: {
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    maxHeight: 60,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterTabActive: {
    backgroundColor: isDark ? `${colors.primary}20` : (colors.success || '#059669'),
    borderColor: isDark ? colors.primary : (colors.success || '#059669'),
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTabTextActive: {
    color: isDark ? colors.primary : '#FFFFFF',
  },
  filterCount: {
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: 'center',
  },
  filterCountActive: {
    backgroundColor: isDark ? `${colors.primary}40` : '#FFFFFF30',
  },
  filterCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterCountTextActive: {
    color: isDark ? colors.primary : '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: 400,
  }
});

const createSummaryStyles = (colors: ColorPalette) => StyleSheet.create({
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: colors.card,
    borderRadius: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTextContainer: {
    alignItems: 'center',
    gap: 2,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
});
