import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Marker } from 'react-native-maps';
import { Farm } from '../../types/farm';
import { Sprout } from 'lucide-react-native';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { useMemo } from 'react';

interface FarmMarkerProps {
  farm: Farm;
  isSelected: boolean;
  onPress: (farm: Farm) => void;
}

export const FarmMarker: React.FC<FarmMarkerProps> = React.memo(({
  farm,
  isSelected,
  onPress,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isSelected ? 1.15 : 1,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }),
      Animated.spring(translateY, {
        toValue: isSelected ? -8 : 0,
        useNativeDriver: true,
        friction: 6,
        tension: 100,
      }),
    ]).start();
  }, [isSelected]);

  const getHealthColor = (health: Farm['cropHealth']) => {
    switch (health) {
      case 'good': return colors.success;
      case 'moderate': return colors.warning;
      case 'poor': return colors.danger;
      default: return colors.textSecondary;
    }
  };

  const healthColor = getHealthColor(farm.cropHealth);

  return (
    <Marker
      coordinate={farm.location}
      onPress={() => onPress(farm)}
      tracksViewChanges={false}
      anchor={{ x: 0.5, y: 1 }}
    >
      <Animated.View
        style={[
          styles.markerWrapper,
          { transform: [{ scale: scaleAnim }, { translateY }] },
        ]}
      >
        <View
          style={[
            styles.pill,
            {
              backgroundColor: isSelected ? colors.text : colors.card,
              borderColor: isSelected ? colors.text : healthColor,
            },
          ]}
        >
          <View style={[styles.iconContainer, { backgroundColor: healthColor + '25' }]}>
            <Sprout size={13} color={isSelected ? colors.card : healthColor} />
          </View>
          <Text
            style={[styles.label, { color: isSelected ? (colors.textInverse || colors.card) : colors.text }]}
            numberOfLines={1}
          >
            {farm.name.length > 14 ? farm.name.substring(0, 14) + '…' : farm.name}
          </Text>
        </View>
        <View
          style={[
            styles.triangle,
            { borderTopColor: isSelected ? colors.text : healthColor },
          ]}
        />
      </Animated.View>
    </Marker>
  );
});

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  markerWrapper: {
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 6,
    maxWidth: 150,
  },
  iconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 5,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
  triangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
