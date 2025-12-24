import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform, 
  Image,
  Keyboard,
  ActivityIndicator,
  Animated,
  Pressable,
  StatusBar,
  Alert,
  ScrollView,
  Modal,
  Dimensions,
  PanResponder
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { getUserById } from '@/mocks/users';
import { ChatMessage } from '@/components/ChatMessage';
import { Camera, Image as ImageIcon, MoreVertical, ArrowLeft, X, Info, Settings, Users, Bookmark, RefreshCw, Zap, ZapOff, Check, Edit } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useThemeColors } from '@/hooks/useThemeColors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useNotifications } from '@/hooks/useNotifications';
import { UserAvatar } from '@/components/UserAvatar';
import { CameraView, CameraType } from 'expo-camera';
import * as ScreenCapture from 'expo-screen-capture';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ChatScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useThemeColors();
  const router = useRouter();
  const chatStore = useChatStore();
  const { currentUser, parties, createParty, inviteToParty, getUserCreatedParties } = useUserStore();
  const notifications = useNotifications();
  
  // Safely get the chat ID from params
  const id = params?.id || '';
  
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [screenshotTaken, setScreenshotTaken] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const [showPartyModal, setShowPartyModal] = useState(false);
  
  // Camera specific states
  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState(false);
  
  // Yip specific states
  const [viewingYip, setViewingYip] = useState<any>(null);
  const [yipViewProgress, setYipViewProgress] = useState(0);
  const [yipViewTimer, setYipViewTimer] = useState<NodeJS.Timeout | null>(null);
  const [yipCaption, setYipCaption] = useState('');
  const [showYipCamera, setShowYipCamera] = useState(false);
  const [yipCameraFacing, setYipCameraFacing] = useState<CameraType>('front');
  const [yipImage, setYipImage] = useState<string | null>(null);
  const [yipRecipient, setYipRecipient] = useState<string | null>(null);
  const [capturedMedia, setCapturedMedia] = useState<string | null>(null);
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [captionPosition, setCaptionPosition] = useState({ top: screenHeight * 0.25, left: 20 });
  const [isDragging, setIsDragging] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const yipCameraRef = useRef<CameraView>(null);
  const cameraRef = useRef<CameraView>(null);
  
  // Safely get chat and messages
  const chat = id ? chatStore.getChat(id) : null;
  const messages = id ? chatStore.getMessages(id) : [];
  
  // Get other participant for direct chats
  const otherParticipantId = chat?.participants?.find(
    p => p !== currentUser?.id && p !== 'current_user'
  );
  
  // Safely get other participant
  const otherParticipant = otherParticipantId ? getUserById(otherParticipantId) : null;
  
  // Get chat name
  const chatName = chat?.isGroup 
    ? chat.name || 'Group Chat'
    : otherParticipant?.displayName || otherParticipant?.name || 'Chat';

  // Check if someone is typing
  const someoneIsTyping = id ? chatStore.isTyping(id) : false;
  const typingUsers = id ? chatStore.getTypingUsers(id).filter(uid => uid !== 'current_user') : [];

  // Check if current user is party owner
  const isPartyOwner = chat?.type === 'party' && chat.createdBy === 'current_user';

  // Get chat settings
  const chatSettings = id ? chatStore.getChatSettings(id) : { messageLifespan: 'default', muted: false };

  // Create pan responder for draggable caption with improved sensitivity and smoothness
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderMove: (_, gestureState) => {
        setCaptionPosition(prev => {
          const newTop = Math.max(50, Math.min(screenHeight - 200, prev.top + gestureState.dy));
          const newLeft = Math.max(10, Math.min(screenWidth - 50, prev.left + gestureState.dx));
          
          return {
            top: newTop,
            left: newLeft,
          };
        });
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      },
    })
  ).current;

  useEffect(() => {
    if (id) {
      try {
        // Initialize chat and fetch messages from backend
        chatStore.initializeChats().then(() => {
          chatStore.fetchMessages(id);
          chatStore.markChatAsRead(id);
        });
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    }
    
    // Keyboard listeners
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );
    
    // Setup screenshot detection
    if (Platform.OS !== 'web') {
      const subscription = ScreenCapture.addScreenshotListener(() => {
        if (viewingYip) {
          handleYipScreenshot();
        }
      });
      
      return () => {
        keyboardDidShowListener.remove();
        keyboardDidHideListener.remove();
        subscription.remove();
        if (id && typingTimeout) {
          clearTimeout(typingTimeout);
          chatStore.clearTyping(id);
        }
        if (yipViewTimer) {
          clearTimeout(yipViewTimer);
        }
      };
    }
    
    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
      if (id && typingTimeout) {
        clearTimeout(typingTimeout);
        chatStore.clearTyping(id);
      }
      if (yipViewTimer) {
        clearTimeout(yipViewTimer);
      }
    };
  }, [id]);

  // Always scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  // Handle Yip viewing timer
  useEffect(() => {
    if (viewingYip && !yipViewTimer) {
      const duration = viewingYip.yipViewDuration || 10;
      const interval = 100;
      let elapsed = 0;
      
      const timer = setInterval(() => {
        elapsed += interval;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        setYipViewProgress(progress);
        
        if (progress >= 1) {
          clearInterval(timer);
          handleYipViewed();
        }
      }, interval);
      
      setYipViewTimer(timer as unknown as NodeJS.Timeout);
      
      return () => {
        clearInterval(timer);
      };
    }
    
    return () => {
      if (yipViewTimer) {
        clearTimeout(yipViewTimer);
      }
    };
  }, [viewingYip]);

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return;
    if (!id) return;
    
    try {
      setIsLoading(true);
      
      if (selectedImage) {
        await chatStore.sendImageMessage(id, selectedImage);
        setSelectedImage(null);
      } else {
        await chatStore.sendMessage(id, message);
      }
      
      setMessage('');
      
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTyping = () => {
    if (id) {
      chatStore.setTyping(id);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      const timeout = setTimeout(() => {
        if (id) {
          chatStore.clearTyping(id);
        }
      }, 3000) as unknown as NodeJS.Timeout;
      
      setTypingTimeout(timeout);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1.0,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0].uri);
        setShowImagePicker(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const openCamera = async () => {
    setShowCamera(true);
  };

  const handleBack = () => {
    router.back();
  };

  const handleChatInfo = () => {
    if (!chat) return;
    
    if (chat.type === 'party' && chat.id.startsWith('party_')) {
      const partyId = chat.id.replace('party_', '');
      router.push(`/party/${partyId}`);
    } else if (chat.isGroup) {
      setShowParticipants(true);
    } else if (otherParticipant) {
      router.push(`/profile/${otherParticipant.id}`);
    }
  };

  const handleViewParticipants = () => {
    setShowParticipants(true);
  };

  const handleSendParty = () => {
    setShowPartyModal(true);
  };

  const handleSendExistingParty = async (partyId: string) => {
    if (!otherParticipant || !currentUser) return;
    
    try {
      const party = parties.find(p => p.id === partyId);
      if (!party) {
        Alert.alert('Error', 'Party not found');
        return;
      }
      
      await inviteToParty(partyId, otherParticipant.id);
      await chatStore.sendPartyMessage(id, partyId, party.name);
      
      Alert.alert('Party Sent!', `${otherParticipant.displayName || otherParticipant.name} has been invited to "${party.name}".`);
      setShowPartyModal(false);
    } catch (error) {
      console.error('Error sending party:', error);
      Alert.alert('Error', 'Failed to send party invite');
    }
  };

  const handleCreateNewParty = () => {
    setShowPartyModal(false);
    router.push('/party/create');
  };

  const handleChatSettings = () => {
    if (!chat || !id) return;
    
    const messageLifespanOption = chat.type === 'party' && !isPartyOwner ? [] : [
      {
        text: 'Message Lifespan',
        onPress: () => {
          Alert.alert(
            'Message Lifespan',
            'Choose how long messages stay visible',
            [
              { text: '24 hours after viewing', onPress: () => {
                chatStore.updateChatSettings(id, { messageLifespan: 'default' });
                Alert.alert('Updated', 'Messages will disappear 24 hours after viewing');
              }},
              { text: 'Immediately after viewing', onPress: () => {
                chatStore.updateChatSettings(id, { messageLifespan: 'immediate' });
                Alert.alert('Updated', 'Messages will disappear immediately after viewing');
              }},
              { text: 'Never delete', onPress: () => {
                chatStore.updateChatSettings(id, { messageLifespan: 'never' });
                Alert.alert('Updated', 'Messages will never be deleted');
              }},
              { text: 'Cancel', style: 'cancel' }
            ]
          );
        }
      }
    ];

    const partyOptions = chat.type === 'party' ? 
      (isPartyOwner ? [
        {
          text: 'Delete Party Chat',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Delete Party Chat',
              'Are you sure you want to delete this party chat? This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  style: 'destructive',
                  onPress: () => {
                    if (chat.id.startsWith('party_')) {
                      const partyId = chat.id.replace('party_', '');
                      chatStore.removePartyChat(partyId);
                      router.back();
                    }
                  }
                }
              ]
            );
          }
        }
      ] : [
        {
          text: 'Leave Party Chat',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Leave Party Chat',
              'Are you sure you want to leave this party chat?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Leave', 
                  style: 'destructive',
                  onPress: () => {
                    if (chat.id.startsWith('party_')) {
                      const partyId = chat.id.replace('party_', '');
                      chatStore.leavePartyChat(partyId);
                      router.back();
                    }
                  }
                }
              ]
            );
          }
        }
      ]) : [];

    const muteOption = {
      text: chatSettings.muted ? 'Unmute Notifications' : 'Mute Notifications',
      onPress: () => {
        const newMutedState = !chatSettings.muted;
        chatStore.updateChatSettings(id, { muted: newMutedState });
        Alert.alert('Notifications', newMutedState ? 'Chat muted' : 'Chat unmuted');
      }
    };

    const blockOption = chat.isGroup ? [] : [{
      text: 'Block User',
      style: 'destructive',
      onPress: () => {
        if (otherParticipantId) {
          Alert.alert(
            'Block User',
            `Are you sure you want to block ${otherParticipant?.name || 'this user'}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Block', 
                style: 'destructive',
                onPress: async () => {
                  try {
                    if (otherParticipantId) {
                      await useUserStore.getState().blockUser(otherParticipantId);
                      Alert.alert('User Blocked', 'User has been blocked successfully');
                      router.back();
                    }
                  } catch (error) {
                    console.error('Failed to block user:', error);
                    Alert.alert('Error', 'Failed to block user');
                  }
                }
              }
            ]
          );
        }
      }
    }];

    const clearChatOption = {
      text: 'Clear Chat History',
      style: 'destructive',
      onPress: () => {
        Alert.alert(
          'Clear Chat',
          'Are you sure you want to clear all messages in this chat?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Clear', 
              style: 'destructive',
              onPress: () => {
                chatStore.clearChatHistory(id);
                Alert.alert('Chat Cleared', 'All messages have been deleted');
              }
            }
          ]
        );
      }
    };

    if (chat.type !== 'party' || isPartyOwner) {
      Alert.alert(
        'Chat Settings',
        'Choose an option',
        [
          ...partyOptions,
          ...messageLifespanOption,
          muteOption,
          clearChatOption,
          ...blockOption,
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } else {
      Alert.alert(
        'Chat Settings',
        'Choose an option',
        [
          ...partyOptions,
          muteOption,
          clearChatOption,
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const getChatAvatar = () => {
    if (!chat) return null;
    
    if (chat.isGroup) {
      if (chat.type === 'party') {
        return (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#FF9500' }]}>
            <Text style={styles.avatarText}>{chat.emoji || '🎉'}</Text>
          </View>
        );
      }
      return (
        <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {(chat.name || "Group").charAt(0).toUpperCase()}
          </Text>
        </View>
      );
    }
    
    if (otherParticipant?.avatar) {
      return (
        <UserAvatar 
          uri={otherParticipant.avatar}
          size={40}
        />
      );
    }
    
    return (
      <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
        <Text style={styles.avatarText}>
          {(chatName || 'Chat').charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderParticipantsModal = () => {
    if (!showParticipants || !chat) return null;

    const participants = chat.participants.map(id => {
      if (id === 'current_user') return { ...currentUser, id: 'current_user' };
      return getUserById(id);
    }).filter(Boolean);

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark ? styles.darkModalContent : styles.lightModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark ? styles.darkText : {}]}>
              Participants ({participants.length})
            </Text>
            <TouchableOpacity onPress={() => setShowParticipants(false)}>
              <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.participantsList}>
            {participants.map(user => {
              if (!user) return null;
              return (
                <TouchableOpacity 
                  key={user.id} 
                  style={styles.participantItem}
                  onPress={() => {
                    setShowParticipants(false);
                    if (user.id !== 'current_user') {
                      router.push(`/profile/${user.id}`);
                    }
                  }}
                >
                  <UserAvatar size={40} uri={user.avatar} />
                  <View style={styles.participantInfo}>
                    <Text style={[styles.participantName, isDark ? styles.darkText : {}]}>
                      {user.displayName || user.name}
                      {user.id === chat.createdBy && ' 👑'}
                      {user.id === 'current_user' && ' (You)'}
                    </Text>
                    <Text style={[styles.participantUsername, isDark ? styles.darkSubtext : {}]}>
                      @{user.username || user.name?.toLowerCase().replace(/\s/g, '_')}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowParticipants(false)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderPartyModal = () => {
    if (!showPartyModal) return null;

    const userCreatedParties = getUserCreatedParties();

    return (
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, isDark ? styles.darkModalContent : styles.lightModalContent]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, isDark ? styles.darkText : {}]}>
              Send Party Invite
            </Text>
            <TouchableOpacity onPress={() => setShowPartyModal(false)}>
              <X size={24} color={isDark ? '#FFFFFF' : '#000000'} />
            </TouchableOpacity>
          </View>

          <View style={styles.partyModalContent}>
            {userCreatedParties.length > 0 ? (
              <>
                <Text style={[styles.partyModalText, isDark ? styles.darkText : {}]}>
                  Choose a party to invite {otherParticipant?.displayName || otherParticipant?.name || 'this person'} to:
                </Text>
                
                <ScrollView style={styles.partiesList} showsVerticalScrollIndicator={false}>
                  {userCreatedParties.map((party) => (
                    <TouchableOpacity
                      key={party.id}
                      style={[styles.partyItem, isDark ? styles.darkPartyItem : styles.lightPartyItem]}
                      onPress={() => handleSendExistingParty(party.id)}
                    >
                      <Text style={styles.partyEmoji}>{party.emoji || '🎉'}</Text>
                      <View style={styles.partyItemInfo}>
                        <Text style={[styles.partyItemName, isDark ? styles.darkText : {}]}>
                          {party.name}
                        </Text>
                        <Text style={[styles.partyItemDetails, isDark ? styles.darkSubtext : {}]}>
                          {party.participants?.length || 0} people • {party.location}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            ) : (
              <Text style={[styles.partyModalText, isDark ? styles.darkText : {}]}>
                You haven't created any parties yet.
              </Text>
            )}
            
            <View style={styles.partyModalButtons}>
              <TouchableOpacity 
                style={[styles.partyModalButton, styles.cancelButton]}
                onPress={() => setShowPartyModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.partyModalButton, styles.createButton]}
                onPress={handleCreateNewParty}
              >
                <Text style={styles.createButtonText}>Create New Party 🎉</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      setShowYipCamera(true);
      setYipRecipient(id);
    }
    
    setLastTap(now);
  };

  const handleViewYip = (message: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setViewingYip(message);
    setYipViewProgress(0);
    
    if (id) {
      chatStore.markYipAsViewed(id, message.id);
    }
  };

  const handleYipViewed = () => {
    if (yipViewTimer) {
      clearTimeout(yipViewTimer);
      setYipViewTimer(null);
    }
    
    setViewingYip(null);
    setYipViewProgress(0);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleYipScreenshot = () => {
    if (!viewingYip || !id) return;
    
    chatStore.markYipAsScreenshotted(id, viewingYip.id);
    
    if (viewingYip.senderId !== 'current_user' && viewingYip.senderId !== currentUser?.id) {
      notifications.sendScreenshotNotification(
        currentUser?.displayName || currentUser?.name || 'Someone',
        'Yip'
      );
    }
    
    setScreenshotTaken(true);
    setTimeout(() => setScreenshotTaken(false), 5000);
  };

  const handleSaveYip = () => {
    if (!viewingYip || !id) return;
    
    chatStore.saveYipInChat(id, viewingYip.id);
    handleYipViewed();
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleReplayYip = () => {
    if (!viewingYip || !id || !chat) return;
    
    if ((chat.dailyReplaysRemaining || 0) <= 0) {
      Alert.alert(
        'No Replays Available',
        'You have used all your replays for today. Try again tomorrow!'
      );
      return;
    }
    
    chatStore.useYipReplay(id);
    
    if (yipViewTimer) {
      clearTimeout(yipViewTimer);
      setYipViewTimer(null);
    }
    
    setYipViewProgress(0);
    
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handleSendYipReply = () => {
    if (!viewingYip || !id) return;
    
    handleYipViewed();
    setYipRecipient(id);
    setShowYipCamera(true);
  };

  const handleFlip = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const handleFlash = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setFlash(!flash);
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (Platform.OS === 'web') {
        const timestamp = Date.now();
        const mockPhotoUri = `https://images.unsplash.com/photo-${timestamp % 10 === 0 ? '1506794778202-cad84cf45f1d' : '1535713875002-d1d0cf377fde'}?w=400&h=600&fit=crop&story=${timestamp}.jpg`;
        setCapturedMedia(mockPhotoUri);
      } else {
        const photo = await cameraRef.current.takePictureAsync({
          base64: false,
          quality: 1.0,
        });
        
        if (photo && photo.uri) {
          setCapturedMedia(photo.uri);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleRetakePhoto = () => {
    setCapturedMedia(null);
    setYipCaption('');
    setShowCaptionInput(false);
  };

  const handleAddCaption = () => {
    setShowCaptionInput(true);
  };

  const handleCaptionDone = () => {
    setShowCaptionInput(false);
  };

  const handleSendCapturedMedia = async () => {
    if (!capturedMedia || !id) return;

    try {
      await chatStore.sendYipMessage(
        id,
        capturedMedia,
        yipCaption
      );
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setCapturedMedia(null);
      setYipCaption('');
      setShowCaptionInput(false);
      setShowCamera(false);
    } catch (error) {
      console.error('Failed to send yip:', error);
      Alert.alert('Error', 'Failed to send yip');
    }
  };

  const handleCaptureYip = async () => {
    if (!yipCameraRef.current) return;
    
    try {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      if (Platform.OS === 'web') {
        const timestamp = Date.now();
        const mockPhotoUri = `https://images.unsplash.com/photo-${timestamp % 10 === 0 ? '1506794778202-cad84cf45f1d' : '1535713875002-d1d0cf377fde'}?w=400&h=600&fit=crop&story=${timestamp}.jpg`;
        setYipImage(mockPhotoUri);
      } else {
        const photo = await yipCameraRef.current.takePictureAsync({
          base64: false,
          quality: 1.0,
        });
        
        if (photo && photo.uri) {
          setYipImage(photo.uri);
        }
      }
    } catch (error) {
      console.error('Error taking yip photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleSendYip = async () => {
    if (!yipImage || !yipRecipient) {
      setShowYipCamera(false);
      setYipImage(null);
      setYipCaption('');
      return;
    }
    
    try {
      await chatStore.sendYipMessage(
        yipRecipient,
        yipImage,
        yipCaption
      );
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setShowYipCamera(false);
      setYipImage(null);
      setYipCaption('');
      setYipRecipient(null);
    } catch (error) {
      console.error('Failed to send yip:', error);
      Alert.alert('Error', 'Failed to send yip');
    }
  };

  const handleCancelYip = () => {
    setShowYipCamera(false);
    setYipImage(null);
    setYipCaption('');
    setYipRecipient(null);
  };

  const handleCancelCamera = () => {
    setShowCamera(false);
    setCapturedMedia(null);
    setYipCaption('');
    setShowCaptionInput(false);
  };

  const renderCameraModal = () => {
    if (!showCamera) return null;

    return (
      <Modal
        visible={showCamera}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCancelCamera}
      >
        <View style={styles.cameraContainer}>
          {capturedMedia ? (
            <View style={styles.previewContainer}>
              <Image 
                source={{ uri: capturedMedia }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
              
              {showCaptionInput ? (
                <View 
                  {...panResponder.panHandlers}
                  style={[
                    styles.captionInputContainer,
                    { 
                      top: captionPosition.top, 
                      left: captionPosition.left, 
                      right: screenWidth - captionPosition.left - 200,
                      opacity: isDragging ? 0.8 : 1,
                      transform: [{ scale: isDragging ? 1.05 : 1 }]
                    }
                  ]}
                >
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Add a caption..."
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={yipCaption}
                    onChangeText={setYipCaption}
                    autoFocus
                    maxLength={100}
                  />
                  <TouchableOpacity 
                    style={styles.captionDoneButton}
                    onPress={handleCaptionDone}
                  >
                    <Check size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.previewActions}>
                  <TouchableOpacity 
                    style={styles.previewActionButton}
                    onPress={handleRetakePhoto}
                  >
                    <X size={24} color="#FFFFFF" />
                    <Text style={styles.previewActionText}>Retake</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.previewActionButton}
                    onPress={handleAddCaption}
                  >
                    <Edit size={24} color="#FFFFFF" />
                    <Text style={styles.previewActionText}>Caption</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.previewActionButton}
                    onPress={handleSendCapturedMedia}
                  >
                    <Check size={24} color="#FFFFFF" />
                    <Text style={styles.previewActionText}>Send</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {yipCaption && !showCaptionInput ? (
                <View 
                  {...panResponder.panHandlers}
                  style={[
                    styles.captionPreviewContainer,
                    { 
                      top: captionPosition.top, 
                      left: captionPosition.left, 
                      right: screenWidth - captionPosition.left - 200,
                      opacity: isDragging ? 0.8 : 1,
                      transform: [{ scale: isDragging ? 1.05 : 1 }]
                    }
                  ]}
                >
                  <Text style={styles.captionPreviewText}>{yipCaption}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
              flash={flash ? 'on' : 'off'}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                style={styles.topControls}
              >
                <TouchableOpacity style={styles.topButton} onPress={handleCancelCamera}>
                  <X size={24} color="white" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.topButton} onPress={handleFlash}>
                  {flash ? (
                    <Zap size={24} color="#FFD700" />
                  ) : (
                    <ZapOff size={24} color="white" />
                  )}
                </TouchableOpacity>
              </LinearGradient>

              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.bottomControls}
              >
                <View style={styles.captureRow}>
                  <View style={styles.sideButton} />

                  <View style={styles.captureButtonContainer}>
                    <TouchableOpacity
                      style={styles.captureButton}
                      onPress={handleCapture}
                    >
                      <View style={styles.captureButtonInner} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.sideButton} onPress={handleFlip}>
                    <RefreshCw size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </CameraView>
          )}
        </View>
      </Modal>
    );
  };

  const renderYipViewerModal = () => {
    if (!viewingYip) return null;
    
    return (
      <Modal
        visible={!!viewingYip}
        transparent={false}
        animationType="fade"
        onRequestClose={handleYipViewed}
      >
        <View style={styles.yipViewerContainer}>
          <View style={styles.yipProgressContainer}>
            <View 
              style={[
                styles.yipProgressBar,
                { width: `${yipViewProgress * 100}%` }
              ]}
            />
          </View>
          
          <TouchableOpacity 
            style={styles.yipCloseButton}
            onPress={handleYipViewed}
          >
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Image
            source={{ uri: viewingYip.imageUri }}
            style={styles.yipImage}
            resizeMode="contain"
          />
          
          {viewingYip.yipCaption && (
            <View style={styles.yipCaptionContainer}>
              <Text style={styles.yipCaptionText}>{viewingYip.yipCaption}</Text>
            </View>
          )}
          
          <View style={styles.yipActionsContainer}>
            <TouchableOpacity 
              style={styles.yipActionButton}
              onPress={handleSendYipReply}
            >
              <Camera size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.yipActionButton}
              onPress={handleReplayYip}
            >
              <RefreshCw size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.yipActionButton}
              onPress={handleSaveYip}
            >
              <Bookmark size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.yipChatInputContainer}>
            <TextInput
              style={styles.yipChatInput}
              placeholder="Send a chat"
              placeholderTextColor="#FFFFFF"
              returnKeyType="send"
            />
          </View>
        </View>
      </Modal>
    );
  };

  const renderYipCameraModal = () => {
    if (!showYipCamera) return null;
    
    return (
      <Modal
        visible={showYipCamera}
        transparent={false}
        animationType="slide"
        onRequestClose={handleCancelYip}
      >
        <View style={styles.yipCameraContainer}>
          {yipImage ? (
            <View style={styles.yipPreviewContainer}>
              <Image
                source={{ uri: yipImage }}
                style={styles.yipPreviewImage}
                resizeMode="cover"
              />
              
              {showCaptionInput ? (
                <View 
                  {...panResponder.panHandlers}
                  style={[
                    styles.captionInputContainer,
                    { 
                      top: captionPosition.top, 
                      left: captionPosition.left, 
                      right: screenWidth - captionPosition.left - 200,
                      opacity: isDragging ? 0.8 : 1,
                      transform: [{ scale: isDragging ? 1.05 : 1 }]
                    }
                  ]}
                >
                  <TextInput
                    style={styles.captionInput}
                    placeholder="Add a caption..."
                    placeholderTextColor="rgba(255, 255, 255, 0.7)"
                    value={yipCaption}
                    onChangeText={setYipCaption}
                    autoFocus
                    maxLength={100}
                  />
                  <TouchableOpacity 
                    style={styles.captionDoneButton}
                    onPress={handleCaptionDone}
                  >
                    <Check size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.yipPreviewActions}>
                  <TouchableOpacity 
                    style={styles.yipPreviewActionButton}
                    onPress={() => setYipImage(null)}
                  >
                    <X size={24} color="#FFFFFF" />
                    <Text style={styles.previewActionText}>Retake</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.yipPreviewActionButton}
                    onPress={() => setShowCaptionInput(true)}
                  >
                    <Edit size={24} color="#FFFFFF" />
                    <Text style={styles.previewActionText}>Caption</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.yipPreviewActionButton}
                    onPress={handleSendYip}
                  >
                    <Check size={24} color="#FFFFFF" />
                    <Text style={styles.previewActionText}>Send</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {yipCaption && !showCaptionInput ? (
                <View 
                  {...panResponder.panHandlers}
                  style={[
                    styles.captionPreviewContainer,
                    { 
                      top: captionPosition.top, 
                      left: captionPosition.left, 
                      right: screenWidth - captionPosition.left - 200,
                      opacity: isDragging ? 0.8 : 1,
                      transform: [{ scale: isDragging ? 1.05 : 1 }]
                    }
                  ]}
                >
                  <Text style={styles.captionPreviewText}>{yipCaption}</Text>
                </View>
              ) : null}
            </View>
          ) : (
            <CameraView
              ref={yipCameraRef}
              style={styles.yipCamera}
              facing={yipCameraFacing}
              flash={flash ? 'on' : 'off'}
            >
              <LinearGradient
                colors={['rgba(0,0,0,0.6)', 'transparent']}
                style={styles.yipCameraTopControls}
              >
                <TouchableOpacity 
                  style={styles.yipCameraCloseButton}
                  onPress={handleCancelYip}
                >
                  <X size={24} color="#FFFFFF" />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.yipCameraCloseButton}
                  onPress={handleFlash}
                >
                  {flash ? (
                    <Zap size={24} color="#FFD700" />
                  ) : (
                    <ZapOff size={24} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </LinearGradient>
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.6)']}
                style={styles.yipCameraBottomControls}
              >
                <View style={styles.yipCameraButtonsRow}>
                  <View style={styles.yipCameraSpacer} />
                  
                  <TouchableOpacity 
                    style={styles.yipCaptureButton}
                    onPress={handleCaptureYip}
                  >
                    <View style={styles.yipCaptureButtonInner} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.yipCameraFlipButton}
                    onPress={() => setYipCameraFacing(current => current === 'front' ? 'back' : 'front')}
                  >
                    <RefreshCw size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </CameraView>
          )}
        </View>
      </Modal>
    );
  };

  if (!chat) {
    return (
      <View style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Chat Not Found',
            headerLeft: () => (
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <ArrowLeft size={24} color={isDark ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, isDark ? { color: '#FFFFFF' } : { color: '#000000' }]}>
            Chat not found or could not be loaded
          </Text>
          <TouchableOpacity 
            style={styles.backToChatsButton}
            onPress={() => router.push('/chat')}
          >
            <Text style={styles.backToChatsText}>Back to Chats</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, isDark ? styles.darkContainer : styles.lightContainer]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <LinearGradient
        colors={isDark ? ['#0A3D62', '#1E5D8C'] : ['#0066CC', '#0084FF']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerInfo}
            onPress={handleChatInfo}
            activeOpacity={0.7}
          >
            {getChatAvatar()}
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {chatName}
              </Text>
              {otherParticipant?.isOnline && (
                <Text style={styles.onlineStatus}>Online</Text>
              )}
              {someoneIsTyping && typingUsers.length > 0 && (
                <Text style={styles.typingStatus}>typing...</Text>
              )}
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerActions}>
            {!chat.isGroup && (
              <TouchableOpacity style={styles.infoButton} onPress={handleSendParty}>
                <View style={styles.partyIconContainer}>
                  <Text style={styles.partyEmoji}>🎉</Text>
                </View>
              </TouchableOpacity>
            )}
            {chat.isGroup && (
              <TouchableOpacity style={styles.infoButton} onPress={handleViewParticipants}>
                <Users size={22} color="#FFFFFF" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.infoButton} onPress={handleChatSettings}>
              <Settings size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
      
      <TouchableOpacity 
        activeOpacity={1}
        onPress={handleDoubleTap}
        style={styles.messagesContainer}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ChatMessage 
              message={item} 
              isFromCurrentUser={item.senderId === currentUser?.id || item.senderId === 'current_user'} 
              onViewYip={() => handleViewYip(item)}
              isLastMessage={index === messages.length - 1}
              showReadReceipt={item.senderId === currentUser?.id || item.senderId === 'current_user'}
            />
          )}
          contentContainerStyle={[
            styles.messagesList,
            isDark ? styles.darkMessagesList : styles.lightMessagesList
          ]}
          onContentSizeChange={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
          onLayout={() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToEnd({ animated: false });
            }
          }}
          ListHeaderComponent={
            screenshotTaken ? (
              <View style={styles.screenshotAlert}>
                <Text style={styles.screenshotText}>
                  {otherParticipant?.name || 'User'} took a screenshot
                </Text>
              </View>
            ) : null
          }
        />
      </TouchableOpacity>
      
      <View style={[
        styles.inputContainer, 
        isDark ? styles.darkInputContainer : styles.lightInputContainer
      ]}>
        {selectedImage ? (
          <View style={styles.selectedImageContainer}>
            <Image source={{ uri: selectedImage }} style={styles.selectedImage} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        ) : null}
        
        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={[styles.mediaButton, isDark && styles.darkMediaButton]}
            onPress={openCamera}
          >
            <Camera size={22} color={isDark ? '#BBBBBB' : '#666666'} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.mediaButton, isDark && styles.darkMediaButton]}
            onPress={pickImage}
          >
            <ImageIcon size={22} color={isDark ? '#BBBBBB' : '#666666'} />
          </TouchableOpacity>
          
          <View style={[
            styles.inputWrapper, 
            isDark ? styles.darkInputWrapper : styles.lightInputWrapper
          ]}>
            <TextInput
              ref={inputRef}
              style={[
                styles.input, 
                isDark ? styles.darkInput : styles.lightInput
              ]}
              placeholder="Send a chat"
              placeholderTextColor={isDark ? '#999999' : '#999999'}
              value={message}
              onChangeText={(text) => {
                setMessage(text);
                handleTyping();
              }}
              multiline
              returnKeyType="send"
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
              enablesReturnKeyAutomatically={true}
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              isDark ? styles.darkSendButton : styles.lightSendButton,
              (!message.trim() && !selectedImage) ? styles.disabledSendButton : {}
            ]}
            onPress={handleSend}
            disabled={!message.trim() && !selectedImage}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </View>

      {renderParticipantsModal()}
      {renderPartyModal()}
      {renderYipViewerModal()}
      {renderYipCameraModal()}
      {renderCameraModal()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  lightContainer: {
    backgroundColor: '#F5F5F5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  header: {
    paddingTop: 50,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  partyIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  partyEmoji: {
    fontSize: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  onlineStatus: {
    color: '#4CD964',
    fontSize: 12,
  },
  typingStatus: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 8,
  },
  lightMessagesList: {
    backgroundColor: '#F5F5F5',
  },
  darkMessagesList: {
    backgroundColor: '#121212',
  },
  inputContainer: {
    borderTopWidth: 1,
    padding: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    position: 'relative',
    bottom: 0,
  },
  lightInputContainer: {
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  darkInputContainer: {
    borderTopColor: '#333333',
    backgroundColor: '#1A1A1A',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 12,
    marginHorizontal: 8,
    minHeight: 40,
  },
  lightInputWrapper: {
    backgroundColor: '#F0F0F0',
  },
  darkInputWrapper: {
    backgroundColor: '#2A2A2A',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  lightInput: {
    color: '#000000',
  },
  darkInput: {
    color: '#FFFFFF',
  },
  mediaButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: 4,
  },
  darkMediaButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#0084FF',
    marginLeft: 4,
  },
  lightSendButton: {
    backgroundColor: '#0084FF',
  },
  darkSendButton: {
    backgroundColor: '#0084FF',
  },
  disabledSendButton: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedImageContainer: {
    position: 'relative',
    marginBottom: 8,
    alignSelf: 'flex-start',
    borderRadius: 12,
    overflow: 'hidden',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  screenshotAlert: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  screenshotText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: '80%',
    maxHeight: '70%',
    borderRadius: 16,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  darkModalContent: {
    backgroundColor: '#2A2A2A',
  },
  lightModalContent: {
    backgroundColor: '#FFFFFF',
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
  darkText: {
    color: '#FFFFFF',
  },
  darkSubtext: {
    color: '#BBBBBB',
  },
  participantsList: {
    maxHeight: 300,
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  participantInfo: {
    marginLeft: 12,
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  participantUsername: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#0084FF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  partyModalContent: {
    paddingVertical: 20,
  },
  partyModalText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#000000',
  },
  partiesList: {
    maxHeight: 200,
    marginBottom: 20,
  },
  partyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  lightPartyItem: {
    backgroundColor: '#F5F5F5',
  },
  darkPartyItem: {
    backgroundColor: '#333333',
  },
  partyItemInfo: {
    flex: 1,
  },
  partyItemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  partyItemDetails: {
    fontSize: 14,
    color: '#666666',
  },
  partyModalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  partyModalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#CCCCCC',
  },
  createButton: {
    backgroundColor: '#FF9500',
  },
  cancelButtonText: {
    color: '#666666',
    fontWeight: '600',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  yipViewerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yipProgressContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    zIndex: 10,
  },
  yipProgressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  yipCloseButton: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yipImage: {
    width: screenWidth,
    height: screenHeight,
    resizeMode: 'contain',
  },
  yipCaptionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  yipCaptionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
  },
  yipActionsContainer: {
    position: 'absolute',
    bottom: 70,
    right: 16,
    flexDirection: 'row',
    zIndex: 10,
  },
  yipActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  yipChatInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'center',
  },
  yipChatInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 16,
  },
  yipCameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  yipCamera: {
    flex: 1,
  },
  yipCameraTopControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  yipCameraCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yipCameraBottomControls: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
  },
  yipCameraButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  yipCameraSpacer: {
    width: 40,
    height: 40,
  },
  yipCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  yipCaptureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
  },
  yipCameraFlipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yipPreviewContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yipPreviewImage: {
    width: screenWidth,
    height: screenHeight,
    resizeMode: 'cover',
  },
  yipPreviewActions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  yipPreviewActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  backToChatsButton: {
    backgroundColor: '#0084FF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backToChatsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50,
  },
  topButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 50,
  },
  captureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 50,
  },
  sideButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonContainer: {
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'black',
  },
  previewImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  previewActions: {
    position: 'absolute',
    bottom: 100,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
  },
  previewActionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  previewActionText: {
    color: 'white',
    marginTop: 8,
    fontSize: 14,
  },
  captionInputContainer: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: screenWidth - 40,
    minWidth: 200,
  },
  captionInput: {
    flex: 1,
    color: 'white',
    fontSize: 18,
  },
  captionDoneButton: {
    marginLeft: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6C5CE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captionPreviewContainer: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    padding: 12,
    maxWidth: screenWidth - 40,
    minWidth: 100,
  },
  captionPreviewText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
});