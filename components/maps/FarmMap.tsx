// components/maps/FarmMap.tsx
import React, { useRef, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';

import { Farm, Coordinates } from '../../types/farm';
import { FarmMarker } from './FarmMarker';

interface FarmMapProps {
  userLocation: Coordinates | null;
  farms: Farm[];
  selectedFarm: Farm | null;
  onFarmSelect: (farm: Farm) => void;
  onRegionChange?: (region: Region) => void;
}

export const FarmMap: React.FC<FarmMapProps> = ({
  userLocation,
  farms,
  selectedFarm,
  onFarmSelect,
  onRegionChange,
}) => {
  const mapRef = useRef<MapView>(null);

  // Center map on user location when it becomes available
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }, 1000);
    }
  }, [userLocation]);

  // Zoom to selected farm
  useEffect(() => {
    if (selectedFarm && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: selectedFarm.location.latitude,
        longitude: selectedFarm.location.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }, 500);
    }
  }, [selectedFarm]);

  const initialRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      }
    : {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        mapType="none"
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        onRegionChangeComplete={onRegionChange}
      >
        {/* OpenStreetMap tile overlay */}
        <UrlTile
          urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
          tileSize={256}
          zIndex={-1}
        />
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            title="My Location"
            pinColor="#2196F3"
          />
        )}

        {/* Farm markers */}
        {farms.map((farm) => (
          <FarmMarker
            key={farm.id}
            farm={farm}
            isSelected={selectedFarm?.id === farm.id}
            onPress={(f) => onFarmSelect(f)}
          />
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
