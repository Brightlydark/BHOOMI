import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { useDevStore } from '../../store/devStore';
import { Card } from '../common/Card';
import { useAppTheme } from '../../theme/useAppTheme';
import { X, Beaker, RotateCcw } from 'lucide-react-native';

interface DevTestPanelProps {
  visible: boolean;
  onClose: () => void;
}

export const DevTestPanel: React.FC<DevTestPanelProps> = ({ visible, onClose }) => {
  const { colors, isDark } = useAppTheme();
  const devState = useDevStore();

  if (!__DEV__) return null;

  const updateField = (field: keyof typeof devState, value: any) => {
    devState.setMockData({ [field]: value });
  };

  const OptionRow = ({ label, value, options, field }: any) => (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
        {options.map((opt: any) => {
          const isSelected = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.optionChip,
                { backgroundColor: isSelected ? colors.primary : (isDark ? '#374151' : '#F3F4F6') }
              ]}
              onPress={() => updateField(field, opt.value)}
            >
              <Text style={[
                styles.optionText,
                { color: isSelected ? '#FFFFFF' : colors.textSecondary }
              ]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );

  const SliderRow = ({ label, value, min, max, step, field, unit = '' }: any) => {
    // Simple custom slider implementation to avoid bringing in new dependencies
    return (
      <View style={styles.sliderRow}>
        <View style={styles.sliderHeader}>
          <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.sliderValue, { color: colors.primary }]}>{value}{unit}</Text>
        </View>
        <View style={styles.sliderButtons}>
          <TouchableOpacity 
            style={[styles.slBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]} 
            onPress={() => updateField(field, Math.max(min, value - step))}
          >
            <Text style={[styles.slBtnText, { color: colors.text }]}>-</Text>
          </TouchableOpacity>
          <View style={[styles.slTrack, { backgroundColor: isDark ? '#374151' : '#E5E7EB' }]}>
            <View style={[styles.slFill, { backgroundColor: colors.primary, width: `${((value - min) / (max - min)) * 100}%` }]} />
          </View>
          <TouchableOpacity 
            style={[styles.slBtn, { backgroundColor: isDark ? '#374151' : '#F3F4F6' }]} 
            onPress={() => updateField(field, Math.min(max, value + step))}
          >
            <Text style={[styles.slBtnText, { color: colors.text }]}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={[styles.panelContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.titleRow}>
              <Beaker color={colors.warning} size={24} />
              <Text style={[styles.title, { color: colors.text }]}>Developer Test Mode</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color={colors.textSecondary} size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} contentContainerStyle={styles.contentPadding}>
            <View style={[styles.masterSwitchCard, { backgroundColor: isDark ? '#1F2937' : '#F9FAFB' }]}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>Enable Analytics Overrides</Text>
              <Switch
                value={devState.overrideEnabled}
                onValueChange={devState.setOverrideEnabled}
                trackColor={{ false: '#767577', true: colors.primary }}
              />
            </View>

            {devState.overrideEnabled && (
              <View style={styles.controlsSection}>
                <OptionRow 
                  label="Crop Profile" 
                  value={devState.mockCropType} 
                  field="mockCropType"
                  options={[
                    { label: 'Rice', value: 'rice' },
                    { label: 'Cotton', value: 'cotton' },
                    { label: 'Tomato', value: 'tomato' },
                    { label: 'Wheat', value: 'wheat' }
                  ]} 
                />
                <OptionRow 
                  label="Soil Profile" 
                  value={devState.mockSoilType} 
                  field="mockSoilType"
                  options={[
                    { label: 'Clay', value: 'clay' },
                    { label: 'Sandy', value: 'sandy' },
                    { label: 'Loam', value: 'loam' },
                    { label: 'Black', value: 'black' }
                  ]} 
                />

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <SliderRow label="Soil Moisture" value={devState.mockMoisture} min={0} max={100} step={5} field="mockMoisture" unit="%" />
                <SliderRow label="Temperature" value={devState.mockTemp} min={10} max={50} step={1} field="mockTemp" unit="°C" />
                <SliderRow label="Humidity" value={devState.mockHumidity} min={0} max={100} step={5} field="mockHumidity" unit="%" />
                <SliderRow label="Rainfall Prob." value={devState.mockRainfall} min={0} max={100} step={10} field="mockRainfall" unit="%" />
                <SliderRow label="UV Index" value={devState.mockUv} min={0} max={12} step={1} field="mockUv" />

                <TouchableOpacity 
                  style={[styles.resetButton, { borderColor: colors.border }]}
                  onPress={devState.resetMockData}
                >
                  <RotateCcw color={colors.textSecondary} size={16} />
                  <Text style={[styles.resetText, { color: colors.textSecondary }]}>Reset to Defaults</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panelContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  masterSwitchCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  controlsSection: {
    gap: 24,
  },
  row: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sliderRow: {
    gap: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  sliderButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  slBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slBtnText: {
    fontSize: 20,
    fontWeight: '500',
  },
  slTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  slFill: {
    height: '100%',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 8,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 16,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
