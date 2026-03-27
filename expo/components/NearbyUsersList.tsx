import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { UserCard } from './UserCard';
import { User } from '@/types/user';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { AdCard } from '@/components/AdCard';
import { getRandomAd } from '@/services/ads';

interface NearbyUsersListProps {
  users: User[];
  isLoading: boolean;
  onUserPress: (user: User) => void;
  showAddButton?: boolean;
  maxDistance?: number;
  showAge?: boolean;
  showSchool?: boolean;
  showRelationship?: boolean;
}

interface ItemWithAd {
  type: 'user' | 'ad';
  data: User | any;
}

export function NearbyUsersList({
  users,
  isLoading,
  onUserPress,
  showAddButton = true,
  maxDistance,
  showAge = false,
  showSchool = false,
  showRelationship = false,
}: NearbyUsersListProps) {
  const { 
    sendFriendRequest, 
    isPendingRequest, 
    unsendFriendRequest, 
    settings, 
    friends, 
    isFriend 
  } = useUserStore();
  
  const { isDark } = useThemeColors();
  
  const userDistanceSetting = maxDistance || settings?.distanceSettings?.maxDistance || 5;
  
  const safeIsFriend = typeof isFriend === 'function' 
    ? isFriend 
    : () => false;
  
  const safeIsPendingRequest = typeof isPendingRequest === 'function' 
    ? isPendingRequest 
    : () => false;
  
  // Filter users by distance and exclude friends
  const filteredUsers = users.filter(user => 
    (!user.distance || user.distance <= userDistanceSetting) && 
    !safeIsFriend(user.id)
  );

  const handleAddFriend = async (userId: string) => {
    try {
      if (typeof sendFriendRequest === 'function') {
        await sendFriendRequest(userId);
      } else {
        console.error('sendFriendRequest is not a function');
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleUnsendRequest = async (userId: string) => {
    try {
      if (typeof unsendFriendRequest === 'function') {
        await unsendFriendRequest(userId);
      } else {
        console.error('unsendFriendRequest is not a function');
      }
    } catch (error) {
      console.error('Failed to unsend friend request:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0084FF" />
        <Text style={[styles.loadingText, isDark && styles.darkText]}>
          Finding people nearby...
        </Text>
      </View>
    );
  }

  if (filteredUsers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔍</Text>
        <Text style={[styles.emptyTitle, isDark && styles.darkText]}>
          No one nearby
        </Text>
        <Text style={[styles.emptySubtitle, isDark && styles.darkSubtext]}>
          Try increasing your distance settings or check back later!
        </Text>
      </View>
    );
  }

  const itemsWithAds: ItemWithAd[] = [];
  filteredUsers.forEach((user, index) => {
    itemsWithAds.push({ type: 'user', data: user });
    
    if ((index + 1) % 4 === 0) {
      itemsWithAds.push({ type: 'ad', data: getRandomAd() });
    }
  });

  return (
    <FlatList
      data={itemsWithAds}
      keyExtractor={(item, index) => item.type === 'user' ? item.data.id : `ad-${index}`}
      renderItem={({ item }) => {
        if (item.type === 'ad') {
          return (
            <AdCard 
              ad={item.data}
              onPress={() => console.log('Ad clicked:', item.data.title)}
            />
          );
        } else {
          const user = item.data;
          return (
            <UserCard
              user={user}
              onPress={() => onUserPress(user)}
              onAddFriend={() => handleAddFriend(user.id)}
              onUnsend={() => handleUnsendRequest(user.id)}
              showAddButton={showAddButton}
              isPending={safeIsPendingRequest(user.id)}
              maxDistance={userDistanceSetting}
              showAge={showAge}
              showSchool={showSchool}
              showRelationship={showRelationship}
              showDistance={true}
              buttonText="Add"
            />
          );
        }
      }}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  darkText: {
    color: '#FFFFFF',
  },
  darkSubtext: {
    color: '#BBBBBB',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});