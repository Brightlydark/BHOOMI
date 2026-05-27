// components/maps/FarmMarker.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { Farm } from '../../types/farm';
import { Ionicons } from '@expo/vector-icons';

interface FarmMarkerProps {
  farm: Farm;
  isSelected: boolean;
  onPress: (farm: Farm) => void;
}

export const FarmMarker: React.FC<FarmMarkerProps> = ({
  farm,
  isSelected,
  onPress,
}) => {
  const getHealthColor = (health: Farm['cropHealth']) => {
    switch (health) {
      case 'good':
        return '#10B981';
      case 'moderate':
        return '#F59E0B';
      case 'poor':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getHealthIcon = (health: Farm['cropHealth']) => {
    switch (health) {
      case 'good':
        return 'checkmark-circle';
      case 'moderate':
        return 'alert-circle';
      case 'poor':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  return (
    <Marker
      coordinate={farm.location}
      onPress={() => onPress(farm)}
      pinColor={isSelected ? '#4F46E5' : getHealthColor(farm.cropHealth)}
    >
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <View style={styles.calloutHeader}>
            <Text style={styles.farmName}>{farm.name}</Text>
            <View
              style={[
                styles.healthBadge,
                { backgroundColor: getHealthColor(farm.cropHealth) },
              ]}
            >
              <Ionicons
                name={getHealthIcon(farm.cropHealth)}
                size={14}
                color="#FFFFFF"
              />
              <Text style={styles.healthText}>
                {farm.cropHealth.charAt(0).toUpperCase() + farm.cropHealth.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.address} numberOfLines={2}>
            {farm.address}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="water" size={16} color="#3B82F6" />
              <Text style={styles.statLabel}>Moisture</Text>
              <Text style={styles.statValue}>{farm.soilMoisture}%</Text>
            </View>

            <View style={styles.statItem}>
              <Ionicons name="thermometer" size={16} color="#EF4444" />
              <Text style={styles.statLabel}>Temperature</Text>
              <Text style={styles.statValue}>{farm.temperature}°C</Text>
            </View>
          </View>

          {farm.distance && (
            <Text style={styles.distance}>
              📍 {farm.distance.toFixed(1)} km away
            </Text>
          )}
        </View>
      </Callout>
    </Marker>
  );
};

const styles = StyleSheet.create({
  calloutContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: 260,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  calloutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  healthText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  address: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  distance: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
