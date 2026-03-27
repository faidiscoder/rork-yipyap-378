import React from 'react';
import { View, Text, StyleSheet, Switch, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Database, Download, Trash2, LogOut, Edit, FileText, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function AccountSettings() {
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { settings, updateSettings, currentUser, logout } = useUserStore();

  const accountSettings = settings?.accountSettings || {
    dataUsage: 'medium',
    autoSaveMedia: true,
  };

  const handleToggle = (key: keyof typeof accountSettings) => {
    const newValue = !accountSettings[key];
    
    updateSettings({
      accountSettings: {
        ...accountSettings,
        [key]: newValue,
      },
    });

    if (key === 'autoSaveMedia') {
      Alert.alert(
        'Auto-Save Media',
        newValue 
          ? 'Photos and videos will now be automatically saved to your device' 
          : 'Photos and videos will no longer be automatically saved'
      );
    }
  };

  const handleDataUsageChange = () => {
    const options = ['low', 'medium', 'high'] as const;
    const currentIndex = options.indexOf(accountSettings.dataUsage);
    const nextIndex = (currentIndex + 1) % options.length;
    const nextValue = options[nextIndex];
    
    updateSettings({
      accountSettings: {
        ...accountSettings,
        dataUsage: nextValue,
      },
    });

    const messages = {
      low: 'Data usage set to Low - images and videos will be compressed more heavily',
      medium: 'Data usage set to Medium - balanced quality and data usage',
      high: 'Data usage set to High - best quality, more data usage'
    };

    Alert.alert('Data Usage Updated', messages[nextValue]);
  };

  const handleBack = () => {
    router.back();
  };

  const handleEditProfile = () => {
    router.push('/profile/edit');
  };

  const handleTermsAndConditions = () => {
    router.push('/settings/terms');
  };

  const handleExportData = () => {
    Alert.alert(
      'Export Data',
      'Your data export will be prepared and sent to your email address. This may take a few minutes.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Export', 
          onPress: () => {
            // Simulate export process
            Alert.alert('Export Started', 'You will receive an email when your data is ready for download.');
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Confirm Deletion',
              'This will permanently delete your account and all associated data. Type "DELETE" to confirm.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'DELETE', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await logout();
                      Alert.alert('Account Deleted', 'Your account has been permanently deleted.', [
                        { text: 'OK', onPress: () => router.replace('/auth/login') }
                      ]);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete account');
                    }
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Log Out', 
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              Alert.alert('Logged Out', 'You have been logged out successfully.', [
                { text: 'OK', onPress: () => router.replace('/auth/login') }
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to log out');
            }
          }
        }
      ]
    );
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

  const renderActionItem = (
    icon: React.ReactNode,
    label: string,
    description: string,
    onPress: () => void,
    color: string = '#FFFFFF'
  ) => (
    <TouchableOpacity 
      style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
      onPress={onPress}
    >
      <View style={styles.settingLeft}>
        {icon}
        <View style={styles.settingText}>
          <Text style={[styles.settingLabel, { color }]}>{label}</Text>
          <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const getDataUsageText = () => {
    switch (accountSettings.dataUsage) {
      case 'low': return 'Low';
      case 'medium': return 'Medium';
      case 'high': return 'High';
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
          title: 'Account',
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
        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Profile</Text>
        {renderActionItem(
          <Edit size={24} color="#6C5CE7" />,
          "Edit Profile",
          "Update your profile information and photos",
          handleEditProfile
        )}

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Data & Storage</Text>
        <View style={[styles.settingItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <View style={styles.settingLeft}>
            <Database size={24} color="#6C5CE7" />
            <View style={styles.settingText}>
              <Text style={[styles.settingLabel, { color: '#FFFFFF' }]}>Data Usage</Text>
              <Text style={[styles.settingDescription, { color: 'rgba(255, 255, 255, 0.7)' }]}>
                Control how much data the app uses
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleDataUsageChange}>
            <Text style={[styles.settingValue, { color: '#6C5CE7' }]}>
              {getDataUsageText()}
            </Text>
          </TouchableOpacity>
        </View>

        {renderSettingItem(
          <Download size={24} color="#6C5CE7" />,
          "Auto-Save Media",
          "Automatically save photos and videos to your device",
          accountSettings.autoSaveMedia,
          () => handleToggle('autoSaveMedia')
        )}

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Legal</Text>
        {renderActionItem(
          <FileText size={24} color="#6C5CE7" />,
          "Terms & Conditions",
          "View our terms and conditions",
          handleTermsAndConditions
        )}

        <Text style={[styles.sectionTitle, { color: '#FFFFFF' }]}>Account Actions</Text>
        {renderActionItem(
          <Download size={24} color="#6C5CE7" />,
          "Export Data",
          "Download a copy of your data",
          handleExportData
        )}

        {renderActionItem(
          <LogOut size={24} color="#FF9500" />,
          "Log Out",
          "Sign out of your account",
          handleLogout,
          '#FF9500'
        )}

        {renderActionItem(
          <Trash2 size={24} color="#FF3B30" />,
          "Delete Account",
          "Permanently delete your account and all data",
          handleDeleteAccount,
          '#FF3B30'
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