import React, { forwardRef } from 'react';
import MapView, { PROVIDER_DEFAULT, UrlTile, Region } from 'react-native-maps';
import { FarmMarker } from './FarmMarker';
import { Farm } from '../../types/farm';

interface MapViewWrapperProps {
  style?: any;
  initialRegion: Region;
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

export const MapViewWrapper = forwardRef<MapView, MapViewWrapperProps>((props, ref) => {
  const { farms, selectedFarm, onMarkerPress, ...rest } = props;
  
  return (
    <MapView ref={ref} provider={PROVIDER_DEFAULT} {...rest}>
      <UrlTile
        urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maximumZ={19}
        flipY={false}
        tileSize={256}
        zIndex={-1}
      />
      {farms.map((farm) => (
        <FarmMarker
          key={farm.id}
          farm={farm}
          isSelected={selectedFarm?.id === farm.id}
          onPress={onMarkerPress}
        />
      ))}
    </MapView>
  );
});
