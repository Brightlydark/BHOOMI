import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Farm } from '../../types/farm';
import { Sprout } from 'lucide-react-native';
import { MotiView } from 'moti';

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

  const healthColor = getHealthColor(farm.cropHealth);

  return (
    <Marker
      coordinate={farm.location}
      onPress={(e) => {
        e.stopPropagation();
        onPress(farm);
      }}
      style={{ zIndex: isSelected ? 10 : 1 }}
      anchor={{ x: 0.5, y: 1 }}
    >
      <MotiView
        animate={{
          scale: isSelected ? 1.15 : 1,
          translateY: isSelected ? -8 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 250,
          damping: 20,
        }}
        style={styles.markerWrapper}
      >
        <View style={[styles.pill, { backgroundColor: isSelected ? '#111827' : '#FFFFFF', borderColor: isSelected ? '#111827' : healthColor }]}>
          <View style={[styles.iconContainer, { backgroundColor: healthColor + '20' }]}>
            <Sprout size={14} color={healthColor} />
          </View>
          <Text style={[styles.label, { color: isSelected ? '#FFFFFF' : '#111827' }]}>
            {farm.name}
          </Text>
        </View>
        <View style={[styles.triangle, { borderTopColor: isSelected ? '#111827' : healthColor }]} />
      </MotiView>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 2, // Space for triangle
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
