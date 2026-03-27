import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useUserStore } from '@/store/userStore';
import { UserCard } from '@/components/UserCard';
import { mockUsers } from '@/mocks/users';
import { Check, X } from 'lucide-react-native';

export function FriendRequestsList() {
  const { colors } = useThemeColors();
  const { acceptFriendRequest, declineFriendRequest, incomingRequests } = useUserStore();

  // Get actual friend requests from store
  const friendRequests = mockUsers.filter(user => 
    Array.isArray(incomingRequests) && incomingRequests.includes(user.id)
  );

  if (friendRequests.length === 0) {
    return null;
  }

  const handleAccept = async (userId: string) => {
    try {
      await acceptFriendRequest(userId);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleDecline = async (userId: string) => {
    try {
      await declineFriendRequest(userId);
    } catch (error) {
      console.error('Failed to decline friend request:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: '#1A1A1A' }]}>
      <Text style={[styles.title, { color: '#FFFFFF' }]}>Friend Requests</Text>
      <View style={styles.requestsList}>
        {friendRequests.map(user => (
          <View key={user.id} style={[styles.requestCard, { backgroundColor: '#2A2A2A' }]}>
            <View style={styles.userCardContainer}>
              <UserCard
                user={user}
                showMutual
                showDistance
                showAddButton={false}
              />
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(user.id)}
              >
                <Check size={20} color="#FFFFFF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.declineButton]}
                onPress={() => handleDecline(user.id)}
              >
                <X size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 16,
    borderRadius: 12,
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  requestsList: {
    gap: 12,
  },
  requestCard: {
    borderRadius: 12,
    padding: 12,
  },
  userCardContainer: {
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
});