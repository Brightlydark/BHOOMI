// components/farms/AddFarmModal.tsx
// Premium Add Farm bottom-sheet modal with multi-step form, map pin selection,
// smart data generation, and direct insertion into farmStore + AsyncStorage.

import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Pressable,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { Farm, Coordinates, CropHealthStatus } from '../../types/farm';
import { useFarmStore } from '../../store/farmStore';
import { useAppTheme } from '../../theme/useAppTheme';
import { ColorPalette } from '../../theme/colors';
import { generateFarmInsights } from '../../services/mockData';
import { saveInsightsForFarm } from '../../services/insightStore';

const { height: SCREEN_H } = Dimensions.get('window');

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface AddFarmModalProps {
  visible: boolean;
  onClose: () => void;
  /** User's current GPS location, used to pre-fill the pin */
  userLocation: Coordinates | null;
  onFarmAdded?: (farm: Farm) => void;
}

type Step = 'details' | 'location' | 'soil' | 'success';

const CROP_TYPES = [
  'Rice', 'Wheat', 'Cotton', 'Sugarcane',
  'Tomato', 'Millets', 'Vegetables', 'Maize',
  'Potato', 'Onion', 'Soybean', 'Groundnut',
];
const SOIL_TYPES = [
  'Alluvial', 'Black (Regur)', 'Red & Yellow',
  'Laterite', 'Sandy Loam', 'Clay Loam', 'Silt Loam',
];
const IRRIGATION_TYPES: Array<{ label: string; value: string }> = [
  { label: 'Drip Irrigation', value: 'drip' },
  { label: 'Sprinkler', value: 'sprinkler' },
  { label: 'Flood / Flow', value: 'flood' },
  { label: 'None / Rain-fed', value: 'none' },
];

