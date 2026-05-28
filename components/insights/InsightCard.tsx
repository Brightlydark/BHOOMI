import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Insight } from '../../types/insight';
import { Card } from '../common/Card';
import { 
  FlaskConical, 
  CloudSun, 
  Droplets, 
  Leaf, 
  Bug, 
  Sprout, 
  Info,
  Lightbulb,
  ChevronRight
} from 'lucide-react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { useMemo } from 'react';

interface InsightCardProps {
  insight: Insight;
  onPress?: () => void;
  compact?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onPress, compact = false }) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const getSeverityStyle = (severity: Insight['severity']) => {
    switch (severity) {
      case 'low': return { bg: isDark ? `${colors.success}20` : colors.successLight, text: colors.success, border: colors.success };
      case 'medium': return { bg: isDark ? `${colors.warning}20` : colors.warningLight, text: colors.warning, border: colors.warning };
      case 'high': return { bg: isDark ? `${colors.danger}20` : colors.dangerLight, text: colors.danger, border: colors.danger };
      case 'critical': return { bg: isDark ? `${colors.danger}40` : colors.dangerLight, text: colors.danger, border: colors.danger };
      default: return { bg: isDark ? `${colors.info}20` : colors.infoLight, text: colors.info, border: colors.info };
    }
  };

  const severityStyle = getSeverityStyle(insight.severity);

  const renderIcon = (type: Insight['type']) => {
    const props = { size: 20, color: severityStyle.text };
    switch (type) {
      case 'soil_analysis': return <FlaskConical {...props} />;
      case 'weather_forecast': return <CloudSun {...props} />;
      case 'irrigation_recommendation': return <Droplets {...props} />;
      case 'fertilizer_recommendation': return <Leaf {...props} />;
      case 'pest_control': return <Bug {...props} />;
      case 'crop_suggestion': return <Sprout {...props} />;
      default: return <Info {...props} />;
    }
  };

  return (
    <Card 
      onPress={onPress} 
      style={[
        styles.card, 
        compact ? styles.cardCompact : undefined,
        { borderColor: severityStyle.border + '40', backgroundColor: colors.card }
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconContainer, { backgroundColor: severityStyle.bg }]}>
          {renderIcon(insight.type)}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title} numberOfLines={1}>{insight.title}</Text>
          <Text style={styles.timestamp}>
            {new Date(insight.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: severityStyle.bg, borderColor: severityStyle.border }]}>
          <Text style={[styles.severityText, { color: severityStyle.text }]}>
            {insight.severity.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={compact ? 2 : undefined}>
        {insight.description}
      </Text>

      {!compact && insight.recommendation && (
        <View style={styles.recommendationContainer}>
          <View style={styles.recommendationHeader}>
            <Lightbulb size={14} color={colors.warning} />
            <Text style={styles.recommendationLabel}>Recommendation</Text>
          </View>
          <Text style={styles.recommendation}>{insight.recommendation}</Text>
        </View>
      )}

      {onPress && compact && (
        <View style={styles.actionRow}>
          <Text style={[styles.actionText, { color: severityStyle.text }]}>View Details</Text>
          <ChevronRight size={14} color={severityStyle.text} />
        </View>
      )}
    </Card>
  );
};

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  card: {
    marginBottom: 16,
    borderWidth: 1,
    padding: 20,
    borderRadius: 20,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  cardCompact: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 16,
  },
  recommendationContainer: {
    backgroundColor: isDark ? `${colors.warning}15` : colors.warningLight,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
    marginLeft: 6,
  },
  recommendation: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 22,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
});
