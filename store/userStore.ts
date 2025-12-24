import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Report } from '@/types/user';
import { trpcClient } from '@/lib/trpc';
import { mockUsers } from '@/mocks/users';

interface UserState {
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  authToken: string | null;
  friends: string[];
  outgoingRequests: string[];
  incomingRequests: any[];
  nearbyUsers: User[];
  quickAddUsers: User[];
  isGhostModeEnabled: boolean;
  settings: any;
  parties: any[];
  userLocation: { latitude: number; longitude: number } | null;
  currentSchoolId?: string;
  blockedUsers: string[];
  maxDistance: number;
  
  // Admin features - CRITICAL: Default to false for security
  isAdmin: boolean;
  reports: Report[];
  bannedUsers: string[];
  
  // Actions
  clearError: () => void;
  setInitialized: (initialized: boolean) => void;
  fetchNearbyUsers: (location: any, maxDistance: number) => Promise<void>;
  refreshQuickAdd: () => Promise<void>;
  toggleGhostMode: () => void;
  getFriendUsers: () => User[];
  setUserLocation: (location: any) => void;
  isFriend: (userId: string) => boolean;
  isPendingRequest: (userId: string) => boolean;
  isBlocked: (userId: string) => boolean;
  sendFriendRequest: (userId: string) => Promise<void>;
  unsendFriendRequest: (userId: string) => Promise<void>;
  removeFriend: (userId: string) => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  incrementYipScore: () => void;
  updateProfile: (profileData: Partial<User>) => Promise<void>;
  forceUpdate: () => void;
  setUser: (user: User) => Promise<void>;
  setToken: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  joinParty: (partyId: string) => Promise<void>;
  leaveParty: (partyId: string) => Promise<void>;
  getParty: (partyId: string) => any;
  createParty: (partyData: any) => Promise<any>;
  createGroup: (groupData: any) => Promise<any>;
  getInvitedParties: () => any[];
  getUserCreatedParties: () => any[];
  inviteToParty: (partyId: string, userId: string) => Promise<void>;
  setMaxDistance: (distance: number) => void;
  updateSettings: (newSettings: any) => void;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
  joinSchool: (schoolId: string, schoolName: string) => Promise<void>;
  leaveSchool: () => Promise<void>;
  initializeApp: () => Promise<void>;
  
  // Admin actions
  reportUser: (userId: string, reason: string, note?: string) => Promise<void>;
  banUser: (userId: string, reason: string) => Promise<void>;
  unbanUser: (userId: string) => Promise<void>;
  getReports: () => Report[];
  markReportAsReviewed: (reportId: string, action: 'none' | 'warning' | 'ban' | 'suspend') => Promise<void>;
  isUserBanned: (userId: string) => boolean;
  
  // Helper functions
  getFilteredUsers: () => User[];
}

