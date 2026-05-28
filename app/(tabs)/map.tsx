// app/(tabs)/map.tsx
import React, { useState, useRef, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  Text,
  ActivityIndicator,
  Keyboard,
  Animated,
} from 'react-native';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { MapViewWrapper } from '../../components/maps/MapViewWrapper';
import { EmptyState } from '../../components/common/EmptyState';
import { AddFarmModal } from '../../components/farms/AddFarmModal';
import { QuickAnalysisPanel } from '../../components/farms/QuickAnalysisPanel';
import { useLocation } from '../../hooks/useLocation';
import { useFarms } from '../../hooks/useFarms';
import { Farm } from '../../types/farm';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { validateFarmLocation, LocationValidationResult, ValidationStatus } from '../../services/locationValidator';
import { Coordinates } from '../../types/farm';

export default function MapScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const mapRef = useRef<any>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [], []);

  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  // FAB pulse animation
  const fabScale = useRef(new Animated.Value(1)).current;
  const pressFabIn = () =>
    Animated.spring(fabScale, { toValue: 0.92, useNativeDriver: true, tension: 200 }).start();
  const pressFabOut = () =>
    Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  const [showAddFarm, setShowAddFarm] = useState(false);
  
  // Placement Mode State
  const [isPlacingMode, setIsPlacingMode] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<LocationValidationResult | null>(null);
  const [placementCoord, setPlacementCoord] = useState<Coordinates | null>(null);

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

  if (selectedFarm) {
    lastSelectedFarmRef.current = selectedFarm;
  }

  const displayFarm = selectedFarm ?? lastSelectedFarmRef.current;

  // Reactively open/close the bottom sheet when selectedFarm changes
  React.useEffect(() => {
    if (selectedFarm) {
      // Small timeout ensures the content is rendered before snapping
      setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 50);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [selectedFarm]);

  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  const handleMarkerPress = useCallback((farm: Farm) => {
    selectFarm(farm);
    // snapToIndex is now handled by the useEffect above

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
  }, [selectFarm]);

  const handleMapPress = useCallback(() => {
    Keyboard.dismiss();
    bottomSheetRef.current?.close();
  }, []);

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

  const handleRegionChangeComplete = useCallback(async (region: any) => {
    if (isPlacingMode) {
      setPlacementCoord({ latitude: region.latitude, longitude: region.longitude });
      setValidating(true);
      const res = await validateFarmLocation(region.latitude, region.longitude);
      setValidationResult(res);
      setValidating(false);
    }
  }, [isPlacingMode]);

  /** After a farm is added, zoom to its pin */
  const handleFarmAdded = useCallback(
    (farm: Farm) => {
      setShowAddFarm(false);
      if (mapRef.current) {
        setTimeout(() => {
          mapRef.current?.animateToRegion(
            {
              latitude: farm.location.latitude - 0.008,
              longitude: farm.location.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            },
            700
          );
        }, 400);
      }
    },
    []
  );

  if (!hasPermission && !locationLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <View style={styles.permissionIconCircle}>
            <Ionicons name="location" size={44} color={colors.primary} />
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
    if (health === 'good') return colors.success;
    if (health === 'moderate') return colors.warning;
    return colors.danger;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header with Search */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('map.searchPlaceholder')}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => handleSearch('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        {farmsLoading && (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: 8 }} />
        )}
      </View>

      {/* Farm count badge */}
      {farms.length > 0 && (
        <View style={styles.farmCountBadge}>
          <Ionicons name="leaf" size={12} color={colors.primary} />
          <Text style={styles.farmCountText}>{farms.length} farms nearby</Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        {locationLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
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
            onRegionChangeComplete={handleRegionChangeComplete}
          />
        ) : (
          <EmptyState
            icon="location-outline"
            title="Location not available"
            description="Unable to get your location. Please check permissions."
          />
        )}

        {/* Map Controls (right side) */}
        <View style={styles.mapControls}>
          <Pressable style={styles.controlButton} onPress={centerOnUser}>
            <Ionicons name="locate" size={22} color={colors.text} />
          </Pressable>
          <Pressable style={styles.controlButton} onPress={refreshFarms}>
            <Ionicons name="refresh" size={22} color={colors.text} />
          </Pressable>
        </View>

        {/* FAB — Add Farm (Hidden in placing mode) */}
        {!isPlacingMode && (
          <Animated.View style={[styles.fabWrapper, { transform: [{ scale: fabScale }] }]}>
            <Pressable
              style={styles.fab}
              onPress={() => {
                setIsPlacingMode(true);
                setValidationResult(null);
                setPlacementCoord(location ? { latitude: location.latitude, longitude: location.longitude } : null);
              }}
              onPressIn={pressFabIn}
              onPressOut={pressFabOut}
              accessibilityLabel="Add new farm"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={['#059669', '#10B981']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.fabGradient}
              >
                <Ionicons name="add" size={28} color="#FFFFFF" />
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}

        {/* Center Crosshair for Placement Mode */}
        {isPlacingMode && (
          <View style={styles.crosshairContainer} pointerEvents="none">
            <View style={[
              styles.crosshairGlow, 
              validationResult?.isValid === true ? { backgroundColor: 'rgba(16, 185, 129, 0.2)' } :
              validationResult?.isValid === false ? { backgroundColor: 'rgba(239, 68, 68, 0.2)' } :
              {}
            ]} />
            <Ionicons 
              name="add" 
              size={40} 
              color={
                validating ? colors.textSecondary :
                validationResult?.isValid === true ? colors.success :
                validationResult?.isValid === false ? colors.danger :
                colors.primary
              } 
            />
          </View>
        )}

        {/* Placement Mode Validation Panel */}
        {isPlacingMode && (
          <View style={styles.placementPanel}>
            <View style={styles.placementHeader}>
              <Text style={styles.placementTitle}>Select Farm Location</Text>
              <Pressable onPress={() => setIsPlacingMode(false)} hitSlop={10}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>
            <Text style={styles.placementSub}>Drag map to position the pin exactly over your farm.</Text>
            
            <View style={[
              styles.validationBox,
              validationResult?.isValid === true ? { borderColor: colors.success, backgroundColor: isDark ? `${colors.success}20` : '#ECFDF5' } :
              validationResult?.isValid === false ? { borderColor: colors.danger, backgroundColor: isDark ? `${colors.danger}20` : '#FEF2F2' } :
              { borderColor: colors.border, backgroundColor: colors.card }
            ]}>
              {validating ? (
                <View style={styles.validationRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.validationText}>Analyzing terrain...</Text>
                </View>
              ) : validationResult ? (
                <View style={styles.validationRow}>
                  <Ionicons 
                    name={validationResult.isValid ? "checkmark-circle" : "warning"} 
                    size={20} 
                    color={validationResult.isValid ? colors.success : colors.danger} 
                  />
                  <Text style={[
                    styles.validationText,
                    { color: validationResult.isValid ? (isDark ? colors.success : '#065F46') : (isDark ? colors.danger : '#991B1B') }
                  ]}>
                    {validationResult.message}
                  </Text>
                </View>
              ) : (
                <View style={styles.validationRow}>
                  <Ionicons name="move" size={20} color={colors.textSecondary} />
                  <Text style={styles.validationText}>Move map to analyze area</Text>
                </View>
              )}
            </View>

            <Pressable
              style={[styles.confirmBtn, (!validationResult?.isValid || validating) && styles.confirmBtnDisabled]}
              onPress={() => {
                if (validationResult?.isValid && placementCoord) {
                  setIsPlacingMode(false);
                  setShowAddFarm(true);
                }
              }}
              disabled={!validationResult?.isValid || validating}
            >
              <Text style={styles.confirmBtnText}>Confirm Placement</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Bottom Sheet for Farm Details */}
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enableDynamicSizing={true}
        enablePanDownToClose
        onChange={handleSheetChanges}
        backgroundStyle={styles.bottomSheetBackground}
        handleIndicatorStyle={styles.bottomSheetIndicator}
      >
        {displayFarm && (
          <BottomSheetView style={styles.sheetContent}>
            <QuickAnalysisPanel 
              farm={displayFarm}
              onViewDetails={() => {
                bottomSheetRef.current?.close();
                router.push(`/farm/${displayFarm.id}`);
              }}
            />
          </BottomSheetView>
        )}
      </BottomSheet>

      {/* Add Farm Modal */}
      {showAddFarm && (
        <AddFarmModal
          visible={showAddFarm}
          onClose={() => setShowAddFarm(false)}
          userLocation={placementCoord || location}
          onFarmAdded={handleFarmAdded}
        />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorPalette, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text },
  farmCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: isDark ? `${colors.primary}20` : colors.successLight,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? colors.border : '#D1FAE5',
  },
  farmCountText: { fontSize: 12, color: isDark ? colors.primary : '#065F46', fontWeight: '500' },
  mapContainer: { flex: 1, position: 'relative' },
  map: { ...StyleSheet.absoluteFillObject },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    gap: 12,
  },
  loadingText: { fontSize: 16, color: colors.textSecondary },

  /* Map Controls */
  mapControls: {
    position: 'absolute',
    right: 16,
    bottom: 96,   // shifted up to clear the FAB
    gap: 10,
  },
  controlButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 5,
  },

  /* FAB */
  fabWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 24,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Bottom sheet */
  bottomSheetBackground: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
  },
  bottomSheetIndicator: {
    width: 36,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  sheetContent: {
    paddingBottom: 16,
  },
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
    backgroundColor: isDark ? `${colors.primary}20` : colors.successLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  permissionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  permissionButtonText: { fontSize: 16, fontWeight: '700', color: colors.textInverse || '#FFFFFF' },

  /* Placement Mode */
  crosshairContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    paddingBottom: 24, // Slight offset to account for bottom sheet visual center
  },
  crosshairGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  placementPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 100,
  },
  placementHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  placementTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  placementSub: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  validationBox: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  validationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  validationText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    backgroundColor: colors.border,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
