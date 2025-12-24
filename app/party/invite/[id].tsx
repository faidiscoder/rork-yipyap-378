import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  FlatList,
  Modal
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { UserCard } from '@/components/UserCard';
import { Check, X, Users, Send, UserPlus } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PartyInviteScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getFriendUsers, getParty } = useUserStore();
  const { sendMessage } = useChatStore();
  
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showInviteAllModal, setShowInviteAllModal] = useState(false);

  const partyId = Array.isArray(id) ? id[0] : id;
  const party = getParty(partyId);
  const friends = getFriendUsers();

  if (!party) {
    return (
      <LinearGradient
        colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
        style={styles.container}
      >
        <Stack.Screen 
          options={{ 
            title: 'Party Not Found',
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: '#FFFFFF',
            headerTransparent: true,
          }} 
        />
        <Text style={[styles.errorText, { color: '#FFFFFF' }]}>Party not found</Text>
      </LinearGradient>
    );
  }

  const toggleFriendSelection = (friendId: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendId) 
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleInviteAll = () => {
    setShowInviteAllModal(true);
  };

  const confirmInviteAll = () => {
    setSelectedFriends(friends.map(friend => friend.id));
    setShowInviteAllModal(false);
    setShowConfirmModal(true);
  };

  const handleSendInvites = () => {
    if (selectedFriends.length === 0) {
      Alert.alert('No Friends Selected', 'Please select at least one friend to invite.');
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmSendInvites = async () => {
    if (selectedFriends.length === 0) return;

    setIsLoading(true);
    setShowConfirmModal(false);

    try {
      // Send party invitation message to each selected friend
      for (const friendId of selectedFriends) {
        const chatId = `chat_${friendId}`;
        await sendMessage(
          chatId, 
          `You're invited to ${party.name}! ${party.description}`, 
          'party',
          undefined,
          undefined,
          party.id
        );
      }
      
      Alert.alert(
        'Invitations Sent!', 
        `Party invitations have been sent to ${selectedFriends.length} friend${selectedFriends.length > 1 ? 's' : ''}!`,
        [
          { 
            text: 'View Party', 
            onPress: () => router.replace(`/party/${party.id}`)
          },
          { 
            text: 'Go to Chats', 
            onPress: () => router.replace('/(tabs)/chat')
          }
        ]
      );
    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert('Error', 'Failed to send some invitations. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Invitations?',
      'You can always invite friends later from the party page.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip', 
          onPress: () => router.replace(`/party/${party.id}`)
        }
      ]
    );
  };

  const renderConfirmModal = () => (
    <Modal
      visible={showConfirmModal}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <Text style={styles.confirmTitle}>Send Invitations?</Text>
          <Text style={styles.confirmMessage}>
            Are you sure you want to send party invitations to {selectedFriends.length} friend{selectedFriends.length > 1 ? 's' : ''}?
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.cancelButton]}
              onPress={() => setShowConfirmModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.sendButton]}
              onPress={confirmSendInvites}
              disabled={isLoading}
            >
              <Text style={styles.sendButtonText}>
                {isLoading ? 'Sending...' : 'Send Invites'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderInviteAllModal = () => (
    <Modal
      visible={showInviteAllModal}
      transparent
      animationType="fade"
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModal}>
          <Text style={styles.confirmTitle}>Invite All Friends?</Text>
          <Text style={styles.confirmMessage}>
            This will select all {friends.length} of your friends to invite to the party. Are you sure?
          </Text>
          <View style={styles.confirmButtons}>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.cancelButton]}
              onPress={() => setShowInviteAllModal(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, styles.sendButton]}
              onPress={confirmInviteAll}
            >
              <Text style={styles.sendButtonText}>Select All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <LinearGradient
      colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
      style={styles.container}
    >
      <Stack.Screen 
        options={{ 
          title: 'Invite Friends',
          headerStyle: { backgroundColor: 'transparent' },
          headerTintColor: '#FFFFFF',
          headerTransparent: true,
          headerRight: () => (
            <TouchableOpacity onPress={handleSkip}>
              <Text style={styles.skipButton}>Skip</Text>
            </TouchableOpacity>
          ),
        }} 
      />

      <View style={[styles.header, { paddingTop: insets.top + 60 }]}>
        <View style={styles.partyInfo}>
          <Text style={styles.partyEmoji}>{party.emoji}</Text>
          <Text style={styles.partyName}>{party.name}</Text>
          <Text style={styles.inviteSubtitle}>
            Invite your friends to join the party!
          </Text>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.inviteAllButton}
            onPress={handleInviteAll}
          >
            <UserPlus size={20} color="#FFFFFF" />
            <Text style={styles.inviteAllText}>Invite All ({friends.length})</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              styles.sendInvitesButton,
              { 
                backgroundColor: selectedFriends.length > 0 ? '#6C5CE7' : 'rgba(108, 92, 231, 0.3)',
                opacity: selectedFriends.length > 0 ? 1 : 0.5 
              }
            ]}
            onPress={handleSendInvites}
            disabled={selectedFriends.length === 0}
          >
            <Send size={20} color="#FFFFFF" />
            <Text style={styles.sendInvitesText}>
              Send Invites ({selectedFriends.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={friends}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.friendItem}
            onPress={() => toggleFriendSelection(item.id)}
          >
            <View style={styles.friendCardWrapper}>
              <UserCard
                user={item}
                showAddButton={false}
                showFullInfo={true}
              />
            </View>
            <View style={[
              styles.checkbox,
              { 
                borderColor: selectedFriends.includes(item.id) ? '#6C5CE7' : 'rgba(255, 255, 255, 0.3)',
                backgroundColor: selectedFriends.includes(item.id) ? '#6C5CE7' : 'transparent'
              }
            ]}>
              {selectedFriends.includes(item.id) && (
                <Check size={16} color="#FFFFFF" />
              )}
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={[styles.friendsList, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          <View style={styles.emptyFriends}>
            <Users size={48} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.emptyFriendsText}>
              No friends to invite yet. Add friends from the Pool!
            </Text>
          </View>
        }
      />

      {renderConfirmModal()}
      {renderInviteAllModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  skipButton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 16,
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  partyInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  partyEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  partyName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  inviteSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteAllButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  inviteAllText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendInvitesButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  sendInvitesText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  friendsList: {
    padding: 16,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  friendCardWrapper: {
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyFriends: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  emptyFriendsText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 12,
  },
  confirmMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#666666',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#6C5CE7',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});