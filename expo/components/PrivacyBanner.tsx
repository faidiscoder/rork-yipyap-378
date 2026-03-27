import React from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity } from 'react-native';
import { Shield, Eye, EyeOff, Settings } from 'lucide-react-native';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function PrivacyBanner() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { 
    isPrivacyModeEnabled, 
    isGhostModeEnabled,
    togglePrivacyMode,
    toggleGhostMode,
    currentUser
  } = useUserStore();

  const handleTogglePrivacy = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    togglePrivacyMode();
  };

  const handleToggleGhost = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleGhostMode();
  };

  const handleSettingsPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.selectionAsync();
    }
    router.push('/profile');
  };

  const getPrivacyStatus = () => {
    if (isGhostModeEnabled && isPrivacyModeEnabled) {
      return {
        title: 'Maximum Privacy',
        subtitle: 'You are invisible and your data is protected',
        icon: <EyeOff size={20} color={colors.primary} />,
        color: colors.primary
      };
    } else if (isGhostModeEnabled) {
      return {
        title: 'Ghost Mode Active',
        subtitle: 'You are invisible to other users',
        icon: <EyeOff size={20} color="#FF9F43" />,
        color: '#FF9F43'
      };
    } else if (isPrivacyModeEnabled) {
      return {
        title: 'Privacy Mode Active',
        subtitle: 'Your location and activity are limited',
        icon: <Shield size={20} color="#20C997" />,
        color: '#20C997'
      };
    } else {
      return {
        title: 'Privacy Controls',
        subtitle: 'Manage your visibility and data sharing',
        icon: <Eye size={20} color={colors.subtext} />,
        color: colors.subtext
      };
    }
  };

  const privacyStatus = getPrivacyStatus();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.content}>
        <View style={[styles.iconContainer, { backgroundColor: `${privacyStatus.color}20` }]}>
          {privacyStatus.icon}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.text }]}>{privacyStatus.title}</Text>
          <Text style={[styles.subtitle, { color: colors.subtext }]}>
            {privacyStatus.subtitle}
          </Text>
        </View>
        
        <View style={styles.controls}>
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.subtext }]}>Privacy</Text>
            <Switch
              value={isPrivacyModeEnabled}
              onValueChange={handleTogglePrivacy}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#FFFFFF"
              style={styles.switch}
            />
          </View>
          
          <View style={styles.switchContainer}>
            <Text style={[styles.switchLabel, { color: colors.subtext }]}>Ghost</Text>
            <Switch
              value={isGhostModeEnabled}
              onValueChange={handleToggleGhost}
              trackColor={{ false: colors.border, true: '#FF9F43' }}
              thumbColor="#FFFFFF"
              style={styles.switch}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.settingsButton, { backgroundColor: colors.primary }]}
            onPress={handleSettingsPress}
          >
            <Settings size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Privacy info */}
      {currentUser?.privacySettings && (
        <View style={styles.infoRow}>
          <Text style={[styles.infoText, { color: colors.subtext }]}>
            Distance: {currentUser.privacySettings.showDistance ? 'Visible' : 'Hidden'} • 
            Quick Add: {currentUser.privacySettings.appearInQuickAdd ? 'Enabled' : 'Disabled'} • 
            Matches: {currentUser.privacySettings.allowDailyMatches ? 'Enabled' : 'Disabled'}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchContainer: {
    alignItems: 'center',
    gap: 4,
  },
  switchLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  switch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  settingsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  infoText: {
    fontSize: 12,
    textAlign: 'center',
  },
});