// Helper function to create a complete User object from partial data
const createCompleteUser = (userData: any): User => {
  return {
    id: userData.id || '',
    username: userData.username || '',
    displayName: userData.displayName || userData.username || '',
    name: userData.name || userData.displayName || userData.username || '',
    email: userData.email || '',
    bio: userData.bio || '',
    avatar: userData.avatar || '',
    friendCount: userData.friendCount || 0,
    yipScore: userData.yipScore || 0,
    verified: userData.verified || false,
    isOnline: userData.isOnline || true,
    lastActive: userData.lastActive || new Date().toISOString(),
    streakCount: userData.streakCount || 0,
    friends: userData.friends || [],
    age: userData.age || 18,
    dateOfBirth: userData.dateOfBirth || '',
    birthday: userData.birthday || userData.dateOfBirth || '',
    highSchool: userData.highSchool || '',
    interests: userData.interests || [],
    relationshipStatus: userData.relationshipStatus || 'single',
    zodiacSign: userData.zodiacSign || '',
    pronouns: userData.pronouns || '',
    createdAt: userData.createdAt || new Date().toISOString(),
    isAdmin: userData.isAdmin || false,
    distance: userData.distance !== undefined ? Math.round(userData.distance * 100) / 100 : undefined,
    gender: userData.gender || undefined,
    isVIP: userData.isVIP || false,
    mutualFriends: userData.mutualFriends || 0,
  };
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      isLoading: false,
      error: null,
      isInitialized: false,
      authToken: null,
      friends: [],
      outgoingRequests: [],
      incomingRequests: [],
      nearbyUsers: [],
      quickAddUsers: [],
      isGhostModeEnabled: false,
      maxDistance: 5,
      settings: {
        distanceSettings: {
          maxDistance: 5,
          useMetric: false,
        },
        notifications: {
          pushEnabled: true,
          soundEnabled: true,
          vibrationEnabled: true,
          messageNotifications: true,
          friendRequestNotifications: true,
          partyInviteNotifications: true,
        },
        privacy: {
          showOnlineStatus: true,
          allowFriendRequests: true,
          showLocation: true,
          profileVisibility: 'friends',
        },
        appearance: {
          theme: 'system',
          fontSize: 'medium',
        }
      },
      parties: [],
      userLocation: null,
      blockedUsers: [],
      
      // CRITICAL SECURITY: Admin state ALWAYS defaults to false
      isAdmin: false,
      reports: [],
      bannedUsers: [],
      
      initializeApp: async () => {
        try {
          set({ isLoading: true, error: null });

          console.log('🔄 Initializing app - checking for stored auth');

          // Try to get stored auth token for persistence
          try {
            const storedToken = await AsyncStorage.getItem('authToken');
            const storedUser = await AsyncStorage.getItem('currentUser');

            if (storedToken && storedUser) {
              console.log('📱 Found stored auth, restoring session');
              const user = JSON.parse(storedUser);

              // Set token globally for TRPC
              (global as any).authToken = storedToken;

              // Restore user session without backend verification
              // (since we're using Rork servers that don't have our user endpoints)
              set({
                currentUser: createCompleteUser(user),
                authToken: storedToken,
                isInitialized: true,
                isLoading: false,
                isAdmin: user.username === 'admin15' && user.isAdmin === true,
              });

              console.log('✅ Session restored from storage');
              return;
            }
          } catch {
            console.log('🔄 No stored auth found or error reading storage');
          }

          // No stored auth -> pre-log into a local test account and seed mock users.
          const testUser = mockUsers[0];
          const mockToken = 'dev-mock-token';

          console.log('🧪 No stored auth. Using local test account:', {
            id: testUser?.id,
            username: testUser?.username,
          });

          const completeTestUser = createCompleteUser({
            ...testUser,
            verified: testUser?.isVerified ?? false,
            yipScore: testUser?.yipScore ?? 0,
          });

          // Store auth so refreshes stay logged in
          try {
            await AsyncStorage.setItem('authToken', mockToken);
            await AsyncStorage.setItem('currentUser', JSON.stringify(completeTestUser));
          } catch (error) {
            console.error('Failed to persist mock auth:', error);
          }

          (global as any).authToken = mockToken;

          const seededNearbyUsers = mockUsers.slice(1, 16).map((u) =>
            createCompleteUser({
              ...u,
              verified: u?.isVerified ?? false,
              yipScore: u?.yipScore ?? 0,
            })
          );

          const seededQuickAddUsers = mockUsers.slice(16, 26).map((u) =>
            createCompleteUser({
              ...u,
              verified: u?.isVerified ?? false,
              yipScore: u?.yipScore ?? 0,
            })
          );

          set({
            isInitialized: true,
            isLoading: false,
            currentUser: completeTestUser,
            authToken: mockToken,
            nearbyUsers: seededNearbyUsers,
            quickAddUsers: seededQuickAddUsers,
            parties: [],
            friends: [],
            outgoingRequests: [],
            incomingRequests: [],
            userLocation: null,
            isAdmin: false,
          });

          console.log('✅ App initialized - mock session ready');
        } catch (error) {
          console.error('App initialization error:', error);
          set({
            isInitialized: true,
            isLoading: false,
            error: 'Failed to initialize app',
          });
        }
      },
      
      setInitialized: (initialized: boolean) => {
        set({ isInitialized: initialized });
      },
      
      setUser: async (user: User) => {
        // CRITICAL SECURITY: ULTRA STRICT admin verification - only username "admin15"
        const isExactAdminUser = (
          user.username === 'admin15' && 
          user.isAdmin === true
        );
        
        console.log('Setting user in store - ULTRA STRICT verification:', {
          username: user.username,
          userIsAdmin: user.isAdmin,
          calculatedIsAdmin: isExactAdminUser,
          finalAdminStatus: isExactAdminUser ? 'ADMIN GRANTED' : 'ADMIN DENIED'
        });
        
        const completeUser = createCompleteUser(user);
        
        // Store user in AsyncStorage for persistence
        try {
          await AsyncStorage.setItem('currentUser', JSON.stringify(completeUser));
        } catch (error) {
          console.error('Failed to store user in AsyncStorage:', error);
        }
        
        set({ 
          currentUser: completeUser,
          isAdmin: isExactAdminUser,
          isInitialized: true
        });
      },
      
      setToken: async (token: string) => {
        // Store token in AsyncStorage for persistence
        try {
          await AsyncStorage.setItem('authToken', token);
        } catch (error) {
          console.error('Failed to store token in AsyncStorage:', error);
        }
        
        set({ authToken: token });
        (global as any).authToken = token;
      },
      
      logout: async () => {
        console.log('Logging out - clearing all state');
        
        // Clear stored auth from AsyncStorage
        try {
          await AsyncStorage.removeItem('authToken');
          await AsyncStorage.removeItem('currentUser');
        } catch (error) {
          console.error('Failed to clear auth from AsyncStorage:', error);
        }
        
        set({ 
          currentUser: null,
          authToken: null,
          friends: [],
          outgoingRequests: [],
          incomingRequests: [],
          nearbyUsers: [],
          quickAddUsers: [],
          isAdmin: false,
          reports: [],
          parties: [],
          isInitialized: true
        });
        
        (global as any).authToken = undefined;
      },
      
      setMaxDistance: (distance: number) => {
        set({ maxDistance: distance });
      },

      updateSettings: (newSettings: any) => {
        set(state => ({
          settings: {
            ...state.settings,
            ...newSettings
          }
        }));
      },

      calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 3959;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        // Round to 2 decimal places maximum
        return Math.round(distance * 100) / 100;
      },
      
      clearError: () => {
        set({ error: null });
      },
      
      fetchNearbyUsers: async (location, maxDistance) => {
        try {
          set({ isLoading: true });

          console.log('📍 fetchNearbyUsers called:', {
            location,
            maxDistance,
          });

          const response = await trpcClient.users.getNearbyUsers.query({
            latitude: location.latitude,
            longitude: location.longitude,
            maxDistance,
          });

          if (response.success) {
            const users =
              response.users?.map((user: any) =>
                createCompleteUser({
                  ...user,
                  email: user.email || '',
                  relationshipStatus: user.relationshipStatus || 'single',
                  interests: user.interests || [],
                  zodiacSign: user.zodiacSign || '',
                  pronouns: user.pronouns || '',
                  createdAt: user.createdAt || new Date().toISOString(),
                  age: user.age || 18,
                })
              ) || [];
            set({
              nearbyUsers: users,
              isLoading: false,
            });
            return;
          }

          throw new Error('Failed to fetch nearby users');
        } catch (error) {
          console.error('Error fetching nearby users (falling back to mocks):', error);

          const fallbackUsers = mockUsers.slice(1, 16).map((u) =>
            createCompleteUser({
              ...u,
              verified: u?.isVerified ?? false,
              yipScore: u?.yipScore ?? 0,
            })
          );

          set({
            nearbyUsers: fallbackUsers,
            isLoading: false,
          });
        }
      },
      
      refreshQuickAdd: async () => {
        try {
          set({ isLoading: true });

          console.log('✨ refreshQuickAdd called');

          const response = await trpcClient.users.getQuickAdd.query({
            limit: 20,
          });

          if (response.success) {
            const users =
              response.users?.map((user: any) =>
                createCompleteUser({
                  ...user,
                  email: user.email || '',
                  relationshipStatus: user.relationshipStatus || 'single',
                  interests: user.interests || [],
                  zodiacSign: user.zodiacSign || '',
                  pronouns: user.pronouns || '',
                  createdAt: user.createdAt || new Date().toISOString(),
                  age: user.age || 18,
                })
              ) || [];
            set({
              quickAddUsers: users,
              isLoading: false,
            });
            return;
          }

          throw new Error('Failed to fetch quick add users');
        } catch (error) {
          console.error('Error refreshing quick add (falling back to mocks):', error);

          const fallbackUsers = mockUsers.slice(16, 26).map((u) =>
            createCompleteUser({
              ...u,
              verified: u?.isVerified ?? false,
              yipScore: u?.yipScore ?? 0,
            })
          );

          set({
            quickAddUsers: fallbackUsers,
            isLoading: false,
          });
        }
      },

      toggleGhostMode: () => {
        set(state => ({ isGhostModeEnabled: !state.isGhostModeEnabled }));
      },
      
      getFriendUsers: () => {
        // Return empty array if no friends - backend should provide friend data
        return [];
      },
      
      setUserLocation: (location) => {
        set({ userLocation: location });
      },
      
      isFriend: (userId: string) => {
        const { friends } = get();
        return Array.isArray(friends) && friends.includes(userId);
      },

      isPendingRequest: (userId: string) => {
        const { outgoingRequests } = get();
        return Array.isArray(outgoingRequests) && outgoingRequests.includes(userId);
      },
      
      isBlocked: (userId: string) => {
        const { blockedUsers } = get();
        return Array.isArray(blockedUsers) && blockedUsers.includes(userId);
      },

      sendFriendRequest: async (toUserId: string) => {
        try {
          const response = await trpcClient.users.sendFriendRequest.mutate({ toUserId });
          
          if (response.success) {
            set(state => ({
              outgoingRequests: [...(state.outgoingRequests || []), toUserId]
            }));
          } else {
            throw new Error('Failed to send friend request');
          }
        } catch (error) {
          console.error('Error sending friend request:', error);
          throw error;
        }
      },

      unsendFriendRequest: async (toUserId: string) => {
        try {
          const response = await trpcClient.users.unsendFriendRequest.mutate({ toUserId });
          
          if (response && response.success) {
            set(state => ({
              outgoingRequests: (state.outgoingRequests || []).filter(id => id !== toUserId)
            }));
          } else {
            throw new Error('Failed to unsend friend request');
          }
        } catch (error) {
          console.error('Error unsending friend request:', error);
          throw error;
        }
      },
      
      removeFriend: async (friendId: string) => {
        try {
          const response = await trpcClient.users.removeFriend.mutate({ friendId });
          
          if (response.success) {
            set(state => ({
              friends: (state.friends || []).filter(id => id !== friendId)
            }));
          } else {
            throw new Error('Failed to remove friend');
          }
        } catch (error) {
          console.error('Error removing friend:', error);
          throw error;
        }
      },
      
      blockUser: async (userId: string) => {
        try {
          const response = await trpcClient.users.blockUser.mutate({ userId });
          
          if (response.success) {
            set(state => ({
              blockedUsers: [...(state.blockedUsers || []), userId],
              friends: (state.friends || []).filter(id => id !== userId),
              outgoingRequests: (state.outgoingRequests || []).filter(id => id !== userId)
            }));
          } else {
            throw new Error('Failed to block user');
          }
        } catch (error) {
          console.error('Error blocking user:', error);
          throw error;
        }
      },
      
      unblockUser: async (userId: string) => {
        try {
          const response = await trpcClient.users.unblockUser.mutate({ userId });
          
          if (response.success) {
            set(state => ({
              blockedUsers: (state.blockedUsers || []).filter(id => id !== userId)
            }));
          } else {
            throw new Error('Failed to unblock user');
          }
        } catch (error) {
          console.error('Error unblocking user:', error);
          throw error;
        }
      },
      
      incrementYipScore: () => {
        set(state => {
          if (!state.currentUser) return state;
          
          const updatedUser = {
            ...state.currentUser,
            yipScore: (state.currentUser.yipScore || 0) + 1
          };
          
          return {
            currentUser: updatedUser
          };
        });
      },
      
      updateProfile: async (profileData: Partial<User>) => {
        try {
          set({ isLoading: true });
          
          const response = await trpcClient.users.updateProfile.mutate(profileData);
          
          if (response.success) {
            set(state => {
              if (!state.currentUser) return state;
              
              const updatedUser = {
                ...state.currentUser,
                ...profileData
              };
              
              return {
                currentUser: updatedUser,
                isLoading: false
              };
            });
          } else {
            throw new Error('Failed to update profile');
          }
        } catch (error) {
          console.error('Error updating profile:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      forceUpdate: () => {
        set(state => ({ ...state }));
      },

      joinParty: async (partyId: string) => {
        try {
          set({ isLoading: true });
          
          const response = await trpcClient.parties.rsvpToParty.mutate({ partyId, status: 'attending' });
          
          if (response.success) {
            // Refresh parties list
            const partiesResponse = await trpcClient.parties.getParties.query({
              limit: 50
            });
            if (partiesResponse.success) {
              set({ 
                parties: partiesResponse.parties || [],
                isLoading: false 
              });
            }
          } else {
            throw new Error('Failed to join party');
          }
        } catch (error) {
          console.error('Error joining party:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      leaveParty: async (partyId: string) => {
        try {
          set({ isLoading: true });
          
          const response = await trpcClient.parties.rsvpToParty.mutate({ partyId, status: 'not_attending' });
          
          if (response.success) {
            // Refresh parties list
            const partiesResponse = await trpcClient.parties.getParties.query({
              limit: 50
            });
            if (partiesResponse.success) {
              set({ 
                parties: partiesResponse.parties || [],
                isLoading: false 
              });
            }
          } else {
            throw new Error('Failed to leave party');
          }
        } catch (error) {
          console.error('Error leaving party:', error);
          set({ isLoading: false });
          throw error;
        }
      },
      
      getParty: (partyId: string) => {
        return get().parties.find((p: any) => p.id === partyId);
      },

      createParty: async (partyData: any) => {
        try {
          set({ isLoading: true });
          
          const response = await trpcClient.parties.createParty.mutate(partyData);
          
          if (response.success) {
            // Refresh parties list
            const partiesResponse = await trpcClient.parties.getParties.query({
              limit: 50
            });
            if (partiesResponse.success) {
              set({ 
                parties: partiesResponse.parties || [],
                isLoading: false 
              });
            }
            
            return { id: response.partyId };
          } else {
            throw new Error('Failed to create party');
          }
        } catch (error) {
          console.error('Error creating party:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      createGroup: async (groupData: any) => {
        try {
          set({ isLoading: true });
          
          const response = await trpcClient.chats.createChat.mutate(groupData);
          
          if (response.success) {
            set({ isLoading: false });
            return { id: response.chatId, isNew: response.isNew };
          } else {
            throw new Error('Failed to create group');
          }
        } catch (error) {
          console.error('Error creating group:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      getInvitedParties: () => {
        const allParties = get().parties;
        return allParties.filter((party: any) => 
          (party.invitedUsers && party.invitedUsers.includes('current_user')) || 
          (party.participants && party.participants.includes('current_user'))
        );
      },

      getUserCreatedParties: () => {
        const allParties = get().parties;
        return allParties.filter((party: any) => 
          party.createdBy === 'current_user' || party.hostId === 'current_user'
        );
      },

      inviteToParty: async (partyId: string, userId: string) => {
        try {
          set({ isLoading: true });
          
          const response = await trpcClient.parties.inviteToParty.mutate({ partyId, userId });
          
          if (response.success) {
            // Refresh parties list
            const partiesResponse = await trpcClient.parties.getParties.query({
              limit: 50
            });
            if (partiesResponse.success) {
              set({ 
                parties: partiesResponse.parties || [],
                isLoading: false 
              });
            }
          } else {
            throw new Error('Failed to invite user');
          }
        } catch (error) {
          console.error('Error inviting user to party:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      joinSchool: async (schoolId: string, schoolName: string) => {
        try {
          set({ isLoading: true });
          
          const response = await trpcClient.schools.joinSchool.mutate({ schoolId });
          
          if (response.success) {
            set(state => {
              if (!state.currentUser) return state;
              
              const updatedUser = {
                ...state.currentUser,
                school: `${schoolName} - ${schoolId}`,
                highSchool: schoolName
              };
              
              return {
                currentUser: updatedUser,
                currentSchoolId: schoolId,
                isLoading: false
              };
            });
          } else {
            throw new Error('Failed to join school');
          }
        } catch (error) {
          console.error('Error joining school:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      leaveSchool: async () => {
        try {
          set({ isLoading: true });
          
          const { currentSchoolId } = get();
          
          // If no current school, just return success
          if (!currentSchoolId) {
            set({ isLoading: false });
            return;
          }
          
          // Fixed: Pass the required schoolId parameter
          const response = await trpcClient.schools.leaveSchool.mutate({ schoolId: currentSchoolId });
          
          if (response.success) {
            set(state => {
              if (!state.currentUser) return state;
              
              const updatedUser = {
                ...state.currentUser,
                school: undefined,
                highSchool: ""
              };
              
              return {
                currentUser: updatedUser,
                currentSchoolId: undefined,
                isLoading: false
              };
            });
          } else {
            throw new Error('Failed to leave school');
          }
        } catch (error) {
          console.error('Error leaving school:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      // Admin actions
      reportUser: async (userId: string, reason: string, note?: string) => {
        try {
          const response = await trpcClient.users.reportUser.mutate({ userId, reason, note });
          
          if (response.success) {
            console.log('User reported successfully');
          } else {
            throw new Error('Failed to report user');
          }
        } catch (error) {
          console.error('Error reporting user:', error);
          throw error;
        }
      },

      banUser: async (userId: string, reason: string) => {
        try {
          const currentUser = get().currentUser;
          const isAdmin = get().isAdmin;
          
          if (!currentUser?.isAdmin || !isAdmin || currentUser.username !== 'admin15') {
            throw new Error('Only admin15 can ban users');
          }

          const response = await trpcClient.users.banUser.mutate({ userId, reason });
          
          if (response.success) {
            set(state => ({
              bannedUsers: [...(state.bannedUsers || []), userId]
            }));
          } else {
            throw new Error('Failed to ban user');
          }
        } catch (error) {
          console.error('Error banning user:', error);
          throw error;
        }
      },

      unbanUser: async (userId: string) => {
        try {
          const currentUser = get().currentUser;
          const isAdmin = get().isAdmin;
          
          if (!currentUser?.isAdmin || !isAdmin || currentUser.username !== 'admin15') {
            throw new Error('Only admin15 can unban users');
          }

          const response = await trpcClient.users.unbanUser.mutate({ userId });
          
          if (response.success) {
            set(state => ({
              bannedUsers: (state.bannedUsers || []).filter(id => id !== userId)
            }));
          } else {
            throw new Error('Failed to unban user');
          }
        } catch (error) {
          console.error('Error unbanning user:', error);
          throw error;
        }
      },

      getReports: () => {
        const currentUser = get().currentUser;
        const isAdmin = get().isAdmin;
        
        if (!currentUser?.isAdmin || !isAdmin || currentUser.username !== 'admin15') {
          return [];
        }
        return get().reports;
      },

      markReportAsReviewed: async (reportId: string, action: 'none' | 'warning' | 'ban' | 'suspend') => {
        try {
          const currentUser = get().currentUser;
          const isAdmin = get().isAdmin;
          
          if (!currentUser?.isAdmin || !isAdmin || currentUser.username !== 'admin15') {
            throw new Error('Only admin15 can review reports');
          }

          const response = await trpcClient.users.markReportAsReviewed.mutate({ reportId, action });
          
          if (response.success) {
            // Refresh reports
            const reportsResponse = await trpcClient.users.getReports.query();
            if (reportsResponse.success) {
              // Fixed: Properly map the response to match the Report interface
              const mappedReports: Report[] = reportsResponse.reports?.map((report: any) => ({
                id: report.id,
                reporterId: report.reporter?.id || '',
                reportedUserId: report.reportedUser?.id || '',
                reason: report.reason,
                note: report.note,
                timestamp: report.createdAt ? new Date(report.createdAt).getTime() : Date.now(),
                status: report.status,
                reviewedBy: report.reviewedBy,
                reviewedAt: report.reviewedAt,
                action: report.action
              })) || [];
              
              set({ reports: mappedReports });
            }
          } else {
            throw new Error('Failed to review report');
          }
        } catch (error) {
          console.error('Error reviewing report:', error);
          throw error;
        }
      },

      isUserBanned: (userId: string) => {
        const bannedUsers = get().bannedUsers || [];
        return bannedUsers.includes(userId);
      },

      getFilteredUsers: () => {
        // Return empty array - should use backend calls
        return [];
      }
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Don't persist currentUser or authToken here - they're handled separately
        friends: state.friends || [],
        outgoingRequests: state.outgoingRequests || [],
        incomingRequests: state.incomingRequests || [],
        isGhostModeEnabled: state.isGhostModeEnabled,
        settings: state.settings,
        blockedUsers: state.blockedUsers || [],
        maxDistance: state.maxDistance || 5,
        bannedUsers: state.bannedUsers || [],
      }),
    }
  )
);