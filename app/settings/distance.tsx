import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { MapPin, Ruler, Globe, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Slider from '@react-native-community/slider';

export default function DistanceSettings() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { settings, updateSettings, maxDistance, setMaxDistance } = useUserStore();
  const [localDistance, setLocalDistance] = useState(maxDistance || 5);

  const distanceSettings = settings?.distanceSettings || {
    maxDistance: 5,
    useMetric: false,
  };

  const handleToggleMetric = () => {
    const newValue = !distanceSettings.useMetric;
    
    updateSettings({
      distanceSettings: {
        ...distanceSettings,
        useMetric: newValue,
      },
    });

    Alert.alert(
      'Distance Unit Updated',
      newValue 
        ? 'Distances will now be shown in kilometers' 
        : 'Distances will now be shown in miles'
    );
  };

  const handleDistanceChange = (value: number) => {
    setLocalDistance(value);
  };

  const handleDistanceChangeComplete = (value: number) => {
    setMaxDistance(value);
    updateSettings({
      distanceSettings: {
        ...distanceSettings,
        maxDistance: value,
      },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const formatDistance = (distance: number) => {
    if (distanceSettings.useMetric) {
      // Convert miles to kilometers
      const km = distance * 1.60934;
      return `${km.toFixed(1)} km`;
    }
    return `${distance.toFixed(1)} miles`;
  };

  return (
    <LinearGradient
      colors={['#0A1929', '#0F2942', '#1A3A5F']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Distance',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { color: '#FFFFFF', fontFamily: 'Rubik-SemiBold' },
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ArrowLeft size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Discovery Distance</Text>
        
        <View style={[styles.sliderContainer, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <View style={styles.sliderHeader}>
            <View style={styles.sliderLeft}>
              <MapPin size={24} color="#0066CC" />
              <Text style={[styles.sliderLabel, { color: '#FFFFFF' }]}>Maximum Distance</Text>
            </View>
            <Text style={[styles.distanceValue, { color: '#0066CC' }]}>
              {formatDistance(localDistance)}
            </Text>
          </View>
          
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={localDistance}
            onValueChange={handleDistanceChange}
            onSlidingComplete={handleDistanceChangeComplete}
            minimumTrackTintColor="#0066CC"
            maximumTrackTintColor="rgba(255, 255, 255, 0.3)"
            thumbTintColor="#0066CC"
          />
          
          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderMinLabel, { color: 'rgba(255, 255, 255, 0.7)' }]}>
              {formatDistance(1)}
            </Text>
            <Text style={[styles.sliderMaxLabel, { color: 'rgba(255, 255, 255, 0.7)' }]}>
              {formatDistance(100)}
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Units</Text>
        
        <View style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <View style={styles.settingLeft}>
            <Ruler size={24} color="#0066CC" />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: '#FFFFFF' }]}>Use Metric System</Text>
              <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                Show distances in kilometers instead of miles
              </Text>
            </View>
          </View>
          <Switch 
            value={distanceSettings.useMetric} 
            onValueChange={handleToggleMetric}
            trackColor={{ false: '#767577', true: '#0066CC' }}
            thumbColor={distanceSettings.useMetric ? '#FFFFFF' : '#f4f3f4'}
            ios_backgroundColor="#767577"
          />
        </View>

        <View style={[styles.infoBox, { backgroundColor: 'rgba(0, 102, 204, 0.1)' }]}>
          <Globe size={20} color="#0066CC" />
          <Text style={[styles.infoText, { color: 'rgba(255, 255, 255, 0.9)' }]}>
            Setting a larger distance will show you more people, but they may be further away from you.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 100,
  },
  scrollContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 24,
    textTransform: 'uppercase',
    fontFamily: 'Rubik-SemiBold',
  },
  sliderContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  sliderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sliderLabel: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Rubik-SemiBold',
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Rubik-SemiBold',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -8,
  },
  sliderMinLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
  },
  sliderMaxLabel: {
    fontSize: 12,
    fontFamily: 'Rubik-Regular',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 16,
  },
  settingText: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Rubik-SemiBold',
  },
  settingDescription: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Rubik-Regular',
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});