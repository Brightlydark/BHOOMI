// components/insights/InsightCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Insight } from '../../types/insight';
import { Card } from '../common/Card';
import { Ionicons } from '@expo/vector-icons';

interface InsightCardProps {
  insight: Insight;
  onPress?: () => void;
  compact?: boolean;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onPress, compact = false }) => {
  const getSeverityColor = (severity: Insight['severity']) => {
    switch (severity) {
      case 'low':
        return '#10B981';
      case 'medium':
        return '#F59E0B';
      case 'high':
        return '#EF4444';
      case 'critical':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  const getTypeIcon = (type: Insight['type']) => {
    switch (type) {
      case 'soil_analysis':
        return 'flask';
      case 'weather_forecast':
        return 'cloud';
      case 'irrigation_recommendation':
        return 'water';
      case 'fertilizer_recommendation':
        return 'leaf';
      case 'pest_control':
        return 'bug';
      case 'crop_suggestion':
        return 'nutrition';
      default:
        return 'information-circle';
    }
  };

  return (
    <Card onPress={onPress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={getTypeIcon(insight.type)}
            size={24}
            color="#4F46E5"
          />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{insight.title}</Text>
          <View
            style={[
              styles.severityBadge,
              { backgroundColor: getSeverityColor(insight.severity) },
            ]}
          >
            <Text style={styles.severityText}>
              {insight.severity.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.description}>{insight.description}</Text>

      {!compact && (
        <View style={styles.recommendationContainer}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="bulb" size={16} color="#F59E0B" />
            <Text style={styles.recommendationLabel}>Recommendation</Text>
          </View>
          <Text style={styles.recommendation}>{insight.recommendation}</Text>
        </View>
      )}

      <Text style={styles.timestamp}>
        {new Date(insight.createdAt).toLocaleDateString()}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationContainer: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    marginLeft: 6,
  },
  recommendation: {
    fontSize: 13,
    color: '#78350F',
    lineHeight: 18,
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
