import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../common/Card';
import { HealthScoreRing } from './HealthScoreRing';
import { FarmHealthScore } from '../../services/analyticsService';
import { useAppTheme } from '../../theme/useAppTheme';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';

import { ShieldAlert, Sparkles, Activity } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

interface HealthScoreCardProps {
  healthData: FarmHealthScore;
  detailed?: boolean;
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = React.memo(({ healthData, detailed = false }) => {
  const { colors, isDark } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Card style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t('analytics.ui.farmHealthScore', 'Farm Health Score')}</Text>
        <View style={[styles.trendBadge, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
          {healthData.trend === 'up' && <TrendingUp color={colors.success} size={14} />}
          {healthData.trend === 'down' && <TrendingDown color={colors.danger} size={14} />}
          {healthData.trend === 'stable' && <Minus color={colors.textMuted} size={14} />}
          <Text style={[styles.trendText, { color: colors.textMuted }]} numberOfLines={1} adjustsFontSizeToFit>
            {healthData.trend === 'up' ? t('analytics.ui.improving', 'Improving') : healthData.trend === 'down' ? t('analytics.ui.declining', 'Declining') : t('analytics.ui.stable', 'Stable')}
            {' — '}{healthData.trendReason}
          </Text>
        </View>
      </View>

      <View style={styles.mainRow}>
        <HealthScoreRing score={healthData.score} color={healthData.color} size={110} />
        
        <View style={styles.infoCol}>
          <Text style={[styles.stateText, { color: healthData.color }]}>{healthData.state}</Text>
          <Text style={[styles.insightText, { color: colors.textMuted }]}>{healthData.insight}</Text>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View style={styles.breakdownRow}>
        {healthData.breakdown.map((item, idx) => (
          <View key={idx} style={styles.breakdownItem}>
            <Text style={[styles.bdLabel, { color: colors.textMuted }]}>{item.label}</Text>
            <Text style={[
              styles.bdValue, 
              item.status === 'critical' ? { color: colors.danger } :
              item.status === 'warning' ? { color: colors.warning } :
              { color: colors.text }
            ]} numberOfLines={1} adjustsFontSizeToFit>
              {item.value}
            </Text>
          </View>
        ))}
      </View>

      {detailed && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <View style={styles.detailedSection}>
            <View style={styles.sectionHeader}>
              <Activity size={16} color={colors.primary} />
              <Text style={[styles.detailedTitle, { color: colors.text }]}>{t('analytics.ui.aiInterpretation', 'AI Interpretation')}</Text>
            </View>
            {healthData.detailedExplanation.map((text, idx) => (
              <Text key={`exp-${idx}`} style={[styles.detailedText, { color: colors.textSecondary }]}>
                • {text}
              </Text>
            ))}

            <View style={[styles.sectionHeader, { marginTop: 16 }]}>
              <Sparkles size={16} color={colors.warning} />
              <Text style={[styles.detailedTitle, { color: colors.text }]}>{t('analytics.ui.recommendedActions', 'Recommended Actions')}</Text>
            </View>
            {healthData.recommendations.map((text, idx) => (
              <Text key={`rec-${idx}`} style={[styles.detailedText, { color: colors.textSecondary }]}>
                • {text}
              </Text>
            ))}
          </View>
        </>
      )}
    </Card>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 1,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    flexShrink: 1,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCol: {
    flex: 1,
    marginLeft: 20,
  },
  stateText: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  insightText: {
    fontSize: 13,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownItem: {
    alignItems: 'center',
    flex: 1,
  },
  bdLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  bdValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  detailedSection: {
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailedTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  detailedText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
    marginLeft: 4,
  }
});
