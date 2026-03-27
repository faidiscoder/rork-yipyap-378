import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Eye, MapPin, Clock, UserPlus, MessageSquare, Ghost, ArrowLeft, Lock, Bell } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function PrivacySettings() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { settings, updateSettings, isGhostModeEnabled, toggleGhostMode } = useUserStore();

  const privacySettings = settings?.privacySettings || {
    showLocation: true,
    showOnlineStatus: true,
    showLastSeen: true,
    allowFriendRequests: true,
    allowMessagesFrom: 'friends',
    ghostMode: false,
  };

  const handleToggle = (key: keyof typeof privacySettings) => {
    if (key === 'ghostMode') {
      toggleGhostMode();
      Alert.alert(
        'Ghost Mode Updated',
        isGhostModeEnabled 
          ? 'Ghost mode disabled. You are now visible to others.' 
          : 'Ghost mode enabled. You are now invisible to others and will not appear in discovery.'
      );
      return;
    }

    const newValue = !privacySettings[key];
    
    updateSettings({
      privacySettings: {
        ...privacySettings,
        [key]: newValue,
      },
    });

    // Show confirmation for important settings
    if (key === 'showLocation') {
      Alert.alert(
        'Location Privacy Updated',
        newValue 
          ? 'Your location will be visible to other users for discovery and matching' 
          : 'Your location is now hidden from other users. This may affect your ability to be discovered.'
      );
    }

    if (key === 'allowFriendRequests') {
      Alert.alert(
        'Friend Requests Updated',
        newValue 
          ? 'Other users can now send you friend requests' 
          : 'Friend requests are now disabled. Others cannot send you friend requests.'
      );
    }

    if (key === 'showOnlineStatus') {
      Alert.alert(
        'Online Status Updated',
        newValue 
          ? 'Friends can now see when you are online' 
          : 'Your online status is now hidden from friends'
      );
    }

    if (key === 'showLastSeen') {
      Alert.alert(
        'Last Seen Updated',
        newValue 
          ? 'Others can now see when you were last active' 
          : 'Your last seen status is now hidden'
      );
    }
  };

  const handleMessagesFromChange = () => {
    const options = ['everyone', 'friends', 'none'] as const;
    const currentIndex = options.indexOf(privacySettings.allowMessagesFrom);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextValue = options[nextIndex];
    
    updateSettings({
      privacySettings: {
        ...privacySettings,
        allowMessagesFrom: nextValue,
      },
    });

    const messages = {
      everyone: 'Anyone can message you',
      friends: 'Only friends can message you',
      none: 'No one can message you (not recommended)'
    };

    Alert.alert('Message Privacy Updated', messages[nextValue]);
  };

  const handleBack = () => {
    router.back();
  };

  const renderSettingItem = (
    icon: React.ReactNode,
    label: string,
    description: string,
    value: boolean,
    onToggle: () => void
  ) => (
    <View style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
      <View style={styles.settingLeft}>
        {icon}
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color: '#FFFFFF' }]}>{label}</Text>
          <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch 
        value={value} 
        onValueChange={onToggle}
        trackColor={{ false: '#767577', true: '#6C5CE7' }}
        thumbColor={value ? '#FFFFFF' : '#f4f3f4'}
        ios_backgroundColor="#767577"
      />
    </View>
  );

  const getMessagesFromText = () => {
    switch (privacySettings.allowMessagesFrom) {
      case 'everyone': return 'Everyone';
      case 'friends': return 'Friends Only';
      case 'none': return 'No One';
      default: return 'Friends Only';
    }
  };

  const navigateToChatSettings = () => {
    Alert.alert(
      'Chat Privacy Settings',
      'Configure message lifespan, screenshot detection, and end-to-end encryption',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Configure',
          onPress: () => {
            // Navigate to chat settings screen
            Alert.alert('Coming Soon', 'Chat privacy settings will be available in the next update');
          }
        }
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#0A1929', '#0F2942', '#1A3A5F']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Privacy',
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
        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Ghost Mode</Text>
        {renderSettingItem(
          <Ghost size={24} color="#6C5CE7" />,
          "Ghost Mode",
          "Become invisible to others and hide from discovery",
          isGhostModeEnabled,
          () => handleToggle('ghostMode')
        )}

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Location & Visibility</Text>
        {renderSettingItem(
          <MapPin size={24} color="#6C5CE7" />,
          "Show Location",
          "Allow others to see your approximate location",
          privacySettings.showLocation,
          () => handleToggle('showLocation')
        )}
        {renderSettingItem(
          <Eye size={24} color="#6C5CE7" />,
          "Show Online Status",
          "Let friends see when you're online",
          privacySettings.showOnlineStatus,
          () => handleToggle('showOnlineStatus')
        )}
        {renderSettingItem(
          <Clock size={24} color="#6C5CE7" />,
          "Show Last Seen",
          "Let others see when you were last active",
          privacySettings.showLastSeen,
          () => handleToggle('showLastSeen')
        )}

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Communication</Text>
        {renderSettingItem(
          <UserPlus size={24} color="#6C5CE7" />,
          "Allow Friend Requests",
          "Let others send you friend requests",
          privacySettings.allowFriendRequests,
          () => handleToggle('allowFriendRequests')
        )}
        
        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={handleMessagesFromChange}
        >
          <View style={styles.settingLeft}>
            <MessageSquare size={24} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: '#FFFFFF' }]}>Allow Messages From</Text>
              <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                Who can send you messages
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <Text style={[styles.settingValue, { color: '#6C5CE7' }]}>
              {getMessagesFromText()}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
          onPress={navigateToChatSettings}
        >
          <View style={styles.settingLeft}>
            <Lock size={24} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: '#FFFFFF' }]}>Chat Privacy</Text>
              <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                Message lifespan, screenshots, encryption
              </Text>
            </View>
          </View>
          <View style={styles.settingRight}>
            <ArrowLeft size={20} color="#6C5CE7" style={{ transform: [{ rotate: '180deg' }] }} />
          </View>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Notifications</Text>
        {renderSettingItem(
          <Bell size={24} color="#6C5CE7" />,
          "Screenshot Alerts",
          "Get notified when someone screenshots your content",
          settings?.notificationSettings?.screenshotNotifications || true,
          () => updateSettings({
            notificationSettings: {
              ...settings?.notificationSettings,
              screenshotNotifications: !(settings?.notificationSettings?.screenshotNotifications || true)
            }
          })
        )}
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