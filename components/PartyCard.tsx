import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Users, Clock, LogIn, LogOut, MapPin } from 'lucide-react-native';
import { Party } from '@/types/user';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

interface PartyCardProps {
  party: Party;
  onPress?: () => void;
  onJoin?: () => void;
  onLeave?: () => void;
}

export function PartyCard({ party, onPress, onJoin, onLeave }: PartyCardProps) {
  const { colors } = useThemeColors();
  const { currentUser, joinParty, leaveParty } = useUserStore();
  
  if (!currentUser) return null;
  
  const isCreator = party.creatorId === currentUser.id;
  const isParticipant = party.participants?.includes(currentUser.id);
  
  const getTimeRemaining = () => {
    if (!party.expiresAt) return '';
    
    const now = Date.now();
    const timeLeft = party.expiresAt - now;
    
    if (timeLeft <= 0) return 'Expired';
    
    const hours = Math.floor(timeLeft / 3600000);
    const minutes = Math.floor((timeLeft % 3600000) / 60000);
    
    return `${hours}h ${minutes}m left`;
  };

  const formatPartyTime = () => {
    if (!party.partyTime) return '';
    
    const partyDate = new Date(party.partyTime);
    return partyDate.toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleJoinLeave = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        console.log('Haptics not available');
      }
    }
    
    if (isParticipant) {
      if (onLeave) {
        onLeave();
      } else {
        leaveParty(party.id);
      }
    } else {
      if (onJoin) {
        onJoin();
      } else {
        joinParty(party.id);
      }
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.card }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.nameContainer}>
          {party.emoji && <Text style={styles.emoji}>{party.emoji}</Text>}
          <Text style={[styles.partyName, { color: colors.text }]}>{party.name}</Text>
        </View>
        {party.expiresAt && (
          <View style={styles.timeContainer}>
            <Clock size={14} color={colors.subtext} />
            <Text style={[styles.timeText, { color: colors.subtext }]}>{getTimeRemaining()}</Text>
          </View>
        )}
      </View>
      
      {party.partyTime && (
        <View style={styles.partyTimeContainer}>
          <Clock size={16} color={colors.primary} />
          <Text style={[styles.partyTimeText, { color: colors.text }]}>
            {formatPartyTime()}
          </Text>
        </View>
      )}
      
      {party.location && (
        <View style={styles.locationContainer}>
          <MapPin size={16} color={colors.primary} />
          <Text style={[styles.locationText, { color: colors.text }]}>
            {party.location}
          </Text>
        </View>
      )}
      
      <View style={styles.infoRow}>
        <View style={styles.participantsContainer}>
          <Users size={16} color={colors.primary} />
          <Text style={[styles.participantsText, { color: colors.text }]}>
            {party.participants?.length || 0} {party.participants?.length === 1 ? 'person' : 'people'}
          </Text>
        </View>
        
        {isCreator ? (
          <View style={[styles.creatorBadge, { backgroundColor: 'rgba(108, 92, 231, 0.1)' }]}>
            <Text style={[styles.creatorText, { color: colors.primary }]}>Creator</Text>
          </View>
        ) : (
          <TouchableOpacity 
            style={[
              styles.joinButton,
              { backgroundColor: 'rgba(108, 92, 231, 0.1)' },
              isParticipant && [styles.leaveButton, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]
            ]}
            onPress={handleJoinLeave}
          >
            {isParticipant ? (
              <>
                <LogOut size={16} color={colors.error} />
                <Text style={[styles.leaveText, { color: colors.error }]}>Leave</Text>
              </>
            ) : (
              <>
                <LogIn size={16} color={colors.primary} />
                <Text style={[styles.joinText, { color: colors.primary }]}>Join</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emoji: {
    fontSize: 20,
    marginRight: 8,
  },
  partyName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    marginLeft: 4,
  },
  partyTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  partyTimeText: {
    fontSize: 14,
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  participantsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantsText: {
    fontSize: 14,
    marginLeft: 6,
  },
  creatorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creatorText: {
    fontSize: 12,
    fontWeight: '500',
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  joinText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  leaveButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
  },
  leaveText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});