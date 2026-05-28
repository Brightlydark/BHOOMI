import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AIPrediction } from '../../services/analyticsService';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { useMemo } from 'react';

import { useTranslation } from 'react-i18next';

interface AIPredictionCardProps {
  prediction: AIPrediction;
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = React.memo(({ prediction }) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { t } = useTranslation();

  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (prediction.level) {
      case 'critical': return isDark ? ['#7F1D1D', '#450A0A'] as const : ['#FEF2F2', '#FEE2E2'] as const;
      case 'warning': return isDark ? ['#78350F', '#451A03'] as const : ['#FFFBEB', '#FEF3C7'] as const;
      case 'info':
      default: return isDark ? ['#064E3B', '#022C22'] as const : ['#F0FDF4', '#DCFCE7'] as const;
    }
  };

  const getIconColor = () => {
    switch (prediction.level) {
      case 'critical': return colors.danger;
      case 'warning': return colors.warning;
      case 'info':
      default: return colors.success;
    }
  };

  const getIconName = () => {
    switch (prediction.type) {
      case 'moisture': return 'water-outline';
      case 'disease': return 'bug-outline';
      case 'irrigation': return 'rainy-outline';
      case 'stress': return 'warning-outline';
      case 'weather': return 'cloud-outline';
      default: return 'sparkles-outline';
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientCard}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={styles.titleText}>{t('analytics.ui.aiInsight', 'AI Insight')}</Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{t('analytics.ui.confidence', { value: prediction.confidence, defaultValue: `${prediction.confidence}% Confidence` })}</Text>
          </View>
        </View>

        <View style={styles.contentRow}>
          <View style={[styles.iconBox, { backgroundColor: `${getIconColor()}15` }]}>
            <Ionicons name={getIconName()} size={24} color={getIconColor()} />
          </View>
          <Text style={styles.predictionText}>{prediction.text}</Text>
        </View>
      </LinearGradient>
    </View>
  );
});

// ── Styles ─────────────────────────────────────────────────────
const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: isDark ? colors.shadow : '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: isDark ? colors.border : 'rgba(255,255,255,0.8)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: '800',
    color: isDark ? colors.text : '#4C1D95',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    backgroundColor: colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  predictionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 20,
  },
});
