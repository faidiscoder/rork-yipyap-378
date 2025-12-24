import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UserAvatar } from '@/components/UserAvatar';
import { mockUsers } from '@/mocks/users';
import { Calendar, MapPin, Users, Clock, Lock, Globe, UserPlus, UserMinus, Crown, MoreHorizontal, MessageSquare, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export default function PartyDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const { currentUser, parties, joinParty, leaveParty, getParty } = useUserStore();
  const { createPartyChat, getChat } = useChatStore();
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);

  const partyId = Array.isArray(id) ? id[0] : id;
  const party = getParty(partyId);
  const chatId = `party_${partyId}`;
  const partyChat = getChat(chatId);

  useEffect(() => {
    // Check if party chat exists, if not create it
    if (party && !partyChat && party.participants.includes(currentUser?.id || '')) {
      createPartyChatIfNeeded();
    }
  }, [party, partyChat]);

  const createPartyChatIfNeeded = async () => {
    if (!party) return;
    
    try {
      setIsChatLoading(true);
      // Filter out current user from participants
      const otherParticipants = party.participants.filter(p => p !== currentUser?.id && p !== 'current_user');
      await createPartyChat(party.id, party.name, otherParticipants);
    } catch (error) {
      console.error('Failed to create party chat:', error);
    } finally {
      setIsChatLoading(false);
    }
  };

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
            headerShadowVisible: false,
            headerTransparent: true,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ),
          }} 
        />
        <Text style={[styles.errorText, { color: '#FFFFFF' }]}>Party not found</Text>
      </LinearGradient>
    );
  }

  const isParticipant = party.participants.includes(currentUser?.id || '') || party.participants.includes('current_user');
  const isCreator = party.createdBy === currentUser?.id || party.hostId === currentUser?.id || party.createdBy === 'current_user' || party.hostId === 'current_user';
  const canJoin = !isParticipant && party.participants.length < (party.maxParticipants || 50);
  const isExpired = party.expiresAt && Date.now() > party.expiresAt;

  const participantUsers = mockUsers.filter(u => party.participants.includes(u.id));
  const displayedParticipants = showAllParticipants ? participantUsers : participantUsers.slice(0, 6);

  const handleJoinLeave = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    if (isParticipant) {
      Alert.alert(
        'Leave Party',
        'Are you sure you want to leave this party?',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setIsLoading(false) },
          { 
            text: 'Leave', 
            style: 'destructive', 
            onPress: async () => {
              try {
                await leaveParty(party.id);
                
                // Check if party still exists (it gets deleted if no participants)
                const updatedParty = getParty(party.id);
                
                if (!updatedParty) {
                  Alert.alert('Party Deleted', 'The party has been deleted since you were the last participant', [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace('/(tabs)/chat');
                      }
                    }
                  ]);
                } else {
                  Alert.alert('Left Party', 'You have left the party', [
                    {
                      text: 'OK',
                      onPress: () => {
                        router.replace('/(tabs)/chat');
                      }
                    }
                  ]);
                }
              } catch (error: any) {
                Alert.alert('Error', error.message || 'Failed to leave party');
              } finally {
                setIsLoading(false);
              }
            }
          }
        ]
      );
    } else if (canJoin) {
      try {
        await joinParty(party.id);
        
        // Create party chat after joining
        await createPartyChatIfNeeded();
        
        Alert.alert('Joined Party', 'You have joined the party!');
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Failed to join party');
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleOpenChat = () => {
    if (!isParticipant) {
      Alert.alert('Join Party', 'You need to join the party to access the chat');
      return;
    }
    
    if (isChatLoading) {
      Alert.alert('Loading', 'Chat is being created, please wait...');
      return;
    }
    
    if (!partyChat) {
      createPartyChatIfNeeded().then(() => {
        router.push(`/chat/${chatId}`);
      });
    } else {
      router.push(`/chat/${chatId}`);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const getTimeUntilExpiry = () => {
    if (!party.expiresAt) return 'No expiry';
    
    const now = Date.now();
    const timeLeft = party.expiresAt - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const handleViewParticipants = () => {
    setShowParticipantsModal(true);
  };

  const renderParticipantsModal = () => {
    if (!showParticipantsModal) return null;

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark && styles.darkModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark && styles.darkModalTitle]}>Participants ({party.participants.length})</Text>
            <TouchableOpacity onPress={() => setShowParticipantsModal(false)}>
              <Text style={styles.modalCloseButton}>Close</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalParticipantsList}>
            {participantUsers.map(participant => (
              <TouchableOpacity 
                key={participant.id}
                style={[styles.modalParticipantItem, isDark && styles.darkModalParticipantItem]}
                onPress={() => {
                  setShowParticipantsModal(false);
                  router.push(`/profile/${participant.id}`);
                }}
              >
                <UserAvatar size={40} uri={participant.avatar} />
                <View style={styles.modalParticipantInfo}>
                  <View style={styles.participantNameRow}>
                    <Text style={[styles.modalParticipantName, isDark && styles.darkModalParticipantName]}>
                      {participant.displayName || participant.name}
                    </Text>
                    {(participant.id === party.createdBy || participant.id === party.hostId) && (
                      <Crown size={14} color="#FFD700" />
                    )}
                  </View>
                  <Text style={[styles.modalParticipantUsername, isDark && styles.darkModalParticipantUsername]}>
                    @{participant.username || participant.name?.toLowerCase().replace(/\s/g, '_')}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={['#1e3a5f', '#2d5a87', '#3d7ab8']}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Stack.Screen 
          options={{ 
            title: party.name,
            headerStyle: { backgroundColor: 'transparent' },
            headerTintColor: '#FFFFFF',
            headerShadowVisible: false,
            headerTransparent: true,
            headerLeft: () => (
              <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <ArrowLeft size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ),
            headerRight: () => isCreator ? (
              <TouchableOpacity style={styles.headerButton}>
                <MoreHorizontal size={24} color="#FFFFFF" />
              </TouchableOpacity>
            ) : null,
          }} 
        />

        <View style={styles.header}>
          <View style={styles.partyIcon}>
            <Text style={styles.partyEmoji}>{party.emoji || '🎉'}</Text>
          </View>
          
          <Text style={[styles.partyName, { color: '#FFFFFF' }]}>{party.name}</Text>
          <Text style={[styles.partyDescription, { color: '#CCCCCC' }]}>
            {party.description}
          </Text>

          {!isExpired && party.expiresAt && (
            <View style={[styles.timeLeftBadge, { backgroundColor: '#FF9500' }]}>
              <Clock size={16} color="#FFFFFF" />
              <Text style={styles.timeLeftText}>{getTimeUntilExpiry()}</Text>
            </View>
          )}

          {isExpired && (
            <View style={[styles.expiredBadge, { backgroundColor: '#FF3B30' }]}>
              <Text style={styles.expiredText}>Party Expired</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <View style={[styles.detailCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <View style={styles.detailRow}>
              <Calendar size={20} color="#6C5CE7" />
              <Text style={[styles.detailText, { color: '#FFFFFF' }]}>
                {party.expiresAt ? formatDate(party.expiresAt) : 'No date set'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Clock size={20} color="#6C5CE7" />
              <Text style={[styles.detailText, { color: '#FFFFFF' }]}>
                {formatTime(party.partyTime)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <MapPin size={20} color="#6C5CE7" />
              <Text style={[styles.detailText, { color: '#FFFFFF' }]}>
                {party.location}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Users size={20} color="#6C5CE7" />
              <TouchableOpacity 
                style={styles.participantsButton}
                onPress={handleViewParticipants}
              >
                <Text style={[styles.detailText, { color: '#FFFFFF' }]}>
                  {party.participants.length}/{party.maxParticipants || 50} people
                </Text>
                <Text style={styles.viewParticipantsText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.detailRow}>
              <Lock size={20} color="#6C5CE7" />
              <Text style={[styles.detailText, { color: '#FFFFFF' }]}>
                Private Party
              </Text>
            </View>
          </View>

          <View style={[styles.participantsCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}>
            <View style={styles.participantsHeader}>
              <Text style={[styles.participantsTitle, { color: '#FFFFFF' }]}>
                Participants ({party.participants.length})
              </Text>
              {participantUsers.length > 6 && (
                <TouchableOpacity onPress={() => setShowAllParticipants(!showAllParticipants)}>
                  <Text style={[styles.showAllText, { color: '#6C5CE7' }]}>
                    {showAllParticipants ? 'Show Less' : 'Show All'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.participantsList}>
              {displayedParticipants.map(participant => (
                <TouchableOpacity
                  key={participant.id}
                  style={styles.participantItem}
                  onPress={() => router.push(`/profile/${participant.id}`)}
                >
                  <UserAvatar size={40} uri={participant.avatar} />
                  <View style={styles.participantInfo}>
                    <View style={styles.participantNameRow}>
                      <Text style={[styles.participantName, { color: '#FFFFFF' }]}>
                        {participant.displayName || participant.name}
                      </Text>
                      {(participant.id === party.createdBy || participant.id === party.hostId) && (
                        <Crown size={14} color="#FFD700" />
                      )}
                    </View>
                    <Text style={[styles.participantUsername, { color: '#CCCCCC' }]}>
                      @{participant.username || participant.name?.toLowerCase().replace(/\s/g, '_')}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {!isExpired && (
          <View style={styles.actions}>
            {isParticipant && (
              <TouchableOpacity
                style={[styles.chatButton, { backgroundColor: '#6C5CE7' }]}
                onPress={handleOpenChat}
                disabled={isChatLoading}
              >
                {isChatLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MessageSquare size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Party Chat</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: isParticipant 
                    ? '#FF3B30' 
                    : canJoin 
                      ? '#6C5CE7' 
                      : '#666666',
                  opacity: isLoading ? 0.5 : 1
                }
              ]}
              onPress={handleJoinLeave}
              disabled={(!canJoin && !isParticipant) || isLoading}
            >
              {isParticipant ? (
                <>
                  <UserMinus size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {isLoading ? 'Leaving...' : 'Leave Party'}
                  </Text>
                </>
              ) : canJoin ? (
                <>
                  <UserPlus size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>
                    {isLoading ? 'Joining...' : 'Accept'}
                  </Text>
                </>
              ) : (
                <Text style={styles.actionButtonText}>Party Full</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {renderParticipantsModal()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  backButton: {
    marginLeft: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    marginRight: 16,
    padding: 4,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingTop: 100,
  },
  partyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  partyEmoji: {
    fontSize: 40,
  },
  partyName: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  partyDescription: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
  },
  timeLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  timeLeftText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  expiredBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  expiredText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  details: {
    padding: 16,
    gap: 16,
  },
  detailCard: {
    padding: 20,
    borderRadius: 16,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: {
    fontSize: 16,
    flex: 1,
  },
  participantsButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewParticipantsText: {
    color: '#6C5CE7',
    fontSize: 14,
    fontWeight: '600',
  },
  participantsCard: {
    padding: 20,
    borderRadius: 16,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  participantsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  showAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  participantsList: {
    gap: 12,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '600',
  },
  participantUsername: {
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  darkModalContent: {
    backgroundColor: '#1A1A1A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  darkModalTitle: {
    color: '#FFFFFF',
  },
  modalCloseButton: {
    color: '#6C5CE7',
    fontSize: 16,
    fontWeight: '600',
  },
  modalParticipantsList: {
    maxHeight: 400,
  },
  modalParticipantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  darkModalParticipantItem: {
    borderBottomColor: '#333333',
  },
  modalParticipantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  modalParticipantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  darkModalParticipantName: {
    color: '#FFFFFF',
  },
  modalParticipantUsername: {
    fontSize: 14,
    color: '#666666',
  },
  darkModalParticipantUsername: {
    color: '#BBBBBB',
  },
});