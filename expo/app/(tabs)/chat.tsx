import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useChatStore } from '@/store/chatStore';
import { useUserStore } from '@/store/userStore';
import { ChatListItem } from '@/components/ChatListItem';
import { Search, Plus, MessageSquare } from 'lucide-react-native';
import { useThemeColors } from '@/hooks/useThemeColors';
import { LinearGradient } from 'expo-linear-gradient';
import { PartyCard } from '@/components/PartyCard';
import SchoolSection from '@/components/SchoolSection';
import { trpcClient } from '@/lib/trpc';

export default function ChatScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { chats, initializeChats, getTotalUnreadCount } = useChatStore();
  const { currentUser } = useUserStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState(chats || []);
  const [activeTab, setActiveTab] = useState<'chats' | 'parties' | 'schools'>('chats');
  const [isLoading, setIsLoading] = useState(false);
  const [invitedParties, setInvitedParties] = useState<any[]>([]);
  
  useEffect(() => {
    if (currentUser) {
      try {
        initializeChats();
        fetchInvitedParties();
      } catch (error) {
        console.error('Error initializing chats:', error);
      }
    }
  }, [currentUser]);
  
  const fetchInvitedParties = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      console.log('🔄 Fetching invited parties from backend');
      const response = await trpcClient.parties.getInvitedParties.query();
      
      if (response.success && response.parties) {
        console.log(`✅ Loaded ${response.parties.length} invited parties from backend`);
        setInvitedParties(response.parties);
      } else {
        console.log('⚠️ No invited parties found from backend');
        setInvitedParties([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch invited parties:', error);
      setInvitedParties([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    if (!chats) {
      setFilteredChats([]);
      return;
    }
    
    // Sort chats by most recent first
    const sortedChats = [...chats].sort((a, b) => {
      const aTime = a.lastMessageAt || a.updatedAt || a.createdAt || 0;
      const bTime = b.lastMessageAt || b.updatedAt || b.createdAt || 0;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
    
    if (searchQuery.trim() === '') {
      setFilteredChats(sortedChats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = sortedChats.filter(chat => {
        if (!chat) return false;
        
        if (!chat.isGroup) {
          const otherParticipantId = chat.participants?.find(p => p !== 'current_user' && p !== currentUser?.id);
          if (!otherParticipantId) return false;
          
          // This would need to be replaced with real backend call
          return false;
        }
        
        return chat.name?.toLowerCase().includes(query);
      });
      
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats, currentUser]);
  
  const handleChatPress = (chatId: string) => {
    router.push({ pathname: '/chat/[id]' as any, params: { id: chatId } as any });
  };

  const handleChatDoubleTap = (chatId: string) => {
    router.push({ pathname: '/camera-tab' as any, params: { returnTo: 'chat' } as any });
  };
  
  const handleNewChat = () => {
    router.push({ pathname: '/group/create' as any });
  };

  const handleCreateParty = () => {
    router.push({ pathname: '/party/create' as any });
  };

  const handleSchoolSearch = () => {
    router.push({ pathname: '/school/search' as any });
  };

  const handlePartyPress = (partyId: string) => {
    router.push({ pathname: '/party/[id]' as any, params: { id: partyId } as any });
  };

  const handleAcceptPartyInvite = async (partyId: string) => {
    try {
      setIsLoading(true);
      const response = await trpcClient.parties.rsvpToParty.mutate({
        partyId,
        status: 'attending'
      });
      
      if (response.success) {
        // Refresh invited parties
        await fetchInvitedParties();
      }
    } catch (error) {
      console.error('Error accepting party invite:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclinePartyInvite = async (partyId: string) => {
    try {
      setIsLoading(true);
      const response = await trpcClient.parties.rsvpToParty.mutate({
        partyId,
        status: 'not_attending'
      });
      
      if (response.success) {
        // Refresh invited parties
        await fetchInvitedParties();
      }
    } catch (error) {
      console.error('Error declining party invite:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MessageSquare size={64} color="rgba(255, 255, 255, 0.5)" />
      <Text style={styles.emptyTitle}>No Chats Yet</Text>
      <Text style={styles.emptyText}>
        Start a conversation with your friends or join a group chat.
      </Text>
      <TouchableOpacity style={styles.newChatButton} onPress={handleNewChat}>
        <Text style={styles.newChatButtonText}>New Group Chat</Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'parties':
        return (
          <ScrollView style={styles.tabContent}>
            <View style={styles.partiesHeader}>
              <Text style={[styles.partiesTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Your Parties</Text>
              <TouchableOpacity style={styles.createButton} onPress={handleCreateParty}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.createButtonText}>Create Party</Text>
              </TouchableOpacity>
            </View>
            
            {invitedParties && invitedParties.length > 0 ? (
              <View style={styles.partiesList}>
                {invitedParties.map((party) => (
                  <View key={party.id} style={styles.partyItemContainer}>
                    <PartyCard 
                      party={party} 
                      onPress={() => handlePartyPress(party.id)} 
                    />
                    {party.userStatus === 'invited' && (
                      <View style={styles.partyActions}>
                        <TouchableOpacity 
                          style={[styles.partyActionButton, styles.acceptButton]}
                          onPress={() => handleAcceptPartyInvite(party.id)}
                          disabled={isLoading}
                        >
                          <Text style={styles.partyActionText}>Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                          style={[styles.partyActionButton, styles.declineButton]}
                          onPress={() => handleDeclinePartyInvite(party.id)}
                          disabled={isLoading}
                        >
                          <Text style={styles.partyActionText}>Decline</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyParties}>
                <Text style={[styles.emptyPartiesText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                  You haven't been invited to any parties yet.
                </Text>
                <TouchableOpacity style={styles.createPartyButton} onPress={handleCreateParty}>
                  <Text style={styles.createPartyButtonText}>Create a Party</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        );
      
      case 'schools':
        return (
          <ScrollView style={styles.tabContent}>
            <View style={styles.schoolsHeader}>
              <Text style={[styles.schoolsTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>Schools</Text>
              <TouchableOpacity style={styles.searchSchoolButton} onPress={handleSchoolSearch}>
                <Search size={20} color="#FFFFFF" />
                <Text style={styles.searchSchoolButtonText}>Find School</Text>
              </TouchableOpacity>
            </View>
            
            <SchoolSection />
          </ScrollView>
        );
      
      default: // 'chats'
        return (
          <FlatList
            data={filteredChats}
            renderItem={({ item }) => (
              item ? (
                <ChatListItem
                  chat={item}
                  onPress={() => handleChatPress(item.id)}
                  onDoubleTap={() => handleChatDoubleTap(item.id)}
                />
              ) : null
            )}
            keyExtractor={(item) => item?.id || Math.random().toString()}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmptyComponent}
          />
        );
    }
  };

  // Show login prompt if not authenticated
  if (!currentUser) {
    return (
      <LinearGradient
        colors={isDark ? ['#0A1929', '#0F2942', '#1A3A5F'] : ['#F5F7FA', '#E4EBF5']}
        style={styles.container}
      >
        <View style={styles.loginPrompt}>
          <Text style={[styles.loginPromptText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            Please log in to view your chats
          </Text>
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push({ pathname: '/auth/login' as any })}
          >
            <Text style={styles.loginButtonText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }
  
  return (
    <LinearGradient
      colors={isDark ? ['#0A1929', '#0F2942', '#1A3A5F'] : ['#F5F7FA', '#E4EBF5']}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>Chats</Text>
        <TouchableOpacity style={styles.newButton} onPress={handleNewChat}>
          <Plus size={24} color={isDark ? '#FFFFFF' : '#000000'} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabsContainer}>
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'chats' && styles.activeTab
          ]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'chats' && styles.activeTabText,
            { color: activeTab === 'chats' ? colors.primary : (isDark ? '#BBBBBB' : '#666666') }
          ]}>
            Chats
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'parties' && styles.activeTab
          ]}
          onPress={() => setActiveTab('parties')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'parties' && styles.activeTabText,
            { color: activeTab === 'parties' ? colors.primary : (isDark ? '#BBBBBB' : '#666666') }
          ]}>
            Parties
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.tab, 
            activeTab === 'schools' && styles.activeTab
          ]}
          onPress={() => setActiveTab('schools')}
        >
          <Text style={[
            styles.tabText, 
            activeTab === 'schools' && styles.activeTabText,
            { color: activeTab === 'schools' ? colors.primary : (isDark ? '#BBBBBB' : '#666666') }
          ]}>
            Schools
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'chats' && (
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
            { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' }
          ]}>
            <Search size={20} color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)'} />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDark ? '#FFFFFF' : '#000000' }
              ]}
              placeholder="Search chats..."
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      )}
      
      <View style={styles.contentContainer}>
        {renderTabContent()}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  newButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 102, 204, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    zIndex: 10,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    zIndex: 5,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  newChatButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  newChatButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  partiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  partiesTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  partiesList: {
    marginBottom: 24,
  },
  partyItemContainer: {
    marginBottom: 16,
  },
  partyActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  partyActionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  partyActionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyParties: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPartiesText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  createPartyButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  createPartyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  schoolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  schoolsTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  searchSchoolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0066CC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchSchoolButtonText: {
    color: '#FFFFFF',
    marginLeft: 8,
    fontWeight: '600',
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loginPromptText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#0066CC',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});