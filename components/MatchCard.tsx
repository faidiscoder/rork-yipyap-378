import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart, X, MessageCircle, Sparkles, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { User, Match } from '@/types/user';
import { useUserStore } from '@/store/userStore';
import { Platform } from 'react-native';

interface MatchCardProps {
  match: Match;
  matchedUser: User;
  onAccept?: () => void;
  onReject?: () => void;
  onMessage?: () => void;
  onIgnore?: () => void;
}

export function MatchCard({ match, matchedUser, onAccept, onReject, onMessage, onIgnore }: MatchCardProps) {
  const { colors } = useThemeColors();
  const { currentUser } = useUserStore();

  if (!currentUser || !match || !matchedUser?.id) {
    return null;
  }

  const handleAction = (action: () => void) => {
    if (Platform.OS !== 'web') {
      try {
        import('expo-haptics').then(Haptics => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        });
      } catch (e) {
        console.log('Haptics not available');
      }
    }
    action();
  };

  const isInitiator = match.initiatorId === currentUser.id;
  const userStatus = isInitiator ? match.status : match.recipientStatus;
  const otherUserStatus = isInitiator ? match.recipientStatus : match.status;

  const bothAccepted = match.mutualMatch && match.status === 'accepted' && match.recipientStatus === 'accepted';
  const waitingForOther = match.mutualMatch && userStatus === 'accepted' && otherUserStatus === 'pending';

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Sparkles size={20} color={colors.primary} />
        <Text style={[styles.headerText, { color: colors.primary }]}>Daily Match</Text>
      </View>
      
      <View style={styles.content}>
        <Image source={{ uri: matchedUser.avatar }} style={styles.avatar} />
        
        <View style={styles.userInfo}>
          <Text style={[styles.displayName, { color: colors.text }]}>
            {matchedUser.displayName}
          </Text>
          <Text style={[styles.username, { color: colors.subtext }]}>
            @{matchedUser.username}
          </Text>
          {matchedUser.age && (
            <Text style={[styles.age, { color: colors.subtext }]}>
              {matchedUser.age} years old
            </Text>
          )}
          {matchedUser.school && (
            <Text style={[styles.school, { color: colors.subtext }]}>
              {matchedUser.school}
            </Text>
          )}
          {matchedUser.bio && (
            <Text style={[styles.bio, { color: colors.text }]} numberOfLines={2}>
              {matchedUser.bio}
            </Text>
          )}
        </View>
      </View>

      {waitingForOther ? (
        <View style={styles.waitingContainer}>
          <Clock size={20} color={colors.subtext} />
          <Text style={[styles.waitingText, { color: colors.subtext }]}>
            Waiting for {matchedUser.displayName} to respond...
          </Text>
        </View>
      ) : bothAccepted ? (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.messageButton, { backgroundColor: colors.primary }]}
            onPress={() => onMessage && handleAction(onMessage)}
          >
            <MessageCircle size={20} color="#FFFFFF" />
            <Text style={styles.messageButtonText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      ) : userStatus === 'pending' ? (
        <View style={styles.actions}>
          {onReject && (
            <TouchableOpacity 
              style={[styles.rejectButton, { backgroundColor: colors.error }]}
              onPress={() => handleAction(onReject)}
            >
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          {onMessage && (
            <TouchableOpacity 
              style={[styles.messageButton, { backgroundColor: colors.primary }]}
              onPress={() => handleAction(onMessage)}
            >
              <MessageCircle size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          {onAccept && (
            <TouchableOpacity 
              style={[styles.acceptButton, { backgroundColor: colors.success }]}
              onPress={() => handleAction(onAccept)}
            >
              <Heart size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          {onIgnore && (
            <TouchableOpacity 
              style={[styles.ignoreButton, { backgroundColor: colors.subtext }]}
              onPress={() => handleAction(onIgnore)}
            >
              <Text style={styles.ignoreButtonText}>Ignore</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  displayName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    marginBottom: 4,
  },
  age: {
    fontSize: 14,
    marginBottom: 4,
  },
  school: {
    fontSize: 14,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    lineHeight: 20,
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  waitingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  rejectButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ignoreButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  ignoreButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});