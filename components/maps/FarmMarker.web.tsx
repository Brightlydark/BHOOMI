import React from 'react';
import { View } from 'react-native';
import { Farm } from '../../types/farm';

interface FarmMarkerProps {
  farm: Farm;
  onPress: (farm: Farm) => void;
  isSelected?: boolean;
}

export const FarmMarker: React.FC<FarmMarkerProps> = () => {
  return <View />;
};
