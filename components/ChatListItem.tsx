import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { Chat } from '@/types/chat';
import { UserAvatar } from './UserAvatar';
import { formatDistanceToNow } from 'date-fns';
import { useUserStore } from '@/store/userStore';
import { getUserById } from '@/mocks/users';
import { BellOff } from 'lucide-react-native';

interface ChatListItemProps {
  chat: Chat;
  onPress: () => void;
  onDoubleTap?: () => void;
}

export function ChatListItem({ chat, onPress, onDoubleTap }: ChatListItemProps) {
  const { colors, isDark } = useThemeColors();
  const { currentUser } = useUserStore();
  
  // Safety check - if chat is undefined, return null
  if (!chat) {
    return null;
  }
  
  // For direct chats, get the other participant
  // Add safety check for participants array
  const otherParticipantId = chat?.participants?.find(p => p !== 'current_user' && p !== currentUser?.id);
  
  // Get user from mock data
  const otherParticipant = otherParticipantId ? getUserById(otherParticipantId) : null;
  
  // Format the last message time
  const lastMessageTime = chat?.lastMessage?.timestamp 
    ? formatDistanceToNow(new Date(chat.lastMessage.timestamp), { addSuffix: true })
    : '';
  
  // Handle double tap
  let lastTap = 0;
  const handlePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      // Double tap detected
      if (onDoubleTap) {
        onDoubleTap();
      }
    } else {
      // Single tap
      onPress();
    }
    
    lastTap = now;
  };

  // Get chat name - prioritize chat name for groups, otherwise use participant name
  const chatName = chat.isGroup 
    ? chat.name 
    : otherParticipant?.displayName || otherParticipant?.name || 'Chat';

  // Get last message preview
  const getLastMessagePreview = () => {
    if (!chat.lastMessage) {
      return 'Start a conversation';
    }

    const message = chat.lastMessage;
    
    if (message.type === 'yip') {
      return message.yipStatus === 'delivered' ? '📸 Yip' : '📸 Yip • Opened';
    }
    
    if (message.type === 'image') {
      return '📷 Photo';
    }
    
    if (message.type === 'party') {
      return '🎉 Party invite';
    }
    
    return message.content || 'New message';
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      {chat.isGroup ? (
        <View style={[styles.groupAvatarContainer, { backgroundColor: colors.primary }]}>
          <Text style={styles.groupAvatarText}>
            {chat.emoji || chat.name?.charAt(0).toUpperCase() || 'G'}
          </Text>
        </View>
      ) : (
        <UserAvatar 
          uri={otherParticipant?.avatar}
          size={50}
        />
      )}
      
      {/* Chat info */}
      <View style={styles.infoContainer}>
        <View style={styles.nameContainer}>
          <Text 
            style={[
              styles.name, 
              { color: isDark ? '#FFFFFF' : '#000000' },
              chat.unreadCount > 0 && styles.unreadName
            ]}
            numberOfLines={1}
          >
            {chatName}
          </Text>
          <Text style={[styles.time, { color: isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }]}>
            {lastMessageTime}
          </Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text 
            style={[
              styles.message, 
              { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' },
              chat.unreadCount > 0 && styles.unreadMessage
            ]}
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </Text>
          
          <View style={styles.badgeContainer}>
            {chat.isMuted && (
              <View style={[styles.muteBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }]}>
                <BellOff size={12} color={isDark ? '#FFFFFF' : '#000000'} />
              </View>
            )}
            
            {chat.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadCount}>
                  {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  groupAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  groupAvatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  unreadName: {
    fontWeight: '700',
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  muteBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: 14,
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});