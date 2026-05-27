import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Droplets, Thermometer, Sprout, ShieldAlert, CheckCircle2, ChevronRight } from 'lucide-react-native';

import { useFarms } from '../../hooks/useFarms';
import { useLocation } from '../../hooks/useLocation';
import { MetricChart } from '../../components/charts/MetricChart';
import { WeatherCard } from '../../components/common/WeatherCard';
import { Card } from '../../components/common/Card';

export default function FarmDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { location } = useLocation();
  const { farms } = useFarms(location);
  
  const farm = useMemo(() => farms.find(f => f.id === id), [id, farms]);

  if (!farm) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Farm not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Generate mock chart data
  const moistureData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.floor(Math.random() * 20) + (farm.soilMoisture - 10),
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));

  const temperatureData = Array.from({ length: 7 }, (_, i) => ({
    value: Math.floor(Math.random() * 5) + (farm.temperature - 2),
    label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
  }));

  const getHealthColor = (health: string) => {
    if (health === 'good') return '#10B981';
    if (health === 'moderate') return '#F59E0B';
    return '#EF4444';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft color="#374151" size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{farm.name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Droplets color="#3B82F6" size={20} />
            </View>
            <Text style={styles.statValue}>{farm.soilMoisture}%</Text>
            <Text style={styles.statLabel}>Moisture</Text>
          </View>
          
          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Thermometer color="#EF4444" size={20} />
            </View>
            <Text style={styles.statValue}>{farm.temperature}°C</Text>
            <Text style={styles.statLabel}>Temperature</Text>
          </View>

          <View style={styles.statBox}>
            <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Sprout color={getHealthColor(farm.cropHealth)} size={20} />
            </View>
            <Text style={[styles.statValue, { color: getHealthColor(farm.cropHealth) }]}>
              {farm.cropHealth.toUpperCase()}
            </Text>
            <Text style={styles.statLabel}>Crop Health</Text>
          </View>
        </View>

        {/* Address Card */}
        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>Location Details</Text>
          <Text style={styles.infoText}>{farm.address}</Text>
          {farm.distance && (
            <Text style={styles.distanceText}>📍 {farm.distance.toFixed(2)} km away</Text>
          )}
        </Card>

        {/* Weather Forecast */}
        <WeatherCard />

        {/* Historical Charts */}
        <MetricChart 
          title="Soil Moisture History (Last 7 Days)" 
          data={moistureData} 
          color="#3B82F6" 
          suffix="%" 
        />
        
        <MetricChart 
          title="Temperature History (Last 7 Days)" 
          data={temperatureData} 
          color="#EF4444" 
          suffix="°C" 
        />

        {/* Crop Recommendations */}
        <Card style={styles.listCard}>
          <Text style={styles.listTitle}>Crop Recommendations</Text>
          {['Apply NPK Fertilizer', 'Check for stem borers', 'Increase irrigation frequency'].map((rec, i) => (
            <View key={i} style={styles.listItem}>
              <CheckCircle2 color="#10B981" size={20} />
              <Text style={styles.listText}>{rec}</Text>
            </View>
          ))}
        </Card>

        {/* Recent Activity */}
        <Card style={styles.listCard}>
          <Text style={styles.listTitle}>Recent Activity</Text>
          {[
            { action: 'Irrigation System On', time: '2 hours ago' },
            { action: 'Soil test completed', time: '1 day ago' },
            { action: 'Fertilizer applied', time: '3 days ago' }
          ].map((activity, i) => (
            <View key={i} style={styles.listItem}>
              <View style={styles.activityDot} />
              <View style={{ flex: 1 }}>
                <Text style={styles.listText}>{activity.action}</Text>
                <Text style={styles.timeText}>{activity.time}</Text>
              </View>
              <ChevronRight color="#9CA3AF" size={16} />
            </View>
          ))}
        </Card>

        {/* Action Buttons */}
        <TouchableOpacity style={styles.actionButton}>
          <ShieldAlert color="#FFFFFF" size={20} />
          <Text style={styles.actionButtonText}>Report Issue</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 18,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 40,
  },
  backButton: {
    padding: 16,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    alignSelf: 'center',
    marginTop: 20,
  },
  backText: {
    color: '#374151',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statBox: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
  distanceText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    marginTop: 8,
  },
  actionButton: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  listCard: {
    marginBottom: 8,
    marginTop: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  listText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 12,
    marginTop: 2,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 6,
  }
});