/* ------------------------------------------------------------------ */
/*  Helper: generate Farm object from form data                         */
/* ------------------------------------------------------------------ */
const buildFarm = (
  formData: FormData,
  userLocation: Coordinates | null
): Farm => {
  const moisture = formData.soilMoisture
    ? Math.max(0, Math.min(100, Number(formData.soilMoisture)))
    : Math.round(50 + Math.random() * 20 - 10);

  const temperature = formData.temperature
    ? Number(formData.temperature)
    : Math.round((24 + Math.random() * 8) * 10) / 10;

  const humidity = Math.round(50 + Math.random() * 25);

  // Smart health inference
  let cropHealth: CropHealthStatus = 'good';
  if (moisture < 35 || temperature > 36) cropHealth = 'poor';
  else if (moisture < 50 || temperature > 33) cropHealth = 'moderate';

  const pinLat = formData.pinLat ?? userLocation?.latitude ?? 12.9716;
  const pinLon = formData.pinLon ?? userLocation?.longitude ?? 77.5946;

  return {
    id: `user_farm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: formData.name.trim(),
    location: { latitude: pinLat, longitude: pinLon },
    address: formData.address?.trim() || `${formData.name.trim()}, India`,
    soilMoisture: moisture,
    temperature,
    humidity,
    cropHealth,
    cropType: formData.cropType || undefined,
    lastUpdated: new Date(),
    distance: 0,
  };
};

/* ------------------------------------------------------------------ */
/*  FormData type                                                        */
/* ------------------------------------------------------------------ */
interface FormData {
  name: string;
  address: string;
  cropType: string;
  farmSize: string;
  soilType: string;
  irrigationType: string;
  soilMoisture: string;
  temperature: string;
  pinLat: number | null;
  pinLon: number | null;
}

const DEFAULT_FORM: FormData = {
  name: '',
  address: '',
  cropType: '',
  farmSize: '',
  soilType: '',
  irrigationType: 'drip',
  soilMoisture: '',
  temperature: '',
  pinLat: null,
  pinLon: null,
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                       */
/* ------------------------------------------------------------------ */
export const AddFarmModal: React.FC<AddFarmModalProps> = ({
  visible,
  onClose,
  userLocation,
  onFarmAdded,
}) => {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const { addFarm } = useFarmStore();

  const [step, setStep] = useState<Step>('details');
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [addedFarm, setAddedFarm] = useState<Farm | null>(null);

  // button press animation
  const btnScale = useRef(new Animated.Value(1)).current;
  const pressBtnIn = () =>
    Animated.spring(btnScale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const pressBtnOut = () =>
    Animated.spring(btnScale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  // Reset when closed
  useEffect(() => {
    if (!visible) {
      setTimeout(() => {
        setStep('details');
        setForm(DEFAULT_FORM);
        setAddedFarm(null);
        setSaving(false);
      }, 300);
    }
  }, [visible]);

  // Pre-fill pin from user location
  useEffect(() => {
    if (userLocation && form.pinLat === null) {
      setForm((f) => ({
        ...f,
        pinLat: userLocation.latitude,
        pinLon: userLocation.longitude,
      }));
    }
  }, [userLocation, visible]);

  const update = (key: keyof FormData, value: string | number | null) =>
    setForm((f) => ({ ...f, [key]: value }));

  /* -- Step 1 validation -- */
  const step1Valid = form.name.trim().length >= 2;
  /* -- Step 2 validation -- */
  const step2Valid = form.pinLat !== null && form.pinLon !== null;

  /* -- Save farm -- */
  const handleSave = async () => {
    if (!step1Valid) return;
    setSaving(true);
    try {
      const farm = buildFarm(form, userLocation);
      addFarm(farm);

      // Generate and store insights for this farm
      const insights = generateFarmInsights(farm);
      await saveInsightsForFarm(farm.id, insights);

      setAddedFarm(farm);
      setStep('success');
      onFarmAdded?.(farm);
    } catch (e) {
      Alert.alert('Error', 'Could not save farm. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /* -------- STEP: DETAILS -------- */
  const renderDetails = () => (
    <MotiView
      from={{ opacity: 0, translateX: 30 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 350 }}
    >
      {/* Farm name */}
      <Text style={styles.fieldLabel}>Farm Name *</Text>
      <View style={styles.inputRow}>
        <Ionicons name="leaf-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E.g. Krishna Rice Farm"
          placeholderTextColor={colors.textMuted}
          value={form.name}
          onChangeText={(v) => update('name', v)}
          autoFocus
          returnKeyType="next"
        />
      </View>

      {/* Address */}
      <Text style={styles.fieldLabel}>Address / Village (Optional)</Text>
      <View style={styles.inputRow}>
        <Ionicons name="location-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E.g. Plot 12, Mandya, Karnataka"
          placeholderTextColor={colors.textMuted}
          value={form.address}
          onChangeText={(v) => update('address', v)}
          returnKeyType="next"
        />
      </View>

      {/* Farm size */}
      <Text style={styles.fieldLabel}>Farm Size (Hectares)</Text>
      <View style={styles.inputRow}>
        <Ionicons name="resize-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E.g. 2.5"
          placeholderTextColor={colors.textMuted}
          value={form.farmSize}
          onChangeText={(v) => update('farmSize', v)}
          keyboardType="decimal-pad"
          returnKeyType="next"
        />
        <Text style={styles.inputSuffix}>ha</Text>
      </View>

      {/* Crop Type chips */}
      <Text style={styles.fieldLabel}>Crop Type</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CROP_TYPES.map((crop) => (
          <Pressable
            key={crop}
            style={[styles.chip, form.cropType === crop && styles.chipActive]}
            onPress={() => update('cropType', crop === form.cropType ? '' : crop)}
          >
            <Text style={[styles.chipText, form.cropType === crop && styles.chipTextActive]}>
              {crop}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </MotiView>
  );

  /* -------- STEP: LOCATION -------- */
  const renderLocation = () => (
    <MotiView
      from={{ opacity: 0, translateX: 30 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 350 }}
    >
      <View style={styles.locationHero}>
        <LinearGradient
          colors={['#059669', '#10B981']}
          style={styles.locationIconCircle}
        >
          <Ionicons name="map" size={30} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.locationTitle}>Pin Your Farm Location</Text>
        <Text style={styles.locationSub}>
          Enter the GPS coordinates or use your current location as the farm pin.
        </Text>
      </View>

      {/* Use current location button */}
      <Pressable
        style={styles.useLocationBtn}
        onPress={() => {
          if (userLocation) {
            update('pinLat', userLocation.latitude);
            update('pinLon', userLocation.longitude);
          } else {
            Alert.alert('Location', 'GPS location not available. Please enter coordinates manually.');
          }
        }}
      >
        <Ionicons name="navigate" size={18} color={colors.primary} />
        <Text style={styles.useLocationText}>Use My Current Location</Text>
        {form.pinLat !== null && (
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        )}
      </Pressable>

      <Text style={styles.dividerText}>— or enter manually —</Text>

      {/* Latitude */}
      <Text style={styles.fieldLabel}>Latitude</Text>
      <View style={styles.inputRow}>
        <Ionicons name="compass-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E.g. 12.9716"
          placeholderTextColor={colors.textMuted}
          value={form.pinLat !== null ? String(form.pinLat) : ''}
          onChangeText={(v) => update('pinLat', v ? parseFloat(v) : null)}
          keyboardType="decimal-pad"
        />
      </View>

      {/* Longitude */}
      <Text style={styles.fieldLabel}>Longitude</Text>
      <View style={styles.inputRow}>
        <Ionicons name="compass-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E.g. 77.5946"
          placeholderTextColor={colors.textMuted}
          value={form.pinLon !== null ? String(form.pinLon) : ''}
          onChangeText={(v) => update('pinLon', v ? parseFloat(v) : null)}
          keyboardType="decimal-pad"
        />
      </View>

      {form.pinLat !== null && (
        <View style={styles.coordsBadge}>
          <Ionicons name="pin" size={14} color={colors.primary} />
          <Text style={styles.coordsText}>
            {form.pinLat.toFixed(5)}, {(form.pinLon ?? 0).toFixed(5)}
          </Text>
        </View>
      )}
    </MotiView>
  );

  /* -------- STEP: SOIL -------- */
  const renderSoil = () => (
    <MotiView
      from={{ opacity: 0, translateX: 30 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: 350 }}
    >
      {/* Soil type chips */}
      <Text style={styles.fieldLabel}>Soil Type (Optional)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {SOIL_TYPES.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, form.soilType === s && styles.chipActive]}
            onPress={() => update('soilType', s === form.soilType ? '' : s)}
          >
            <Text style={[styles.chipText, form.soilType === s && styles.chipTextActive]}>{s}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Irrigation */}
      <Text style={styles.fieldLabel}>Irrigation Method</Text>
      <View style={styles.irrigationGrid}>
        {IRRIGATION_TYPES.map((ir: { label: string; value: string }) => (
          <Pressable
            key={ir.value}
            style={[styles.irrigationChip, form.irrigationType === ir.value && styles.irrigationChipActive]}
            onPress={() => update('irrigationType', ir.value)}
          >
            <Ionicons
              name={
                ir.value === 'drip' ? 'water' :
                ir.value === 'sprinkler' ? 'rainy' :
                ir.value === 'flood' ? 'boat' : 'leaf'
              }
              size={16}
              color={form.irrigationType === ir.value ? '#FFFFFF' : colors.textSecondary}
            />
            <Text style={[styles.irrigationText, form.irrigationType === ir.value && styles.irrigationTextActive]}>
              {ir.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Optional readings */}
      <Text style={styles.fieldLabel}>Current Soil Moisture (%) — Optional</Text>
      <View style={styles.inputRow}>
        <Ionicons name="water-outline" size={18} color={colors.info} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E.g. 62"
          placeholderTextColor={colors.textMuted}
          value={form.soilMoisture}
          onChangeText={(v) => update('soilMoisture', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.inputSuffix}>%</Text>
      </View>

      <Text style={styles.fieldLabel}>Current Temperature (°C) — Optional</Text>
      <View style={styles.inputRow}>
        <Ionicons name="thermometer-outline" size={18} color={colors.danger} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="E.g. 28"
          placeholderTextColor={colors.textMuted}
          value={form.temperature}
          onChangeText={(v) => update('temperature', v)}
          keyboardType="decimal-pad"
        />
        <Text style={styles.inputSuffix}>°C</Text>
      </View>

      <View style={styles.aiNotice}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={styles.aiNoticeText}>
          BHOOMI AI will auto-generate analytics, insights and recommendations for this farm.
        </Text>
      </View>
    </MotiView>
  );

  /* -------- STEP: SUCCESS -------- */
  const renderSuccess = () => (
    <MotiView
      from={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14, stiffness: 120 }}
      style={styles.successContainer}
    >
      <LinearGradient
        colors={['#059669', '#10B981', '#34D399']}
        style={styles.successIconCircle}
      >
        <Ionicons name="checkmark" size={44} color="#FFFFFF" />
      </LinearGradient>

      <Text style={styles.successTitle}>Farm Added!</Text>
      <Text style={styles.successSub}>
        <Text style={{ fontWeight: '700', color: colors.primary }}>{addedFarm?.name}</Text>
        {'\n'}is now live on your BHOOMI dashboard.
      </Text>

      <View style={styles.successStats}>
        <View style={styles.successStat}>
          <Text style={styles.successStatValue}>{addedFarm?.soilMoisture}%</Text>
          <Text style={styles.successStatLabel}>Moisture</Text>
        </View>
        <View style={styles.successStat}>
          <Text style={styles.successStatValue}>{addedFarm?.temperature}°C</Text>
          <Text style={styles.successStatLabel}>Temperature</Text>
        </View>
        <View style={styles.successStat}>
          <Text style={[styles.successStatValue, {
            color: addedFarm?.cropHealth === 'good' ? colors.success :
                   addedFarm?.cropHealth === 'moderate' ? colors.warning : colors.danger
          }]}>
            {addedFarm?.cropHealth
              ? addedFarm.cropHealth.charAt(0).toUpperCase() + addedFarm.cropHealth.slice(1)
              : '—'}
          </Text>
          <Text style={styles.successStatLabel}>Health</Text>
        </View>
      </View>

      <View style={styles.successInsightBadge}>
        <Ionicons name="sparkles" size={14} color={colors.primary} />
        <Text style={styles.successInsightText}>
          AI insights generated for {addedFarm?.cropType || 'your farm'}
        </Text>
      </View>
    </MotiView>
  );

  /* -------- STEP HEADER -------- */
  const STEPS: Step[] = ['details', 'location', 'soil'];
  const stepIndex = STEPS.indexOf(step);

  const stepTitles: Record<Step, string> = {
    details: 'Farm Details',
    location: 'Farm Location',
    soil: 'Soil & Irrigation',
    success: 'Farm Added!',
  };

  /* -------- RENDER -------- */
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <View style={styles.modalHandle} />
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.modalTitle}>{stepTitles[step]}</Text>
              {step !== 'success' && (
                <Text style={styles.modalSubtitle}>Step {stepIndex + 1} of {STEPS.length}</Text>
              )}
            </View>
            <Pressable style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Step progress bar */}
          {step !== 'success' && (
            <View style={styles.progressBar}>
              {STEPS.map((s, i) => (
                <View
                  key={s}
                  style={[
                    styles.progressSegment,
                    i <= stepIndex && styles.progressSegmentActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Content */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={styles.scrollArea}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {step === 'details' && renderDetails()}
            {step === 'location' && renderLocation()}
            {step === 'soil' && renderSoil()}
            {step === 'success' && renderSuccess()}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          {step === 'success' ? (
            <Animated.View style={{ transform: [{ scale: btnScale }], width: '100%' }}>
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={onClose}
                onPressIn={pressBtnIn}
                onPressOut={pressBtnOut}
                activeOpacity={0.9}
              >
                <LinearGradient
                  colors={['#059669', '#10B981']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.btnGradient}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.btnPrimaryText}>View on Map</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <View style={styles.footerRow}>
              {stepIndex > 0 && (
                <Pressable
                  style={styles.btnSecondary}
                  onPress={() => setStep(STEPS[stepIndex - 1])}
                >
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
                  <Text style={styles.btnSecondaryText}>Back</Text>
                </Pressable>
              )}

              <Animated.View style={{ flex: 1, transform: [{ scale: btnScale }] }}>
                {step === 'soil' ? (
                  <TouchableOpacity
                    style={[styles.btnPrimary, !step1Valid && styles.btnDisabled]}
                    onPress={handleSave}
                    onPressIn={pressBtnIn}
                    onPressOut={pressBtnOut}
                    disabled={!step1Valid || saving}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={step1Valid ? ['#059669', '#10B981'] : [colors.border, colors.border]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      {saving ? (
                        <Text style={styles.btnPrimaryText}>Saving…</Text>
                      ) : (
                        <>
                          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                          <Text style={styles.btnPrimaryText}>Add Farm</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.btnPrimary, !step1Valid && step === 'details' && styles.btnDisabled]}
                    onPress={() => {
                      if (step === 'details' && !step1Valid) return;
                      setStep(STEPS[stepIndex + 1]);
                    }}
                    onPressIn={pressBtnIn}
                    onPressOut={pressBtnOut}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={(step === 'details' && !step1Valid) ? [colors.border, colors.border] : ['#059669', '#10B981']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.btnGradient}
                    >
                      <Text style={styles.btnPrimaryText}>Next</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </Animated.View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/*  Styles                                                              */
/* ------------------------------------------------------------------ */
const createStyles = (colors: ColorPalette, isDark: boolean) =>
  StyleSheet.create({
    modalRoot: {
      flex: 1,
      backgroundColor: colors.background,
    },

    /* Header */
    modalHeader: {
      backgroundColor: colors.card,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    modalHandle: {
      width: 36, height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: 16,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 22, fontWeight: '800', color: colors.text,
    },
    modalSubtitle: {
      fontSize: 13, color: colors.textMuted, marginTop: 2,
    },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: colors.background,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: colors.border,
    },

    /* Progress */
    progressBar: {
      flexDirection: 'row', gap: 6,
    },
    progressSegment: {
      flex: 1, height: 4, borderRadius: 2,
      backgroundColor: colors.border,
    },
    progressSegmentActive: {
      backgroundColor: colors.primary,
    },

    /* Scroll */
    scrollArea: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },

    /* Fields */
    fieldLabel: {
      fontSize: 13, fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 8, marginTop: 16,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    inputRow: {
      flexDirection: 'row', alignItems: 'center',
      borderWidth: 1.5, borderColor: colors.border,
      borderRadius: 14, backgroundColor: colors.card,
      overflow: 'hidden',
    },
    inputIcon: { paddingLeft: 14 },
    input: {
      flex: 1, paddingVertical: 14, paddingHorizontal: 10,
      fontSize: 16, color: colors.text,
    },
    inputSuffix: {
      paddingRight: 14, fontSize: 14,
      color: colors.textMuted, fontWeight: '600',
    },

    /* Chips */
    chipScroll: { marginBottom: 4 },
    chip: {
      paddingHorizontal: 14, paddingVertical: 8,
      borderRadius: 20, borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginRight: 8,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? `${colors.primary}20` : '#ECFDF5',
    },
    chipText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    chipTextActive: { color: colors.primary, fontWeight: '700' },

    /* Location step */
    locationHero: {
      alignItems: 'center', paddingVertical: 20, marginBottom: 8,
    },
    locationIconCircle: {
      width: 72, height: 72, borderRadius: 22,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 14,
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.3, shadowRadius: 12,
      elevation: 8,
    },
    locationTitle: {
      fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 8,
    },
    locationSub: {
      fontSize: 14, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 20,
    },
    useLocationBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: isDark ? `${colors.primary}15` : '#ECFDF5',
      borderWidth: 1.5, borderColor: colors.primary,
      borderRadius: 14, padding: 14, marginBottom: 16,
    },
    useLocationText: {
      flex: 1, fontSize: 15, fontWeight: '600', color: colors.primary,
    },
    dividerText: {
      textAlign: 'center', fontSize: 12,
      color: colors.textMuted, marginBottom: 4,
    },
    coordsBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginTop: 12, paddingVertical: 8, paddingHorizontal: 12,
      backgroundColor: isDark ? `${colors.primary}15` : '#ECFDF5',
      borderRadius: 10,
    },
    coordsText: {
      fontSize: 13, color: colors.primary, fontWeight: '600', fontVariant: ['tabular-nums'],
    },

    /* Irrigation chips */
    irrigationGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4,
    },
    irrigationChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 12, paddingVertical: 10,
      borderRadius: 12, borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    irrigationChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    irrigationText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
    irrigationTextActive: { color: '#FFFFFF', fontWeight: '700' },

    /* AI notice */
    aiNotice: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      marginTop: 16, padding: 14,
      backgroundColor: isDark ? `${colors.primary}10` : '#F0FDF4',
      borderRadius: 12, borderWidth: 1,
      borderColor: isDark ? `${colors.primary}30` : '#D1FAE5',
    },
    aiNoticeText: {
      flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18,
    },

    /* Success */
    successContainer: {
      alignItems: 'center', paddingVertical: 20,
    },
    successIconCircle: {
      width: 96, height: 96, borderRadius: 32,
      justifyContent: 'center', alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#059669',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3, shadowRadius: 16,
      elevation: 10,
    },
    successTitle: {
      fontSize: 30, fontWeight: '800', color: colors.text, marginBottom: 10,
    },
    successSub: {
      fontSize: 16, color: colors.textSecondary,
      textAlign: 'center', lineHeight: 24, marginBottom: 24,
    },
    successStats: {
      flexDirection: 'row', gap: 12, marginBottom: 20,
    },
    successStat: {
      flex: 1, alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    successStatValue: {
      fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 4,
    },
    successStatLabel: {
      fontSize: 11, color: colors.textMuted,
    },
    successInsightBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 8,
      backgroundColor: isDark ? `${colors.primary}15` : '#ECFDF5',
      borderRadius: 20,
    },
    successInsightText: {
      fontSize: 13, color: colors.primary, fontWeight: '600',
    },

    /* Footer */
    footer: {
      paddingHorizontal: 20, paddingVertical: 16,
      borderTopWidth: 1, borderTopColor: colors.border,
      backgroundColor: colors.card,
    },
    footerRow: { flexDirection: 'row', gap: 10 },
    btnSecondary: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 16, paddingVertical: 16,
      borderRadius: 14, borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    btnSecondaryText: { fontSize: 15, fontWeight: '600', color: colors.text },
    btnPrimary: { borderRadius: 14, overflow: 'hidden' },
    btnDisabled: { opacity: 0.5 },
    btnGradient: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 16, gap: 8,
    },
    btnPrimaryText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
  });
