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

interface InsightCardProps {
  insight: Insight;
  onPress?: () => void;
  compact?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onPress, compact = false }) => {
  const getSeverityStyle = (severity: Insight['severity']) => {
    switch (severity) {
      case 'low': return { bg: '#ECFDF5', text: '#10B981', border: '#10B981' };
      case 'medium': return { bg: '#FFFBEB', text: '#F59E0B', border: '#FCD34D' };
      case 'high': return { bg: '#FEF2F2', text: '#EF4444', border: '#FCA5A5' };
      case 'critical': return { bg: '#FEF2F2', text: '#DC2626', border: '#DC2626' };
      default: return { bg: '#F9FAFB', text: '#6B7280', border: '#E5E7EB' };
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
        { borderColor: severityStyle.border + '40', backgroundColor: '#FFFFFF' }
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
            <Lightbulb size={14} color="#F59E0B" />
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

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    borderWidth: 1,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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
    color: '#111827',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: '#6B7280',
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
    color: '#4B5563',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationContainer: {
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 6,
  },
  recommendation: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
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
