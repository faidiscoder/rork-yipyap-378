import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UserAvatar } from '@/components/UserAvatar';
import { UserX, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { mockUsers } from '@/mocks/users';

export default function BlockedUsersScreen() {
  const { colors } = useThemeColors();
  const router = useRouter();
  const { unblockUser, blockedUsers: storeBlockedUsers } = useUserStore();
  
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize with blocked users from store
  useEffect(() => {
    // Get blocked users from store or use empty array
    const blocked = storeBlockedUsers || [];
    setBlockedUsers(blocked);
  }, [storeBlockedUsers]);

  const handleUnblock = (userId: string) => {
    Alert.alert(
      'Unblock User',
      'Are you sure you want to unblock this user? They will be able to see your profile and send you messages.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Unblock', 
          onPress: async () => {
            setIsLoading(true);
            try {
              await unblockUser(userId);
              // Update local state
              setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
              Alert.alert('User Unblocked', 'User has been unblocked successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  const renderItem = ({ item }) => (
    <View style={[styles.userItem, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
      <View style={styles.userInfo}>
        <UserAvatar size={50} uri={item.avatar} />
        <View style={styles.userDetails}>
          <Text style={[styles.userName, { color: '#FFFFFF' }]}>
            {item.displayName || item.name}
          </Text>
          <Text style={[styles.userUsername, { color: 'rgba(255, 255, 255, 0.7)' }]}>
            @{item.username || item.name?.toLowerCase().replace(/\s/g, '_')}
          </Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.unblockButton}
        onPress={() => handleUnblock(item.id)}
        disabled={isLoading}
      >
        <Text style={styles.unblockText}>Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <LinearGradient
      colors={['#0A1929', '#0F2942', '#1A3A5F']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Blocked Users',
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
      
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C5CE7" />
          </View>
        ) : blockedUsers.length > 0 ? (
          <FlatList
            data={blockedUsers}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <UserX size={64} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.emptyTitle}>No Blocked Users</Text>
            <Text style={styles.emptyText}>
              You have not blocked any users yet. Blocked users will not be able to see your profile or send you messages.
            </Text>
          </View>
        )}
      </View>
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
  listContent: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 16,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Rubik-SemiBold',
  },
  userUsername: {
    fontSize: 14,
    fontFamily: 'Rubik-Regular',
  },
  unblockButton: {
    backgroundColor: '#6C5CE7',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  unblockText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: 'Rubik-SemiBold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Rubik-Bold',
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Rubik-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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