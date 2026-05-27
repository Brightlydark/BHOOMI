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
import { Card } from '../../components/common/Card';
import { EmptyState } from '../../components/common/EmptyState';
import { useLocation } from '../../hooks/useLocation';
import { useFarms } from '../../hooks/useFarms';
import { Farm } from '../../types/farm';

export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['30%', '50%'], []);
  
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

  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  const handleMarkerPress = (farm: Farm) => {
    selectFarm(farm);
    bottomSheetRef.current?.expand();
    
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: farm.location.latitude - 0.005, // Offset slightly to account for bottom sheet
        longitude: farm.location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 500);
    }
  };

  const handleMapPress = () => {
    Keyboard.dismiss();
    selectFarm(null as any);
    bottomSheetRef.current?.close();
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      selectFarm(null as any);
    }
  }, [selectFarm]);

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
          <MapViewWrapper
            ref={mapRef}
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            }}
            showsUserLocation
            showsMyLocationButton={false}
            showsCompass
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
            <Ionicons name="locate" size={24} color="#10B981" />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={refreshFarms}>
            <Ionicons name="refresh" size={24} color="#10B981" />
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
        {selectedFarm && (
          <View style={styles.sheetContent}>
            <View style={styles.detailsHeader}>
              <Text style={styles.detailsTitle}>{selectedFarm.name}</Text>
              <View
                style={[
                  styles.healthBadge,
                  { backgroundColor: selectedFarm.cropHealth === 'good' ? '#10B981' : selectedFarm.cropHealth === 'moderate' ? '#F59E0B' : '#EF4444' },
                ]}
              >
                <Text style={styles.healthText}>
                  {selectedFarm.cropHealth.charAt(0).toUpperCase() + selectedFarm.cropHealth.slice(1)}
                </Text>
              </View>
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
            </View>

            <Pressable 
              style={styles.viewDetailsButton}
              onPress={() => {
                bottomSheetRef.current?.close();
                router.push(`/farm/${selectedFarm.id}`);
              }}
            >
              <Text style={styles.viewDetailsText}>View Farm Details</Text>
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
  header: { padding: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 12, paddingHorizontal: 12, height: 48 },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 16, color: '#111827' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  mapControls: { position: 'absolute', right: 16, top: 16, gap: 12 },
  controlButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 3.84, elevation: 5 },
  bottomSheetBackground: { backgroundColor: '#FFFFFF', borderRadius: 24, shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 10 },
  bottomSheetIndicator: { width: 40, height: 4, backgroundColor: '#D1D5DB', borderRadius: 2 },
  sheetContent: { padding: 24 },
  detailsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  detailsTitle: { fontSize: 22, fontWeight: '700', color: '#111827', flex: 1 },
  healthBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  healthText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  detailsAddress: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
  detailsGrid: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  detailsItem: { flex: 1, alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', borderRadius: 16, borderWidth: 1, borderColor: '#F3F4F6' },
  detailsLabel: { fontSize: 12, color: '#6B7280', marginTop: 8 },
  detailsValue: { fontSize: 18, fontWeight: '700', color: '#111827', marginTop: 4 },
  viewDetailsButton: { backgroundColor: '#10B981', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 16, gap: 8 },
  viewDetailsText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  permissionMessage: { fontSize: 16, color: '#6B7280', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  permissionButton: { backgroundColor: '#10B981', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12 },
  permissionButtonText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
