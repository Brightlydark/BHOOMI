// components/farms/QuickAnalysisPanel.tsx
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Farm } from '../../types/farm';
import { useInsights } from '../../hooks/useInsights';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';

interface QuickAnalysisPanelProps {
  farm: Farm;
  onViewDetails: () => void;
}

export const QuickAnalysisPanel: React.FC<QuickAnalysisPanelProps> = ({ farm, onViewDetails }) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();

  // Get AI insight specific to this farm
  const { insights } = useInsights([farm]);
  const topInsight = insights.length > 0 ? insights[0] : null;

  const getHealthColor = (health: string) => {
    if (health === 'good') return colors.success;
    if (health === 'moderate') return colors.warning;
    return colors.danger;
  };

  const getSeverityColor = (severity?: string) => {
    if (severity === 'critical') return colors.danger;
    if (severity === 'high') return colors.warning;
    if (severity === 'medium') return '#F59E0B'; // Amber
    return colors.success;
  };

  const aiMessage = topInsight 
    ? topInsight.title 
    : farm.cropHealth === 'good' 
      ? "Moisture and temperature are optimal. No immediate action required." 
      : "Monitoring conditions. Adjust irrigation schedule if needed.";

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>{farm.name}</Text>
          {farm.cropType ? (
            <Text style={styles.subtitle}>{farm.cropType}</Text>
          ) : null}
        </View>
        <View style={[styles.healthBadge, { backgroundColor: getHealthColor(farm.cropHealth) + '20' }]}>
          <View style={[styles.healthDot, { backgroundColor: getHealthColor(farm.cropHealth) }]} />
          <Text style={[styles.healthText, { color: getHealthColor(farm.cropHealth) }]}>
            {farm.cropHealth.charAt(0).toUpperCase() + farm.cropHealth.slice(1)}
          </Text>
        </View>
      </View>

      {/* Quick Metrics */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <View style={[styles.metricIconBg, { backgroundColor: isDark ? `${colors.info}20` : '#EFF6FF' }]}>
            <Ionicons name="water" size={20} color={colors.info} />
          </View>
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{farm.soilMoisture}%</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>{t('map.soilMoisture', 'Moisture')}</Text>
          </View>
        </View>
        
        <View style={styles.metricDivider} />
        
        <View style={styles.metricItem}>
          <View style={[styles.metricIconBg, { backgroundColor: isDark ? `${colors.danger}20` : '#FEF2F2' }]}>
            <Ionicons name="thermometer" size={20} color={colors.danger} />
          </View>
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{farm.temperature}°C</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>{t('map.temperature', 'Temp')}</Text>
          </View>
        </View>

        <View style={styles.metricDivider} />
        
        <View style={styles.metricItem}>
          <View style={[styles.metricIconBg, { backgroundColor: isDark ? `${colors.success}20` : '#F0FDF4' }]}>
            <Ionicons name="partly-sunny" size={20} color={colors.success} />
          </View>
          <View style={styles.metricTextWrap}>
            <Text style={styles.metricValue} numberOfLines={1} adjustsFontSizeToFit>{farm.humidity}%</Text>
            <Text style={styles.metricLabel} numberOfLines={1}>Humidity</Text>
          </View>
        </View>
      </View>

      {/* AI Insight Box */}
      <View style={[styles.aiBox, { borderColor: topInsight ? getSeverityColor(topInsight.severity) + '40' : colors.border }]}>
        <View style={styles.aiBoxHeader}>
          <View style={styles.aiTitleRow}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={styles.aiBoxTitle}>Quick Analysis</Text>
          </View>
          {topInsight && (
            <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(topInsight.severity) + '15' }]}>
              <Text style={[styles.severityText, { color: getSeverityColor(topInsight.severity) }]}>
                {topInsight.severity.toUpperCase()}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.aiBoxText} numberOfLines={2}>{aiMessage}</Text>
      </View>

      {/* Action Button */}
      <Pressable style={styles.detailsButton} onPress={onViewDetails}>
        <Text style={styles.detailsButtonText}>Detailed Insights</Text>
        <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
      </Pressable>
    </View>
  );
};

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  titleWrap: {
    flex: 1,
    marginRight: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceActive,
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricTextWrap: {
    flexShrink: 1,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  metricLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  metricDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: 10,
  },
  aiBox: {
    backgroundColor: isDark ? `${colors.primary}10` : '#F8FAFC',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  aiBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  aiTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
  },
  aiBoxText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  detailsButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  detailsButtonText: {
    color: colors.textInverse || '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
