import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert, Platform } from 'react-native';
import type { Message } from '@/types/chat';
import { useThemeColors } from '@/hooks/useThemeColors';
import { useChatStore } from '@/store/chatStore';
import { Bookmark, BookmarkCheck, Trash2, Reply, Copy, Camera, Download } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';

const { width } = Dimensions.get('window');

interface ChatMessageProps {
  message: Message;
  isFromCurrentUser: boolean;
  onReply?: () => void;
  onViewYip?: (message: Message) => void;
  isLastMessage?: boolean;
  showReadReceipt?: boolean;
}

export function ChatMessage({ 
  message, 
  isFromCurrentUser, 
  onReply, 
  onViewYip, 
  isLastMessage = false,
  showReadReceipt = false 
}: ChatMessageProps) {
  const { colors, isDark } = useThemeColors();
  const { saveMessage, unsaveMessage, deleteMessage, saveYipInChat } = useChatStore();
  const [showActions, setShowActions] = useState(false);
  
  // Skip all system messages
  if (message.type === 'system') {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={styles.systemMessageText}>{message.content}</Text>
      </View>
    );
  }

  // Format timestamp
  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowActions(true);
  };

  const handleSave = () => {
    saveMessage(message.chatId || '', message.id);
    setShowActions(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleSaveYipInChat = () => {
    if (message.chatId) {
      saveYipInChat(message.chatId, message.id);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Saved', 'Yip saved in chat');
    }
    setShowActions(false);
  };

  const handleUnsave = () => {
    unsaveMessage(message.chatId || '', message.id);
    setShowActions(false);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Message',
      'Do you want to delete this message?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => setShowActions(false)
        },
        {
          text: 'Delete for Me',
          style: 'destructive',
          onPress: () => {
            deleteMessage(message.chatId || '', message.id, 'me');
            setShowActions(false);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        },
        {
          text: 'Delete for Everyone',
          style: 'destructive',
          onPress: () => {
            deleteMessage(message.chatId || '', message.id, 'everyone');
            setShowActions(false);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          }
        }
      ]
    );
  };

  const handleCopy = async () => {
    if (message.content) {
      await Clipboard.setStringAsync(message.content);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Copied', 'Message copied to clipboard');
    }
    setShowActions(false);
  };

  const handleReply = () => {
    if (onReply) {
      onReply();
    }
    setShowActions(false);
  };

  const handleSaveToCamera = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'This feature is not available on web');
      return;
    }

    try {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant permission to save photos');
        return;
      }

      if (message.imageUri) {
        // For local files
        if (message.imageUri.startsWith('file://')) {
          await MediaLibrary.saveToLibraryAsync(message.imageUri);
        } 
        // For remote files
        else {
          const fileUri = `${FileSystem.cacheDirectory}temp_image_${Date.now()}.jpg`;
          const downloadResult = await FileSystem.downloadAsync(message.imageUri, fileUri);
          
          if (downloadResult.status === 200) {
            await MediaLibrary.saveToLibraryAsync(fileUri);
            // Clean up the temp file
            await FileSystem.deleteAsync(fileUri, { idempotent: true });
          }
        }
        
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        Alert.alert('Saved', 'Image saved to camera roll');
      }
    } catch (error) {
      console.error('Error saving to camera roll:', error);
      Alert.alert('Error', 'Failed to save image to camera roll');
    }
    
    setShowActions(false);
  };

  // Deleted message
  if (message.isDeleted) {
    return (
      <View style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.deletedMessageBubble,
          isFromCurrentUser ? styles.myDeletedMessageBubble : styles.theirDeletedMessageBubble
        ]}>
          <Text style={styles.deletedMessageText}>
            {message.deletedFor === 'everyone' ? 'This message was deleted' : 'You deleted this message'}
          </Text>
        </View>
        <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
      </View>
    );
  }

  // Yip message (unviewed)
  if (message.type === 'yip' && !message.yipStatus?.includes('opened') && !message.yipStatus?.includes('saved')) {
    // Check if yip is expired (24 hours)
    const isExpired = message.timestamp && (Date.now() - message.timestamp > 24 * 60 * 60 * 1000);
    
    if (isExpired && !message.isSaved) {
      return (
        <View style={[
          styles.messageContainer,
          isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
        ]}>
          <View style={[
            styles.yipBubble,
            isFromCurrentUser ? styles.myYipBubble : styles.theirYipBubble,
            styles.expiredYipBubble
          ]}>
            <Text style={styles.expiredYipText}>Yip Expired</Text>
          </View>
          <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
        </View>
      );
    }
    
    return (
      <TouchableOpacity 
        style={[
          styles.messageContainer,
          isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
        ]}
        onPress={isFromCurrentUser ? undefined : () => onViewYip && onViewYip(message)}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        <View style={[
          styles.yipBubble,
          isFromCurrentUser ? styles.myYipBubble : styles.theirYipBubble
        ]}>
          <View style={styles.yipContainer}>
            <View style={[
              styles.yipDot,
              { backgroundColor: isFromCurrentUser ? '#4A90E2' : '#FF3B30' }
            ]} />
            <Text style={styles.yipText}>
              {isFromCurrentUser ? 'Sent' : 'Tap to view'}
            </Text>
          </View>
          {message.yipStatus === 'delivered' && isFromCurrentUser && (
            <Text style={styles.yipStatus}>Delivered</Text>
          )}
        </View>
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
          {isLastMessage && showReadReceipt && !isFromCurrentUser && message.isRead && (
            <Text style={styles.readReceipt}>Read</Text>
          )}
        </View>
        
        {showActions && (
          <View style={styles.messageActions}>
            {isFromCurrentUser ? (
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveYipInChat}>
                <Bookmark size={20} color="#FFFFFF" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
                <Reply size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Yip message (viewed or saved)
  if (message.type === 'yip' && (message.yipStatus?.includes('opened') || message.yipStatus?.includes('saved'))) {
    if (message.isSaved) {
      // Saved Yip - show as regular image
      return (
        <TouchableOpacity 
          style={[
            styles.messageContainer,
            isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
          ]}
          onLongPress={handleLongPress}
          activeOpacity={0.9}
        >
          <View style={styles.savedYipContainer}>
            <Image 
              source={{ uri: message.imageUri }}
              style={styles.savedYipImage}
              resizeMode="contain"
            />
            {message.yipCaption && (
              <Text style={styles.yipCaption}>{message.yipCaption}</Text>
            )}
            <View style={styles.savedYipBadge}>
              <Text style={styles.savedYipBadgeText}>Saved in Chat</Text>
            </View>
          </View>
          
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
            {isLastMessage && showReadReceipt && !isFromCurrentUser && message.isRead && (
              <Text style={styles.readReceipt}>Read</Text>
            )}
          </View>
          
          {showActions && (
            <View style={styles.messageActions}>
              <TouchableOpacity style={styles.actionButton} onPress={handleUnsave}>
                <BookmarkCheck size={20} color="#4CD964" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleSaveToCamera}>
                <Download size={20} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
                <Trash2 size={20} color="#FF3B30" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
                <Reply size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
      );
    } else {
      // Opened but not saved Yip
      return (
        <View style={[
          styles.messageContainer,
          isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
        ]}>
          <View style={[
            styles.yipBubble,
            isFromCurrentUser ? styles.myYipBubble : styles.theirYipBubble,
            styles.openedYipBubble
          ]}>
            <Text style={styles.openedYipText}>
              {message.yipStatus === 'screenshot' ? 'Screenshot' : 'Opened'}
            </Text>
          </View>
          <View style={styles.messageFooter}>
            <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
            {isLastMessage && showReadReceipt && !isFromCurrentUser && message.isRead && (
              <Text style={styles.readReceipt}>Read</Text>
            )}
          </View>
        </View>
      );
    }
  }

  // Image message
  if (message.type === 'image' && message.imageUri) {
    return (
      <TouchableOpacity 
        style={[
          styles.messageContainer,
          isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
        ]}
        onLongPress={handleLongPress}
        activeOpacity={0.9}
      >
        <Image 
          source={{ uri: message.imageUri }}
          style={styles.imageMessage}
          resizeMode="cover"
        />
        
        {message.isSaved && (
          <View style={styles.savedIndicator}>
            <BookmarkCheck size={16} color="#4CD964" />
          </View>
        )}
        
        <View style={styles.messageFooter}>
          <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
          {isLastMessage && showReadReceipt && !isFromCurrentUser && message.isRead && (
            <Text style={styles.readReceipt}>Read</Text>
          )}
        </View>
        
        {showActions && (
          <View style={styles.messageActions}>
            {message.isSaved ? (
              <TouchableOpacity style={styles.actionButton} onPress={handleUnsave}>
                <BookmarkCheck size={20} color="#4CD964" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Bookmark size={20} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.actionButton} onPress={handleSaveToCamera}>
              <Download size={20} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Trash2 size={20} color="#FF3B30" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
              <Reply size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  // Regular text message
  return (
    <TouchableOpacity 
      style={[
        styles.messageContainer,
        isFromCurrentUser ? styles.myMessageContainer : styles.theirMessageContainer
      ]}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
    >
      <View style={[
        styles.messageBubble,
        isFromCurrentUser ? styles.myMessageBubble : styles.theirMessageBubble
      ]}>
        <Text style={[
          styles.messageText,
          isFromCurrentUser ? styles.myMessageText : styles.theirMessageText
        ]}>
          {message.content}
        </Text>
        
        {message.isSaved && (
          <View style={styles.savedIndicator}>
            <BookmarkCheck size={16} color="#4CD964" />
          </View>
        )}
      </View>
      
      <View style={styles.messageFooter}>
        <Text style={styles.messageTime}>{formatTime(message.timestamp)}</Text>
        {isLastMessage && showReadReceipt && !isFromCurrentUser && message.isRead && (
          <Text style={styles.readReceipt}>Read</Text>
        )}
      </View>
      
      {showActions && (
        <View style={styles.messageActions}>
          {message.isSaved ? (
            <TouchableOpacity style={styles.actionButton} onPress={handleUnsave}>
              <BookmarkCheck size={20} color="#4CD964" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
              <Bookmark size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionButton} onPress={handleCopy}>
            <Copy size={20} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
            <Trash2 size={20} color="#FF3B30" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={handleReply}>
            <Reply size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative',
  },
  myMessageBubble: {
    backgroundColor: '#0084FF',
  },
  theirMessageBubble: {
    backgroundColor: '#333333',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#FFFFFF',
  },
  imageMessage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  messageTime: {
    fontSize: 10,
    color: '#999999',
  },
  readReceipt: {
    fontSize: 10,
    color: '#4A90E2',
    fontWeight: '500',
  },
  savedIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 2,
  },
  messageActions: {
    position: 'absolute',
    top: -50,
    right: 0,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 8,
    zIndex: 100,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  systemMessageText: {
    fontSize: 12,
    color: '#999999',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deletedMessageBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  myDeletedMessageBubble: {
    backgroundColor: 'rgba(0, 132, 255, 0.1)',
  },
  theirDeletedMessageBubble: {
    backgroundColor: 'rgba(51, 51, 51, 0.1)',
  },
  deletedMessageText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999999',
  },
  yipBubble: {
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
  },
  myYipBubble: {
    backgroundColor: '#1A1A1A',
  },
  theirYipBubble: {
    backgroundColor: '#1A1A1A',
  },
  yipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  yipDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  yipText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  yipStatus: {
    fontSize: 12,
    color: '#FFFFFF',
    marginTop: 4,
    opacity: 0.8,
  },
  openedYipBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  openedYipText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  expiredYipBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  expiredYipText: {
    fontSize: 14,
    color: '#999999',
    fontStyle: 'italic',
  },
  savedYipContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  savedYipImage: {
    width: width * 0.6,
    height: width * 0.6,
    resizeMode: 'contain',
  },
  savedYipBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(76, 217, 100, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savedYipBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  yipCaption: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    color: '#FFFFFF',
    padding: 8,
    fontSize: 14,
  },
});