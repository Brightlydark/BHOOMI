import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import BottomSheet from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { MapViewWrapper } from '../../components/maps/MapViewWrapper';
import { EmptyState } from '../../components/common/EmptyState';
import { useLocation } from '../../hooks/useLocation';
import { useFarms } from '../../hooks/useFarms';
import { Farm } from '../../types/farm';

export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['32%', '55%'], []);

  // Keep a stable ref of the last selected farm so the BottomSheet
  // content doesn't flash empty while the close animation is playing.
  const lastSelectedFarmRef = useRef<Farm | null>(null);

  const {
    location,
    loading: locationLoading,
    hasPermission,
    requestPermission,
  } = useLocation();

  const {
    farms,
    loading: farmsLoading,
    refreshFarms,
    searchFarms,
    selectedFarm,
    selectFarm,
  } = useFarms(location);

  const [searchQuery, setSearchQuery] = useState('');

  // Keep the ref updated whenever selectedFarm changes
  if (selectedFarm) {
    lastSelectedFarmRef.current = selectedFarm;
  }

  const displayFarm = selectedFarm ?? lastSelectedFarmRef.current;

  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  const handleMarkerPress = (farm: Farm) => {
    selectFarm(farm);
    bottomSheetRef.current?.snapToIndex(0);

    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: farm.location.latitude - 0.008,
          longitude: farm.location.longitude,
          latitudeDelta: 0.025,
          longitudeDelta: 0.025,
        },
        500
      );
    }
  };

  const handleMapPress = () => {
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  };

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        selectFarm(null as any);
        lastSelectedFarmRef.current = null;
      }
    },
    [selectFarm]
  );

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      searchFarms(query);
    } else if (query.length === 0) {
      searchFarms('');
    }
  };

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

  if (!hasPermission && !locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="location" size={44} color="#10B981" />
          </View>
          <Text style={styles.permissionTitle}>{t('map.permissions.title')}</Text>
          <Text style={styles.permissionMessage}>{t('map.permissions.message')}</Text>
          <Pressable style={styles.permissionButton} onPress={handlePermissionRequest}>
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
            <Text style={styles.permissionButtonText}>{t('map.permissions.grant')}</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const getHealthColor = (health: string) => {
    if (health === 'good') return '#10B981';
    if (health === 'moderate') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('map.searchPlaceholder')}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </Pressable>
          )}
        </View>
        {farmsLoading && (
          <ActivityIndicator size="small" color="#10B981" style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Farm count badge */}
      {farms.length > 0 && (
        <View style={styles.farmCountBadge}>
          <Ionicons name="leaf" size={12} color="#10B981" />
          <Text style={styles.farmCountText}>{farms.length} farms nearby</Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        {locationLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : location ? (
          <MapViewWrapper
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.12,
              longitudeDelta: 0.12,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass={false}
            loadingEnabled
            mapType="none"
            onPress={handleMapPress}
            farms={farms}
            selectedFarm={selectedFarm}
            onMarkerPress={handleMarkerPress}
          />
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
            <Ionicons name="locate" size={22} color="#10B981" />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={refreshFarms}>
            <Ionicons name="refresh" size={22} color="#10B981" />
          </Pressable>
        </View>
      </View>

      {/* Bottom Sheet for Farm Details */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        {displayFarm && (
          <View style={styles.sheetContent}>
            <View style={styles.detailsHeader}>
              <View style={styles.detailsTitleWrap}>
                <Text style={styles.detailsTitle} numberOfLines={1}>
                  {displayFarm.name}
                </Text>
                {displayFarm.cropType && (
                  <Text style={styles.cropTypeLabel}>{displayFarm.cropType}</Text>
                )}
              </View>
              <View
                style={[
                  styles.healthBadge,
                  { backgroundColor: getHealthColor(displayFarm.cropHealth) + '20' },
                ]}
              >
                <View
                  style={[
                    styles.healthDot,
                    { backgroundColor: getHealthColor(displayFarm.cropHealth) },
                  ]}
                />
                <Text
                  style={[
                    styles.healthText,
                    { color: getHealthColor(displayFarm.cropHealth) },
                  ]}
                >
                  {displayFarm.cropHealth.charAt(0).toUpperCase() +
                    displayFarm.cropHealth.slice(1)}
                </Text>
              </View>
            </View>

            <Text style={styles.detailsAddress}>
              <Ionicons name="location-outline" size={12} color="#9CA3AF" />{' '}
              {displayFarm.address}
              {displayFarm.distance
                ? `  ·  ${displayFarm.distance.toFixed(1)} km away`
                : ''}
            </Text>

            <View style={styles.detailsGrid}>
              <View style={styles.detailsItem}>
                <View style={[styles.detailsIconBg, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="water" size={20} color="#3B82F6" />
                </View>
                <Text style={styles.detailsValue}>{displayFarm.soilMoisture}%</Text>
                <Text style={styles.detailsLabel}>{t('map.soilMoisture')}</Text>
              </View>

              <View style={styles.detailsItem}>
                <View style={[styles.detailsIconBg, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="thermometer" size={20} color="#EF4444" />
                </View>
                <Text style={styles.detailsValue}>{displayFarm.temperature}°C</Text>
                <Text style={styles.detailsLabel}>{t('map.temperature')}</Text>
              </View>

              <View style={styles.detailsItem}>
                <View style={[styles.detailsIconBg, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="partly-sunny" size={20} color="#10B981" />
                </View>
                <Text style={styles.detailsValue}>{displayFarm.humidity}%</Text>
                <Text style={styles.detailsLabel}>Humidity</Text>
              </View>
            </View>

            <Pressable
              style={styles.viewDetailsButton}
              onPress={() => {
                bottomSheetRef.current?.close();
                router.push(`/farm/${displayFarm.id}`);
              }}
            >
              <Text style={styles.viewDetailsText}>View Farm Dashboard</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  farmCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
  },
  farmCountText: { fontSize: 12, color: '#065F46', fontWeight: '500' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    gap: 12,
  },
  loadingText: { fontSize: 16, color: '#6B7280' },
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    gap: 10,
  },
  controlButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },
  bottomSheetBackground: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  bottomSheetIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  sheetContent: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 16 },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  detailsTitleWrap: { flex: 1, marginRight: 12 },
  detailsTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
  },
  cropTypeLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  healthDot: { width: 7, height: 7, borderRadius: 4 },
  healthText: { fontSize: 12, fontWeight: '700' },
  detailsAddress: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  detailsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  detailsItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    gap: 4,
  },
  detailsIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailsLabel: { fontSize: 11, color: '#9CA3AF', textAlign: 'center' },
  detailsValue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  viewDetailsButton: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 14,
    gap: 8,
  },
  viewDetailsText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  permissionIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permissionButtonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
