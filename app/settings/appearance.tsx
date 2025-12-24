import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useThemeStore } from '@/store/themeStore';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Moon, Sun, Smartphone, Type, Zap, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AppearanceSettings() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { mode, setMode } = useThemeStore();
  const { settings, updateSettings } = useUserStore();

  const appearanceSettings = settings?.appearanceSettings || {
    theme: 'dark',
    fontSize: 'medium',
    reducedMotion: false,
  };

  const handleThemeChange = (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    updateSettings({
      appearanceSettings: {
        ...appearanceSettings,
        theme: newMode,
      },
    });
    
    Alert.alert(
      'Theme Updated',
      `Theme set to ${newMode.charAt(0).toUpperCase() + newMode.slice(1)}`,
      [{ text: 'OK' }]
    );
  };

  const handleFontSizeChange = () => {
    const options = ['small', 'medium', 'large'] as const;
    const currentIndex = options.indexOf(appearanceSettings.fontSize as any);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextValue = options[nextIndex];
    
    updateSettings({
      appearanceSettings: {
        ...appearanceSettings,
        fontSize: nextValue,
      },
    });

    const messages = {
      small: 'Font size set to Small',
      medium: 'Font size set to Medium',
      large: 'Font size set to Large',
    };

    Alert.alert('Font Size Updated', messages[nextValue]);
  };

  const handleReducedMotionToggle = () => {
    const newValue = !appearanceSettings.reducedMotion;
    
    updateSettings({
      appearanceSettings: {
        ...appearanceSettings,
        reducedMotion: newValue,
      },
    });

    Alert.alert(
      'Reduced Motion',
      newValue 
        ? 'Reduced motion enabled. Animations will be minimized.' 
        : 'Reduced motion disabled. Animations will be shown.'
    );
  };

  const handleBack = () => {
    router.back();
  };

  const getFontSizeText = () => {
    switch (appearanceSettings.fontSize) {
      case 'small': return 'Small';
      case 'medium': return 'Medium';
      case 'large': return 'Large';
      default: return 'Medium';
    }
  };

  return (
    <LinearGradient
      colors={['#0A1929', '#0F2942', '#1A3A5F']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Appearance',
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
        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Theme</Text>
        
        <View style={styles.themeOptions}>
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              mode === 'light' && styles.selectedThemeOption,
              { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={() => handleThemeChange('light')}
          >
            <Sun size={24} color={mode === 'light' ? '#6C5CE7' : '#FFFFFF'} />
            <Text style={[
              styles.themeText, 
              mode === 'light' && styles.selectedThemeText,
              { color: '#FFFFFF' }
            ]}>
              Light
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              mode === 'dark' && styles.selectedThemeOption,
              { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={() => handleThemeChange('dark')}
          >
            <Moon size={24} color={mode === 'dark' ? '#6C5CE7' : '#FFFFFF'} />
            <Text style={[
              styles.themeText, 
              mode === 'dark' && styles.selectedThemeText,
              { color: '#FFFFFF' }
            ]}>
              Dark
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.themeOption, 
              mode === 'system' && styles.selectedThemeOption,
              { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
            ]}
            onPress={() => handleThemeChange('system')}
          >
            <Smartphone size={24} color={mode === 'system' ? '#6C5CE7' : '#FFFFFF'} />
            <Text style={[
              styles.themeText, 
              mode === 'system' && styles.selectedThemeText,
              { color: '#FFFFFF' }
            ]}>
              System
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Text Size</Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleFontSizeChange}
        >
          <View style={styles.settingLeft}>
            <Type size={24} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: '#FFFFFF' }]}>Font Size</Text>
              <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                Adjust the size of text throughout the app
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: '#6C5CE7' }]}>
              {getFontSizeText()}
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Accessibility</Text>
        
        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleReducedMotionToggle}
        >
          <View style={styles.settingLeft}>
            <Zap size={24} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: '#FFFFFF' }]}>Reduced Motion</Text>
              <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                Minimize animations throughout the app
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <View style={[
              styles.toggle,
              appearanceSettings.reducedMotion ? styles.toggleOn : styles.toggleOff
            ]}>
              <View style={[
                styles.toggleHandle,
                appearanceSettings.reducedMotion ? styles.toggleHandleOn : styles.toggleHandleOff
              ]} />
            </View>
          </View>
        </TouchableOpacity>
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
  themeOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  selectedThemeOption: {
    borderWidth: 2,
    borderColor: '#6C5CE7',
  },
  themeText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Rubik-Medium',
  },
  selectedThemeText: {
    color: '#6C5CE7',
    fontWeight: '600',
    fontFamily: 'Rubik-SemiBold',
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
  settingRight: {
    alignItems: 'flex-end',
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Rubik-SemiBold',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleOn: {
    backgroundColor: '#6C5CE7',
  },
  toggleOff: {
    backgroundColor: '#767577',
  },
  toggleHandle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  toggleHandleOn: {
    transform: [{ translateX: 22 }],
  },
  toggleHandleOff: {
    transform: [{ translateX: 0 }],
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