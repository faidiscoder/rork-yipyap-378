import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Chat, Message } from '@/types/chat';
import { Platform } from 'react-native';
import { trpcClient } from '@/lib/trpc';
import { mockYipMessages } from '@/mocks/chats';

interface ChatState {
  chats: Chat[];
  messages: Record<string, Message[]>;
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, string[]>;
  chatSettings: Record<string, {
    messageLifespan: 'default' | 'immediate' | 'never';
    muted: boolean;
    wallpaper?: string;
  }>;
  isLoading: boolean;
  
  // Actions
  initializeChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'video' | 'voice' | 'party' | 'system' | 'yip', imageUri?: string, videoUri?: string, partyId?: string) => Promise<void>;
  sendPartyMessage: (chatId: string, partyId: string, partyName: string) => Promise<void>;
  markAsRead: (chatId: string, messageId: string) => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
  saveMessage: (chatId: string, messageId: string) => void;
  unsaveMessage: (chatId: string, messageId: string) => void;
  deleteMessage: (chatId: string, messageId: string, deleteFor: 'me' | 'everyone') => void;
  clearAllNotifications: () => void;
  clearChatHistory: (chatId: string) => void;
  getUnreadCount: (chatId: string) => number;
  getTotalUnreadCount: () => number;
  removeFriendFromChats: (friendId: string) => void;
  createGroupChat: (groupId: string, groupName: string, participants: string[]) => Promise<void>;
  removePartyChat: (partyId: string) => void;
  createSchoolChat: (schoolId: string, schoolName: string, participants: string[]) => Promise<void>;
  removeSchoolChat: (schoolId: string) => void;
  addUserToSchoolChat: (schoolId: string, userId: string) => void;
  simulateIncomingMessage: (chatId: string, senderId: string) => void;
  getChat: (chatId: string) => Chat | undefined;
  getMessages: (chatId: string) => Message[];
  sendImageMessage: (chatId: string, imageUri: string) => Promise<void>;
  sendYip: (chatId: string) => Promise<void>;
  setTyping: (chatId: string) => void;
  clearTyping: (chatId: string) => void;
  isTyping: (chatId: string) => boolean;
  getTypingUsers: (chatId: string) => string[];
  createPartyChat: (partyId: string, partyName: string, participants: string[], emoji?: string) => Promise<void>;
  updateChatSettings: (chatId: string, settings: Partial<{
    messageLifespan: 'default' | 'immediate' | 'never';
    muted: boolean;
    wallpaper?: string;
  }>) => void;
  getChatSettings: (chatId: string) => {
    messageLifespan: 'default' | 'immediate' | 'never';
    muted: boolean;
    wallpaper?: string;
  };
  muteChat: (chatId: string, duration?: string) => Promise<void>;
  unmuteChat: (chatId: string) => Promise<void>;
  updateChatMuteStatus: (chatId: string, isMuted: boolean, mutedUntil?: number | null) => void;
  leavePartyChat: (partyId: string) => void;
  notifyScreenshot: (chatId: string) => void;
  
  // Yip specific actions
  sendYipMessage: (chatId: string, imageUri: string, caption?: string) => Promise<void>;
  markYipAsViewed: (chatId: string, messageId: string) => void;
  markYipAsScreenshotted: (chatId: string, messageId: string) => void;
  saveYipInChat: (chatId: string, messageId: string) => void;
  useYipReplay: (chatId: string) => void;
  resetDailyReplays: () => void;
  checkYipExpirations: () => void;
  cleanupExpiredMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      chats: [],
      messages: {},
      unreadCounts: {},
      typingUsers: {},
      chatSettings: {},
      isLoading: false,

      getChat: (chatId: string) => {
        return get().chats.find(chat => chat.id === chatId);
      },

      getMessages: (chatId: string) => {
        return get().messages[chatId] || [];
      },

      initializeChats: async () => {
        try {
          set({ isLoading: true });
          console.log('🔄 Initializing chats from backend');
          
          // Check if we're in test mode
          const isTestMode = (global as any).authToken?.startsWith('test_token_');
          
          if (isTestMode) {
            console.log('🧪 Test mode - using mock chats');
            // Create mock chats for test mode
            const mockChats = [
              {
                id: 'chat_friend1',
                name: 'Taylor Smith',
                participants: [{ id: 'friend1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' }],
                lastMessage: "Thanks! Are you coming to the party at Sarah's tonight?",
                lastMessageSender: 'friend1',
                lastMessageTime: Date.now() - 3600000,
                unreadCount: 2,
                type: 'direct',
                isMuted: false,
                mutedUntil: null
              },
              {
                id: 'chat_friend2',
                name: 'Jordan Lee',
                participants: [{ id: 'friend2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' }],
                lastMessage: "Have you read the book I recommended? It's life-changing!",
                lastMessageSender: 'friend2',
                lastMessageTime: Date.now() - 7200000,
                unreadCount: 1,
                type: 'direct',
                isMuted: false,
                mutedUntil: null
              },
              {
                id: 'chat_friend3',
                name: 'Casey Brown',
                participants: [{ id: 'friend3', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' }],
                lastMessage: "Basketball game tomorrow at 3pm, you in?",
                lastMessageSender: 'friend3',
                lastMessageTime: Date.now() - 10800000,
                unreadCount: 1,
                type: 'direct',
                isMuted: false,
                mutedUntil: null
              },
              {
                id: 'chat_friend4',
                name: 'Riley Garcia',
                participants: [{ id: 'friend4', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face' }],
                lastMessage: "Party at my place tonight! Starting at 8pm. Bringing anyone?",
                lastMessageSender: 'friend4',
                lastMessageTime: Date.now() - 14400000,
                unreadCount: 0,
                type: 'direct',
                isMuted: false,
                mutedUntil: null
              },
              {
                id: 'party_party1',
                name: 'Beach Bonfire Chat',
                participants: [
                  { id: 'friend1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
                  { id: 'friend2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
                  { id: 'friend3', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face' }
                ],
                lastMessage: "I'll bring snacks and soda",
                lastMessageSender: 'friend3',
                lastMessageTime: Date.now() - 5200000,
                unreadCount: 3,
                type: 'party',
                isMuted: false,
                mutedUntil: null
              },
              {
                id: 'school_test_high',
                name: 'Test High School',
                participants: [
                  { id: 'friend1', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face' },
                  { id: 'friend2', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
                  { id: 'friend4', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&crop=face' }
                ],
                lastMessage: "Anyone going to the football game this Friday?",
                lastMessageSender: 'friend1',
                lastMessageTime: Date.now() - 18000000,
                unreadCount: 0,
                type: 'school',
                isMuted: true,
                mutedUntil: null
              }
            ];
            
            const transformedChats: Chat[] = mockChats.map(chat => ({
              id: chat.id,
              name: chat.name,
              participants: chat.participants.map(p => p.id),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              lastMessageAt: chat.lastMessageTime,
              lastMessage: {
                id: `msg_${Date.now()}`,
                content: chat.lastMessage,
                senderId: chat.lastMessageSender,
                timestamp: chat.lastMessageTime,
                type: 'text' as const,
                isRead: false,
                status: 'delivered' as const,
                chatId: chat.id
              },
              unreadCount: chat.unreadCount,
              isGroup: chat.type !== 'direct',
              avatar: chat.participants[0]?.avatar,
              isParty: chat.type === 'party',
              isSchool: chat.type === 'school',
              type: chat.type as 'direct' | 'group' | 'party' | 'school',
              isMuted: chat.isMuted,
              mutedUntil: chat.mutedUntil,
              yipStreak: 0,
              lastYipAt: 0,
              dailyReplaysRemaining: 1,
            })).sort((a, b) => {
              const aTime = a.lastMessageAt || new Date(a.updatedAt).getTime() || new Date(a.createdAt).getTime() || 0;
              const bTime = b.lastMessageAt || new Date(b.updatedAt).getTime() || new Date(b.createdAt).getTime() || 0;
              return bTime - aTime;
            });
            
            // Also populate mock messages
            const mockMessages: Record<string, Message[]> = {};
            Object.keys(mockYipMessages).forEach(chatId => {
              mockMessages[chatId] = mockYipMessages[chatId];
            });
            
            set({ 
              chats: transformedChats,
              messages: mockMessages,
              isLoading: false 
            });
            
            console.log(`✅ Loaded ${transformedChats.length} mock chats with messages`);
            return;
          }
          
          // Fetch chats from backend
          const response = await trpcClient.chats.getChats.query();
          
          if (response.success && response.chats) {
            // Transform backend chats to frontend format and sort by most recent
            const transformedChats: Chat[] = response.chats
              .map(chat => ({
                id: chat.id,
                name: chat.name || 'Chat',
                participants: chat.participants.map(p => p.id),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                lastMessageAt: chat.lastMessageTime || Date.now(),
                lastMessage: chat.lastMessage ? {
                  id: `msg_${Date.now()}`,
                  content: chat.lastMessage,
                  senderId: chat.lastMessageSender || 'unknown',
                  timestamp: chat.lastMessageTime || Date.now(),
                  type: (chat.type === 'yip' ? 'yip' : 'text') as 'text' | 'image' | 'video' | 'voice' | 'party' | 'system' | 'yip',
                  isRead: false,
                  status: 'delivered' as 'sent' | 'delivered' | 'read' | 'failed' | 'opened',
                  chatId: chat.id
                } : null,
                unreadCount: chat.unreadCount || 0,
                isGroup: chat.type !== 'direct',
                avatar: chat.participants[0]?.avatar,
                isParty: chat.type === 'party',
                isSchool: chat.type === 'school',
                type: chat.type as 'direct' | 'group' | 'party' | 'school',
                isMuted: chat.isMuted || false,
                mutedUntil: chat.mutedUntil || null,
                yipStreak: 0,
                lastYipAt: 0,
                dailyReplaysRemaining: 1,
              }))
              .sort((a, b) => {
                // Sort by most recent message time
                const aTime = a.lastMessageAt || new Date(a.updatedAt).getTime() || new Date(a.createdAt).getTime() || 0;
                const bTime = b.lastMessageAt || new Date(b.updatedAt).getTime() || new Date(b.createdAt).getTime() || 0;
                return bTime - aTime;
              });
            
            set({ 
              chats: transformedChats,
              isLoading: false 
            });
            
            console.log(`✅ Loaded ${transformedChats.length} chats from backend`);
          } else {
            console.log('⚠️ No chats found, using empty state');
            set({ chats: [], isLoading: false });
          }
          
          // Reset daily replays if needed
          get().resetDailyReplays();
          
          // Check for expired Yips
          get().checkYipExpirations();
          
          // Clean up expired messages
          get().cleanupExpiredMessages();
        } catch (error) {
          console.error('❌ Failed to initialize chats from backend:', error);
          // Fallback to empty state
          set({ chats: [], isLoading: false });
        }
      },

      fetchMessages: async (chatId: string) => {
        try {
          console.log('🔄 Fetching messages from backend for chat:', chatId);
          
          // Fetch messages from backend
          const response = await trpcClient.chats.getMessages.query({
            chatId,
            limit: 50
          });
          
          if (response.success && response.messages) {
            // Transform backend messages to frontend format
            const transformedMessages: Message[] = response.messages.map(msg => ({
              id: msg.id,
              content: msg.content,
              senderId: msg.senderId,
              timestamp: msg.timestamp,
              isRead: msg.isRead,
              type: msg.type as 'text' | 'image' | 'video' | 'voice' | 'party' | 'system' | 'yip',
              status: 'delivered' as 'sent' | 'delivered' | 'read' | 'failed' | 'opened',
              chatId: msg.chatId,
              imageUri: msg.imageUri,
              videoUri: msg.videoUri,
              isSaved: msg.isSaved,
              isDeleted: msg.isDeleted,
              expiresAt: msg.expiresAt || undefined,
              viewCount: msg.viewCount,
              yipStatus: msg.type === 'yip' ? 'delivered' : undefined,
              yipViewDuration: msg.type === 'yip' ? 10 : undefined,
              yipCaption: msg.content,
            }));
            
            set(state => ({
              messages: {
                ...state.messages,
                [chatId]: transformedMessages
              }
            }));
            
            console.log(`✅ Loaded ${transformedMessages.length} messages from backend`);
          } else {
            console.log('⚠️ No messages found for chat:', chatId);
            set(state => ({
              messages: {
                ...state.messages,
                [chatId]: []
              }
            }));
          }
        } catch (error) {
          console.error('❌ Failed to fetch messages from backend:', error);
          // Fallback to empty messages
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: []
            }
          }));
        }
      },

      sendMessage: async (chatId: string, content: string, type = 'text', imageUri?: string, videoUri?: string, partyId?: string) => {
        if (!content && !imageUri && !videoUri && !partyId) {
          return;
        }

        try {
          console.log('🔄 Sending message to backend:', { chatId, type, hasImage: !!imageUri });
          
          // Send message to backend
          const response = await trpcClient.chats.sendMessage.mutate({
            chatId,
            content: content || '',
            type: type as any,
            imageUri,
            videoUri,
            replyToId: undefined,
            expiresAfterHours: type === 'yip' ? 24 : undefined
          });
          
          if (response.success) {
            console.log('✅ Message sent successfully to backend');
            
            // Refresh messages to get the latest state
            await get().fetchMessages(chatId);
            
            // Update chat list
            await get().initializeChats();
          } else {
            throw new Error('Failed to send message to backend');
          }
        } catch (error) {
          console.error('❌ Failed to send message to backend:', error);
          
          // Create a local message for immediate UI feedback (fallback)
          const newMessage: Message = {
            id: `msg_${Date.now()}_${Math.random()}`,
            content: content || '',
            senderId: 'current_user',
            timestamp: Date.now(),
            isRead: true,
            type,
            status: 'failed',
            isSaved: false,
            chatId,
            imageUri,
            videoUri,
            expiresAt: type === 'yip' ? Date.now() + (24 * 60 * 60 * 1000) : undefined,
          };

          set(state => {
            const currentMessages = state.messages[chatId] || [];
            return {
              messages: {
                ...state.messages,
                [chatId]: [...currentMessages, newMessage]
              }
            };
          });
        }
      },

      sendPartyMessage: async (chatId: string, partyId: string, partyName: string) => {
        try {
          await get().sendMessage(chatId, `🎉 ${partyName}`, 'party', undefined, undefined, partyId);
        } catch (error) {
          console.error('Failed to send party message:', error);
        }
      },

      sendImageMessage: async (chatId: string, imageUri: string) => {
        try {
          await get().sendMessage(chatId, '', 'image', imageUri);
        } catch (error) {
          console.error('Failed to send image message:', error);
        }
      },

      sendYip: async (chatId: string) => {
        try {
          await get().sendMessage(chatId, "YIP!", 'yip');
        } catch (error) {
          console.error('Failed to send yip:', error);
        }
      },

      sendYipMessage: async (chatId: string, imageUri: string, caption?: string) => {
        try {
          console.log('🔄 Sending Yip message to backend:', { chatId, hasImage: !!imageUri, caption });
          
          // Send yip message to backend
          const response = await trpcClient.chats.sendMessage.mutate({
            chatId,
            content: caption || '',
            type: 'yip',
            imageUri,
            expiresAfterHours: 24 // Yips expire after 24 hours
          });
          
          if (response.success) {
            console.log('✅ Yip sent successfully to backend');
            
            // Refresh messages to get the latest state
            await get().fetchMessages(chatId);
            
            // Update chat list
            await get().initializeChats();
            
            return response.messageId;
          } else {
            throw new Error('Failed to send yip to backend');
          }
        } catch (error) {
          console.error('❌ Failed to send yip to backend:', error);
          throw error;
        }
      },

      markAsRead: async (chatId: string, messageId: string) => {
        try {
          // Update local state immediately
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: state.messages[chatId]?.map(msg =>
                msg.id === messageId ? { ...msg, isRead: true } : msg
              ) || []
            }
          }));
          
          // Note: Backend doesn't have a specific markAsRead endpoint yet
          // This would be implemented when read receipts are fully supported
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      },

      markChatAsRead: async (chatId: string) => {
        try {
          // Update local state immediately
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: state.messages[chatId]?.map(msg => ({ ...msg, isRead: true })) || []
            },
            unreadCounts: {
              ...state.unreadCounts,
              [chatId]: 0
            },
            chats: state.chats.map(chat =>
              chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
            )
          }));
        } catch (error) {
          console.error('Failed to mark chat as read:', error);
        }
      },

      deleteMessage: async (chatId: string, messageId: string, deleteFor: 'me' | 'everyone') => {
        try {
          console.log('🔄 Deleting message from backend:', { chatId, messageId, deleteFor });
          
          // Delete message from backend
          const response = await trpcClient.chats.deleteMessage.mutate({
            messageId,
            deleteFor
          });
          
          if (response.success) {
            console.log('✅ Message deleted successfully from backend');
            
            // Refresh messages to get the latest state
            await get().fetchMessages(chatId);
          } else {
            throw new Error('Failed to delete message from backend');
          }
        } catch (error) {
          console.error('❌ Failed to delete message from backend:', error);
          
          // Fallback to local deletion
          set(state => ({
            messages: {
              ...state.messages,
              [chatId]: state.messages[chatId]?.map(msg =>
                msg.id === messageId ? { 
                  ...msg, 
                  isDeleted: true,
                  deletedFor: deleteFor,
                  content: deleteFor === 'everyone' ? '' : msg.content,
                  imageUri: undefined,
                  videoUri: undefined
                } : msg
              ) || []
            }
          }));
        }
      },

      saveMessage: async (chatId: string, messageId: string) => {
        try {
          console.log('🔄 Saving message to backend:', { chatId, messageId });
          
          // Save message to backend
          const response = await trpcClient.chats.saveMessage.mutate({
            messageId
          });
          
          if (response.success) {
            console.log('✅ Message saved successfully to backend');
            
            // Update local state
            set(state => ({
              messages: {
                ...state.messages,
                [chatId]: state.messages[chatId]?.map(msg =>
                  msg.id === messageId ? { ...msg, isSaved: true } : msg
                ) || []
              }
            }));
          } else {
            throw new Error('Failed to save message to backend');
          }
        } catch (error) {
          console.error('❌ Failed to save message to backend:', error);
        }
      },

      unsaveMessage: async (chatId: string, messageId: string) => {
        try {
          console.log('🔄 Unsaving message from backend:', { chatId, messageId });
          
          // Unsave message from backend
          const response = await trpcClient.chats.unsaveMessage.mutate({
            messageId
          });
          
          if (response.success) {
            console.log('✅ Message unsaved successfully from backend');
            
            // Update local state
            set(state => ({
              messages: {
                ...state.messages,
                [chatId]: state.messages[chatId]?.map(msg =>
                  msg.id === messageId ? { ...msg, isSaved: false } : msg
                ) || []
              }
            }));
          } else {
            throw new Error('Failed to unsave message from backend');
          }
        } catch (error) {
          console.error('❌ Failed to unsave message from backend:', error);
        }
      },

      createGroupChat: async (groupId: string, groupName: string, participants: string[]) => {
        try {
          console.log('🔄 Creating group chat in backend:', { groupId, groupName, participants });
          
          // Create chat in backend
          const response = await trpcClient.chats.createChat.mutate({
            participantIds: participants,
            name: groupName,
            type: 'group'
          });
          
          if (response.success) {
            console.log('✅ Group chat created successfully in backend');
            
            // Refresh chats to get the latest state
            await get().initializeChats();
            
            return response.chatId;
          } else {
            throw new Error('Failed to create group chat in backend');
          }
        } catch (error) {
          console.error('❌ Failed to create group chat in backend:', error);
          throw error;
        }
      },

      createPartyChat: async (partyId: string, partyName: string, participants: string[], emoji?: string) => {
        try {
          console.log('🔄 Creating party chat in backend:', { partyId, partyName, participants });
          
          // Create chat in backend
          const response = await trpcClient.chats.createChat.mutate({
            participantIds: participants,
            name: `${partyName} Chat`,
            type: 'party'
          });
          
          if (response.success) {
            console.log('✅ Party chat created successfully in backend');
            
            // Refresh chats to get the latest state
            await get().initializeChats();
            
            return response.chatId;
          } else {
            throw new Error('Failed to create party chat in backend');
          }
        } catch (error) {
          console.error('❌ Failed to create party chat in backend:', error);
          throw error;
        }
      },

      createSchoolChat: async (schoolId: string, schoolName: string, participants: string[]) => {
        try {
          console.log('🔄 Creating school chat in backend:', { schoolId, schoolName, participants });
          
          // Create chat in backend
          const response = await trpcClient.chats.createChat.mutate({
            participantIds: participants,
            name: schoolName,
            type: 'school'
          });
          
          if (response.success) {
            console.log('✅ School chat created successfully in backend');
            
            // Refresh chats to get the latest state
            await get().initializeChats();
            
            return response.chatId;
          } else {
            throw new Error('Failed to create school chat in backend');
          }
        } catch (error) {
          console.error('❌ Failed to create school chat in backend:', error);
          throw error;
        }
      },

      // Local state management methods (these don't need backend calls)
      clearAllNotifications: () => {
        set(state => ({
          unreadCounts: {},
          chats: state.chats.map(chat => ({ ...chat, unreadCount: 0 }))
        }));
      },

      clearChatHistory: (chatId: string) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: []
          }
        }));
      },

      getUnreadCount: (chatId: string) => {
        const { chats } = get();
        const chat = chats.find(c => c.id === chatId);
        return chat?.unreadCount || 0;
      },

      getTotalUnreadCount: () => {
        const { chats } = get();
        return chats.reduce((total, chat) => total + (chat.unreadCount || 0), 0);
      },

      removeFriendFromChats: (friendId: string) => {
        const chatId = `chat_${friendId}`;
        
        set(state => {
          const filteredChats = state.chats.filter(chat => chat.id !== chatId);
          const filteredMessages = Object.fromEntries(
            Object.entries(state.messages).filter(([id]) => id !== chatId)
          );
          const filteredUnreadCounts = Object.fromEntries(
            Object.entries(state.unreadCounts).filter(([id]) => id !== chatId)
          );
          
          return {
            chats: filteredChats,
            messages: filteredMessages,
            unreadCounts: filteredUnreadCounts
          };
        });
      },

      removePartyChat: (partyId: string) => {
        const chatId = `party_${partyId}`;
        
        set(state => ({
          chats: state.chats.filter(chat => chat.id !== chatId),
          messages: Object.fromEntries(
            Object.entries(state.messages).filter(([id]) => id !== chatId)
          ),
          unreadCounts: Object.fromEntries(
            Object.entries(state.unreadCounts).filter(([id]) => id !== chatId)
          )
        }));
      },

      removeSchoolChat: (schoolId: string) => {
        const chatId = `school_${schoolId}`;
        
        set(state => ({
          chats: state.chats.filter(chat => chat.id !== chatId),
          messages: Object.fromEntries(
            Object.entries(state.messages).filter(([id]) => id !== chatId)
          ),
          unreadCounts: Object.fromEntries(
            Object.entries(state.unreadCounts).filter(([id]) => id !== chatId)
          )
        }));
      },

      addUserToSchoolChat: (schoolId: string, userId: string) => {
        const chatId = `school_${schoolId}`;
        
        set(state => {
          const existingChatIndex = state.chats.findIndex(chat => chat.id === chatId);
          if (existingChatIndex >= 0) {
            const existingChat = state.chats[existingChatIndex];
            const updatedParticipants = [...new Set([...existingChat.participants, userId])];
            
            const updatedChats = [...state.chats];
            updatedChats[existingChatIndex] = {
              ...existingChat,
              participants: updatedParticipants,
              updatedAt: new Date().toISOString(),
            };
            
            return { chats: updatedChats };
          }
          return state;
        });
      },

      simulateIncomingMessage: (chatId: string, senderId: string) => {
        const newMessage: Message = {
          id: `msg_${Date.now()}_${Math.random()}`,
          content: `This is a simulated message from ${senderId}`,
          senderId,
          timestamp: Date.now(),
          isRead: false,
          type: 'text',
          status: 'delivered',
          isSaved: false,
          chatId,
          expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000),
        };
        
        set(state => {
          const currentMessages = state.messages[chatId] || [];
          
          return {
            messages: {
              ...state.messages,
              [chatId]: [...currentMessages, newMessage]
            },
            chats: state.chats.map(chat => 
              chat.id === chatId 
                ? {
                    ...chat,
                    lastMessage: newMessage,
                    lastMessageAt: Date.now(),
                    updatedAt: new Date().toISOString(),
                    unreadCount: (chat.unreadCount || 0) + 1
                  }
                : chat
            )
          };
        });
      },

      setTyping: (chatId: string) => {
        set(state => {
          const currentTypingUsers = state.typingUsers[chatId] || [];
          if (!currentTypingUsers.includes('current_user')) {
            return {
              typingUsers: {
                ...state.typingUsers,
                [chatId]: [...currentTypingUsers, 'current_user']
              }
            };
          }
          return state;
        });
      },

      clearTyping: (chatId: string) => {
        set(state => {
          const currentTypingUsers = state.typingUsers[chatId] || [];
          return {
            typingUsers: {
              ...state.typingUsers,
              [chatId]: currentTypingUsers.filter(id => id !== 'current_user')
            }
          };
        });
      },

      isTyping: (chatId: string) => {
        const typingUsers = get().typingUsers[chatId] || [];
        return typingUsers.length > 0;
      },

      getTypingUsers: (chatId: string) => {
        return get().typingUsers[chatId] || [];
      },

      updateChatSettings: (chatId: string, settings) => {
        set(state => {
          const currentSettings = state.chatSettings[chatId] || {
            messageLifespan: 'default',
            muted: false
          };
          
          return {
            chatSettings: {
              ...state.chatSettings,
              [chatId]: {
                ...currentSettings,
                ...settings
              }
            }
          };
        });
      },

      getChatSettings: (chatId: string) => {
        const settings = get().chatSettings[chatId];
        return settings || {
          messageLifespan: 'default',
          muted: false
        };
      },

      leavePartyChat: (partyId: string) => {
        const chatId = `party_${partyId}`;
        
        set(state => ({
          chats: state.chats.filter(chat => chat.id !== chatId),
          messages: {
            ...state.messages,
            [chatId]: []
          }
        }));
      },

      notifyScreenshot: (chatId: string) => {
        const systemMessage: Message = {
          id: `screenshot_${Date.now()}_${Math.random()}`,
          content: "Screenshot taken",
          senderId: 'system',
          timestamp: Date.now(),
          isRead: true,
          type: 'system',
          status: 'sent',
          isSaved: false,
          chatId,
        };
        
        set(state => {
          const currentMessages = state.messages[chatId] || [];
          return {
            messages: {
              ...state.messages,
              [chatId]: [...currentMessages, systemMessage]
            }
          };
        });
      },

      markYipAsViewed: (chatId: string, messageId: string) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.map(msg =>
              msg.id === messageId ? { 
                ...msg, 
                isRead: true,
                status: 'opened',
                yipStatus: 'opened',
                viewedAt: Date.now(),
                viewCount: (msg.viewCount || 0) + 1,
              } : msg
            ) || []
          }
        }));
      },

      markYipAsScreenshotted: (chatId: string, messageId: string) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.map(msg =>
              msg.id === messageId ? { 
                ...msg, 
                yipStatus: 'screenshot',
                yipScreenshotted: true,
              } : msg
            ) || []
          }
        }));
      },

      saveYipInChat: (chatId: string, messageId: string) => {
        set(state => ({
          messages: {
            ...state.messages,
            [chatId]: state.messages[chatId]?.map(msg =>
              msg.id === messageId ? { 
                ...msg, 
                isSaved: true,
                yipStatus: 'saved',
                expiresAt: undefined,
              } : msg
            ) || []
          }
        }));
      },

      useYipReplay: (chatId: string) => {
        const chat = get().chats.find(c => c.id === chatId);
        if (!chat || (chat.dailyReplaysRemaining || 0) <= 0) {
          return false;
        }
        
        set(state => ({
          chats: state.chats.map(c => 
            c.id === chatId ? { 
              ...c, 
              dailyReplaysRemaining: (c.dailyReplaysRemaining || 1) - 1,
              lastReplayUsedAt: Date.now(),
            } : c
          )
        }));
        
        return true;
      },

      resetDailyReplays: () => {
        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;
        
        set(state => ({
          chats: state.chats.map(chat => {
            if ((chat.lastReplayUsedAt || 0) < now - oneDayMs) {
              return {
                ...chat,
                dailyReplaysRemaining: 1,
              };
            }
            return chat;
          })
        }));
      },

      checkYipExpirations: () => {
        const now = Date.now();
        
        set(state => {
          const updatedMessages = { ...state.messages };
          
          Object.keys(updatedMessages).forEach(chatId => {
            if (!updatedMessages[chatId]) return;
            
            updatedMessages[chatId] = updatedMessages[chatId].map(msg => {
              if (
                msg.type === 'yip' && 
                !msg.isSaved && 
                msg.expiresAt && 
                msg.expiresAt < now
              ) {
                return {
                  ...msg,
                  yipStatus: 'expired',
                  yipExpired: true,
                };
              }
              return msg;
            });
          });
          
          return { messages: updatedMessages };
        });
      },

      cleanupExpiredMessages: () => {
        const now = Date.now();
        const chatSettings = get().chatSettings;
        
        set(state => {
          const updatedMessages = { ...state.messages };
          
          Object.keys(updatedMessages).forEach(chatId => {
            if (!updatedMessages[chatId]) return;
            
            const settings = chatSettings[chatId] || { messageLifespan: 'default' };
            
            updatedMessages[chatId] = updatedMessages[chatId].filter(msg => {
              if (msg.isSaved) return true;
              if (msg.type === 'system') return true;
              
              if (settings.messageLifespan === 'never') {
                return true;
              } else if (settings.messageLifespan === 'immediate' && msg.isRead) {
                return false;
              } else if (msg.expiresAt && msg.expiresAt < now) {
                return false;
              }
              
              return true;
            });
          });
          
          return { messages: updatedMessages };
        });
      },

      muteChat: async (chatId: string, duration = 'forever') => {
        try {
          console.log('🔇 Muting chat:', chatId, 'for', duration);
          
          const response = await trpcClient.chats.muteChat.mutate({
            chatId,
            duration: duration as any
          });
          
          if (response.success) {
            // Update local state
            set(state => ({
              chats: state.chats.map(chat => 
                chat.id === chatId 
                  ? { ...chat, isMuted: true, mutedUntil: response.mutedUntil }
                  : chat
              )
            }));
            
            // Update chat settings
            get().updateChatSettings(chatId, { muted: true });
            
            console.log('✅ Chat muted successfully');
          }
        } catch (error) {
          console.error('❌ Failed to mute chat:', error);
          throw error;
        }
      },

      unmuteChat: async (chatId: string) => {
        try {
          console.log('🔊 Unmuting chat:', chatId);
          
          const response = await trpcClient.chats.unmuteChat.mutate({ chatId });
          
          if (response.success) {
            // Update local state
            set(state => ({
              chats: state.chats.map(chat => 
                chat.id === chatId 
                  ? { ...chat, isMuted: false, mutedUntil: null }
                  : chat
              )
            }));
            
            // Update chat settings
            get().updateChatSettings(chatId, { muted: false });
            
            console.log('✅ Chat unmuted successfully');
          }
        } catch (error) {
          console.error('❌ Failed to unmute chat:', error);
          throw error;
        }
      },

      updateChatMuteStatus: (chatId: string, isMuted: boolean, mutedUntil?: number | null) => {
        set(state => ({
          chats: state.chats.map(chat => 
            chat.id === chatId 
              ? { ...chat, isMuted, mutedUntil }
              : chat
          )
        }));
        
        // Update chat settings
        get().updateChatSettings(chatId, { muted: isMuted });
      }
    }),
    {
      name: 'chat-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist minimal data, most will come from backend
        unreadCounts: state.unreadCounts,
        chatSettings: state.chatSettings,
        typingUsers: {}, // Don't persist typing state
      }),
    }
  )
);