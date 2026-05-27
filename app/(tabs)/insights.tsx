// app/(tabs)/insights.tsx
import React, { useState } from 'react';
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
import { Insight, InsightType } from '../../types/insight';

// Filter tabs
const FILTER_TABS: { key: 'all' | InsightType; labelKey: string; icon: string }[] = [
  { key: 'all', labelKey: 'insights.filterAll', icon: 'apps' },
  { key: 'irrigation_recommendation', labelKey: 'insights.filterIrrigation', icon: 'water' },
  { key: 'soil_analysis', labelKey: 'insights.filterSoil', icon: 'layers' },
  { key: 'weather_forecast', labelKey: 'insights.filterWeather', icon: 'cloud' },
  { key: 'crop_suggestion', labelKey: 'insights.filterCrop', icon: 'leaf' },
  { key: 'pest_control', labelKey: 'insights.filterPest', icon: 'bug' },
];

// Severity badge colors
const SEVERITY_COLORS: Record<string, { bg: string; text: string }> = {
  critical: { bg: '#FEF2F2', text: '#DC2626' },
  high: { bg: '#FFF7ED', text: '#EA580C' },
  medium: { bg: '#FEFCE8', text: '#CA8A04' },
  low: { bg: '#F0FDF4', text: '#16A34A' },
};

export default function InsightsScreen() {
  const { t } = useTranslation();
  const { farms } = useFarmStore();
  const { insights, loading, error, refreshInsights, criticalCount } = useInsights(farms);

  const [activeFilter, setActiveFilter] = useState<'all' | InsightType>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshInsights();
    setRefreshing(false);
  };

  const filteredInsights =
    activeFilter === 'all'
      ? insights
      : insights.filter((i) => i.type === activeFilter);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('insights.title')}</Text>
        {criticalCount > 0 && (
          <View style={styles.alertBadge}>
            <Ionicons name="warning" size={14} color="#FFFFFF" />
            <Text style={styles.alertBadgeText}>{criticalCount}</Text>
          </View>
        )}
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryRow}>
        <SummaryCard
          icon="checkmark-circle"
          iconColor="#10B981"
          label={t('insights.summaryTotal')}
          value={String(insights.length)}
        />
        <SummaryCard
          icon="warning"
          iconColor="#EF4444"
          label={t('insights.summaryCritical')}
          value={String(criticalCount)}
        />
        <SummaryCard
          icon="business"
          iconColor="#3B82F6"
          label={t('insights.summaryFarms')}
          value={String(farms.length)}
        />
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTER_TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.filterTab, activeFilter === tab.key && styles.filterTabActive]}
            onPress={() => setActiveFilter(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeFilter === tab.key ? '#FFFFFF' : '#6B7280'}
            />
            <Text
              style={[
                styles.filterTabText,
                activeFilter === tab.key && styles.filterTabTextActive,
              ]}
            >
              {t(tab.labelKey)}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Content */}
      {loading && !refreshing ? (
        <ScrollView contentContainerStyle={styles.contentPadding}>
          <LoadingSkeleton count={4} />
        </ScrollView>
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title={t('insights.errorTitle')}
          description={t('insights.errorDescription')}
          actionLabel={t('common.retry')}
          onAction={refreshInsights}
        />
      ) : filteredInsights.length === 0 ? (
        <EmptyState
          icon="bulb-outline"
          title={t('insights.emptyTitle')}
          description={t('insights.emptyDescription')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#10B981"
            />
          }
        >
          {filteredInsights.map((insight) => (
            <InsightCard key={insight.id} insight={insight} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Summary Card ─────────────────────────────────────────────
interface SummaryCardProps {
  icon: string;
  iconColor: string;
  label: string;
  value: string;
}

function SummaryCard({ icon, iconColor, label, value }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <Ionicons name={icon as any} size={22} color={iconColor} />
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  alertBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    gap: 4,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },
  filterScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    flexDirection: 'row',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterTabActive: {
    backgroundColor: '#10B981',
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },
  contentPadding: {
    padding: 16,
  },
  listContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
});
