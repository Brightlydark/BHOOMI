import React, { forwardRef } from 'react';
import { View, Text } from 'react-native';
import { Farm } from '../../types/farm';

interface MapViewWrapperProps {
  style?: any;
  initialRegion: any;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  showsCompass?: boolean;
  loadingEnabled?: boolean;
  mapType?: 'none' | 'standard' | 'satellite' | 'hybrid' | 'terrain';
  onPress?: () => void;
  farms: Farm[];
  selectedFarm: Farm | null;
  onMarkerPress: (farm: Farm) => void;
}

export const MapViewWrapper = forwardRef<any, MapViewWrapperProps>((props, ref) => {
  return (
    <View style={[props.style, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#E5E7EB' }]}>
      <Text style={{ color: '#6B7280', fontSize: 16 }}>Interactive map is not supported on Web.</Text>
      <Text style={{ color: '#9CA3AF', fontSize: 14, marginTop: 8 }}>Please use the iOS or Android app.</Text>
    </View>
  );
});
