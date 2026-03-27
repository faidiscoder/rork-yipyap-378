import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, Platform, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Bell, MessageSquare, UserPlus, PartyPopper, Volume2, Vibrate, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NotificationSettings() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { settings, updateSettings } = useUserStore();

  const notificationSettings = settings?.notificationSettings || {
    pushNotifications: true,
    messageNotifications: true,
    friendRequestNotifications: true,
    partyInviteNotifications: true,
    soundEnabled: true,
    vibrationEnabled: true,
  };

  const handleToggle = async (key: keyof typeof notificationSettings) => {
    const newValue = !notificationSettings[key];
    
    // Handle push notifications permission
    if (key === 'pushNotifications' && newValue) {
      try {
        if (Platform.OS !== 'web') {
          // For native platforms, we would request permissions here
          Alert.alert(
            'Notifications Enabled',
            'Push notifications have been enabled. You will receive notifications when the app is closed.',
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Web Notifications',
            'Browser notifications are not fully supported. You will still receive in-app notifications.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to enable notifications');
        return;
      }
    }

    updateSettings({
      notificationSettings: {
        ...notificationSettings,
        [key]: newValue,
      },
    });

    // Show confirmation for important settings
    if (key === 'pushNotifications') {
      Alert.alert(
        'Settings Updated',
        newValue 
          ? 'Push notifications have been enabled' 
          : 'Push notifications have been disabled'
      );
    }
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

  return (
    <LinearGradient
      colors={['#0A1929', '#0F2942', '#1A3A5F']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Notifications',
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
        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Push Notifications</Text>
        {renderSettingItem(
          <Bell size={24} color="#6C5CE7" />,
          "Push Notifications",
          "Receive notifications when the app is closed",
          notificationSettings.pushNotifications,
          () => handleToggle('pushNotifications')
        )}

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Message Notifications</Text>
        {renderSettingItem(
          <MessageSquare size={24} color="#6C5CE7" />,
          "New Messages",
          "Get notified when you receive new messages",
          notificationSettings.messageNotifications,
          () => handleToggle('messageNotifications')
        )}
        {renderSettingItem(
          <UserPlus size={24} color="#6C5CE7" />,
          "Friend Requests",
          "Get notified when someone sends you a friend request",
          notificationSettings.friendRequestNotifications,
          () => handleToggle('friendRequestNotifications')
        )}
        {renderSettingItem(
          <PartyPopper size={24} color="#6C5CE7" />,
          "Party Invites",
          "Get notified when you are invited to parties",
          notificationSettings.partyInviteNotifications,
          () => handleToggle('partyInviteNotifications')
        )}

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Sound & Vibration</Text>
        {renderSettingItem(
          <Volume2 size={24} color="#6C5CE7" />,
          "Sound",
          "Play sounds for notifications",
          notificationSettings.soundEnabled,
          () => handleToggle('soundEnabled')
        )}
        {renderSettingItem(
          <Vibrate size={24} color="#6C5CE7" />,
          "Vibration",
          "Vibrate for notifications",
          notificationSettings.vibrationEnabled,
          () => handleToggle('vibrationEnabled')
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