import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AIPrediction } from '../../services/analyticsService';

interface AIPredictionCardProps {
  prediction: AIPrediction;
}

export const AIPredictionCard: React.FC<AIPredictionCardProps> = ({ prediction }) => {
  const getGradientColors = (): readonly [string, string, ...string[]] => {
    switch (prediction.level) {
      case 'critical': return ['#FEF2F2', '#FEE2E2'] as const;
      case 'warning': return ['#FFFBEB', '#FEF3C7'] as const;
      case 'info':
      default: return ['#F0FDF4', '#DCFCE7'] as const;
    }
  };

  const getIconColor = () => {
    switch (prediction.level) {
      case 'critical': return '#DC2626';
      case 'warning': return '#D97706';
      case 'info':
      default: return '#16A34A';
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
            <Ionicons name="sparkles" size={16} color="#8B5CF6" />
            <Text style={styles.titleText}>AI Insight</Text>
          </View>
          <View style={styles.confidenceBadge}>
            <Text style={styles.confidenceText}>{prediction.confidence}% Confidence</Text>
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
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  gradientCard: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
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
    color: '#4C1D95',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  confidenceBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  confidenceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
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
    color: '#1F2937',
    lineHeight: 20,
  },
});
