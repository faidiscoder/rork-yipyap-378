import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Ban, AlertTriangle } from 'lucide-react-native';

export function BannedScreen() {
  const router = useRouter();
  const { logout } = useUserStore();
  const { colors, isDark } = useThemeColors();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F8F8' }]}>
      <View style={[styles.content, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.iconContainer}>
          <Ban size={64} color="#FF3B30" />
        </View>
        
        <Text style={[styles.title, { color: isDark ? colors.text : '#333333' }]}>
          Account Suspended
        </Text>
        
        <Text style={[styles.message, { color: isDark ? colors.textSecondary : '#666666' }]}>
          Your account has been suspended due to a violation of our community guidelines.
        </Text>
        
        <View style={[styles.warningBox, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
          <AlertTriangle size={20} color="#FF3B30" />
          <Text style={[styles.warningText, { color: '#FF3B30' }]}>
            If you believe this is a mistake, please contact our support team.
          </Text>
        </View>
        
        <TouchableOpacity
          style={[styles.logoutButton, { backgroundColor: colors.primary }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F8F8F8',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    minWidth: 120,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});