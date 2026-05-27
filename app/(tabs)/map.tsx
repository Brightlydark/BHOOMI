// app/(tabs)/map.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import MapView, { PROVIDER_DEFAULT, Region, UrlTile } from 'react-native-maps';

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FarmMarker } from '../../components/maps/FarmMarker';
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useLocation } from '../../hooks/useLocation';
import { useFarms } from '../../hooks/useFarms';
import { Farm } from '../../types/farm';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { t } = useTranslation();
  const mapRef = useRef<MapView>(null);
  
  // Location hook
  const {
    location,
    loading: locationLoading,
    error: locationError,
    hasPermission,
    requestPermission,
  } = useLocation();

  // Farms hook
  const {
    farms,
    loading: farmsLoading,
    error: farmsError,
    refreshFarms,
    searchFarms,
    selectedFarm,
    selectFarm,
  } = useFarms(location);

  const [searchQuery, setSearchQuery] = useState('');
  const [showFarmDetails, setShowFarmDetails] = useState(false);

  /**
   * Handle permission request
   */
  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  /**
   * Handle farm marker press
   */
  const handleMarkerPress = (farm: Farm) => {
    selectFarm(farm);
    setShowFarmDetails(true);
    
    // Animate to farm location
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: farm.location.latitude,
        longitude: farm.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    }
  };

  /**
   * Handle search
   */
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      searchFarms(query);
    } else if (query.length === 0) {
      searchFarms('');
    }
  };

  /**
   * Center map on user location
   */
  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });
    }
  };

  /**
   * Get initial region
   */
  const getInitialRegion = (): Region | undefined => {
    if (!location) return undefined;
    
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  // Show permission prompt if not granted
  if (!hasPermission && !locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="location-outline" size={80} color="#10B981" />
          <Text style={styles.permissionTitle}>
            {t('map.permissions.title')}
          </Text>
          <Text style={styles.permissionMessage}>
            {t('map.permissions.message')}
          </Text>
          <Pressable style={styles.permissionButton} onPress={handlePermissionRequest}>
            <Text style={styles.permissionButtonText}>
              {t('map.permissions.grant')}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('map.searchPlaceholder')}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {locationLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : location ? (
          <MapView
            ref={mapRef}
            provider={PROVIDER_DEFAULT}
            style={styles.map}
            initialRegion={getInitialRegion()}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass
            loadingEnabled
            mapType="none"
          >
            {/* OpenStreetMap tile overlay */}
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
                onPress={handleMarkerPress}
              />
            ))}
          </MapView>

        ) : (
          <EmptyState
            icon="location-outline"
            title="Location not available"
            description="Unable to get your location. Please check permissions."
          />
        )}

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <Pressable style={styles.controlButton} onPress={centerOnUser}>
            <Ionicons name="locate" size={24} color="#10B981" />
          </Pressable>
          
          <Pressable style={styles.controlButton} onPress={refreshFarms}>
            <Ionicons name="refresh" size={24} color="#10B981" />
          </Pressable>
        </View>

        {/* Farm Count Badge */}
        <View style={styles.countBadge}>
          <Ionicons name="business" size={16} color="#10B981" />
          <Text style={styles.countText}>
            {farms.length} {t('map.nearbyFarms')}
          </Text>
        </View>
      </View>

      {/* Selected Farm Details */}
      {showFarmDetails && selectedFarm && (
        <View style={styles.detailsContainer}>
          <Card style={styles.farmDetailsCard}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{selectedFarm.name}</Text>
              <Pressable onPress={() => setShowFarmDetails(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </Pressable>
            </View>

            <Text style={styles.detailsAddress}>{selectedFarm.address}</Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailsItem}>
                <Ionicons name="water" size={20} color="#3B82F6" />
                <Text style={styles.detailsLabel}>{t('map.soilMoisture')}</Text>
                <Text style={styles.detailsValue}>{selectedFarm.soilMoisture}%</Text>
              </View>

              <View style={styles.detailsItem}>
                <Ionicons name="thermometer" size={20} color="#EF4444" />
                <Text style={styles.detailsLabel}>{t('map.temperature')}</Text>
                <Text style={styles.detailsValue}>{selectedFarm.temperature}°C</Text>
              </View>

              <View style={styles.detailsItem}>
                <Ionicons name="leaf" size={20} color="#10B981" />
                <Text style={styles.detailsLabel}>{t('map.cropHealth')}</Text>
                <Text style={styles.detailsValue}>
                  {t(`map.healthStatus.${selectedFarm.cropHealth}`)}
                </Text>
              </View>

              {selectedFarm.distance !== undefined && (
                <View style={styles.detailsItem}>
                  <Ionicons name="navigate" size={20} color="#8B5CF6" />
                  <Text style={styles.detailsLabel}>{t('map.distance')}</Text>
                  <Text style={styles.detailsValue}>
                    {selectedFarm.distance.toFixed(1)} km
                  </Text>
                </View>
              )}
            </View>

            {selectedFarm.cropType && (
              <View style={styles.cropTypeContainer}>
                <Text style={styles.cropTypeLabel}>Current Crop:</Text>
                <Text style={styles.cropTypeValue}>{selectedFarm.cropType}</Text>
              </View>
            )}
          </Card>
        </View>
      )}

      {/* Loading Overlay */}
      {farmsLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#FFFFFF" />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: 16,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  countBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 5,
  },
  countText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  detailsContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  farmDetailsCard: {
    backgroundColor: '#FFFFFF',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  detailsAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailsItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  detailsLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  detailsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  cropTypeContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cropTypeLabel: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  cropTypeValue: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '700',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  permissionMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 8,
  },
});
