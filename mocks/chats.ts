import type { Chat, Message } from '@/types/chat';

// Taylor Swift chat messages
const mockTaylorMessages: Message[] = [
  { id: 't1', senderId: 'current_user', content: 'Hey Taylor!', timestamp: Date.now() - 1000000, type: 'text', isRead: true, chatId: 'chat_friend1' },
  { id: 't2', senderId: 'friend1', content: 'Hey! How are you?', timestamp: Date.now() - 900000, type: 'text', isRead: true, chatId: 'chat_friend1' },
  { id: 't3', senderId: 'current_user', content: "I'm good! Just listened to your new album", timestamp: Date.now() - 800000, type: 'text', isRead: true, chatId: 'chat_friend1' },
  { id: 't4', senderId: 'friend1', content: 'Thanks! What did you think?', timestamp: Date.now() - 700000, type: 'text', isRead: true, chatId: 'chat_friend1' },
  { id: 't5', senderId: 'current_user', content: "It's amazing! My favorite is track 5", timestamp: Date.now() - 600000, type: 'text', isRead: true, chatId: 'chat_friend1' },
  { id: 't6', senderId: 'friend1', content: "That's my favorite too!", timestamp: Date.now() - 500000, type: 'text', isRead: true, chatId: 'chat_friend1' },
  { id: 't7', senderId: 'current_user', content: 'Are you coming to the party tonight?', timestamp: Date.now() - 400000, type: 'text', isRead: true, chatId: 'chat_friend1' },
  { id: 't8', senderId: 'friend1', content: "Thanks! Are you coming to the party at Sarah's tonight?", timestamp: Date.now() - 3600000, type: 'text', isRead: false, chatId: 'chat_friend1' },
  { 
    id: 'yip_taylor_1', 
    senderId: 'friend1', 
    content: '', 
    timestamp: Date.now() - 3500000, 
    type: 'yip', 
    isRead: false,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'chat_friend1'
  },
];

// Emma Watson chat messages
const mockEmmaMessages: Message[] = [
  { id: 'e1', senderId: 'current_user', content: 'Hey Jordan!', timestamp: Date.now() - 1000000, type: 'text', isRead: true, chatId: 'chat_friend2' },
  { id: 'e2', senderId: 'friend2', content: 'Hi there! How are you?', timestamp: Date.now() - 900000, type: 'text', isRead: true, chatId: 'chat_friend2' },
  { id: 'e3', senderId: 'current_user', content: "I'm great! How's the book club going?", timestamp: Date.now() - 800000, type: 'text', isRead: true, chatId: 'chat_friend2' },
  { id: 'e4', senderId: 'friend2', content: "It's going well! We're reading a new book this month", timestamp: Date.now() - 700000, type: 'text', isRead: true, chatId: 'chat_friend2' },
  { id: 'e5', senderId: 'current_user', content: 'What book is it?', timestamp: Date.now() - 600000, type: 'text', isRead: true, chatId: 'chat_friend2' },
  { id: 'e6', senderId: 'friend2', content: "Have you read the book I recommended? It's life-changing!", timestamp: Date.now() - 7200000, type: 'text', isRead: false, chatId: 'chat_friend2' },
  { 
    id: 'yip_emma_1', 
    senderId: 'current_user', 
    content: '', 
    timestamp: Date.now() - 7100000, 
    type: 'yip', 
    isRead: true,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'chat_friend2'
  },
];

// Alex Johnson chat messages
const mockAlexMessages: Message[] = [
  { id: 'a1', senderId: 'current_user', content: 'Hey Casey!', timestamp: Date.now() - 1000000, type: 'text', isRead: true, chatId: 'chat_friend3' },
  { id: 'a2', senderId: 'friend3', content: "Hey! What's up?", timestamp: Date.now() - 900000, type: 'text', isRead: true, chatId: 'chat_friend3' },
  { id: 'a3', senderId: 'current_user', content: "Not much, just wanted to check if you're playing basketball tomorrow", timestamp: Date.now() - 800000, type: 'text', isRead: true, chatId: 'chat_friend3' },
  { id: 'a4', senderId: 'friend3', content: 'Yeah definitely! 3pm at the usual court', timestamp: Date.now() - 700000, type: 'text', isRead: true, chatId: 'chat_friend3' },
  { id: 'a5', senderId: 'current_user', content: "Perfect! Who else is coming?", timestamp: Date.now() - 600000, type: 'text', isRead: true, chatId: 'chat_friend3' },
  { id: 'a6', senderId: 'friend3', content: "Basketball game tomorrow at 3pm, you in?", timestamp: Date.now() - 10800000, type: 'text', isRead: false, chatId: 'chat_friend3' },
  { 
    id: 'yip_alex_1', 
    senderId: 'friend3', 
    content: '', 
    timestamp: Date.now() - 10700000, 
    type: 'yip', 
    isRead: false,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'chat_friend3'
  },
];

// Sarah Miller chat messages
const mockSarahMessages: Message[] = [
  { id: 's1', senderId: 'current_user', content: 'Hey Riley!', timestamp: Date.now() - 1000000, type: 'text', isRead: true, chatId: 'chat_friend4' },
  { id: 's2', senderId: 'friend4', content: 'Hey! How are you?', timestamp: Date.now() - 900000, type: 'text', isRead: true, chatId: 'chat_friend4' },
  { id: 's3', senderId: 'current_user', content: "I'm good! How are the party preparations going?", timestamp: Date.now() - 800000, type: 'text', isRead: true, chatId: 'chat_friend4' },
  { id: 's4', senderId: 'friend4', content: "Almost done! It's going to be amazing", timestamp: Date.now() - 700000, type: 'text', isRead: true, chatId: 'chat_friend4' },
  { id: 's5', senderId: 'current_user', content: "Can't wait! Need any help?", timestamp: Date.now() - 600000, type: 'text', isRead: true, chatId: 'chat_friend4' },
  { id: 's6', senderId: 'friend4', content: "Party at my place tonight! Starting at 8pm. Bringing anyone?", timestamp: Date.now() - 14400000, type: 'text', isRead: true, chatId: 'chat_friend4' },
  { 
    id: 'yip_sarah_1', 
    senderId: 'current_user', 
    content: '', 
    timestamp: Date.now() - 14300000, 
    type: 'yip', 
    isRead: true,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'chat_friend4'
  },
];

// Mike Chen chat messages
const mockMikeMessages: Message[] = [
  { id: 'm1', senderId: 'current_user', content: 'Hey Morgan!', timestamp: Date.now() - 1000000, type: 'text', isRead: true, chatId: 'chat_friend5' },
  { id: 'm2', senderId: 'friend5', content: "Hey! What's up?", timestamp: Date.now() - 900000, type: 'text', isRead: true, chatId: 'chat_friend5' },
  { id: 'm3', senderId: 'current_user', content: 'Just checking out that coding project you sent', timestamp: Date.now() - 800000, type: 'text', isRead: true, chatId: 'chat_friend5' },
  { id: 'm4', senderId: 'friend5', content: 'What do you think? Want to collaborate?', timestamp: Date.now() - 700000, type: 'text', isRead: true, chatId: 'chat_friend5' },
  { id: 'm5', senderId: 'current_user', content: 'Definitely! The tech stack looks great', timestamp: Date.now() - 600000, type: 'text', isRead: true, chatId: 'chat_friend5' },
  { id: 'm6', senderId: 'friend5', content: "Check out this new coding project I'm working on! https://github.com/mikecoding/awesome-project", timestamp: Date.now() - 18000000, type: 'text', isRead: true, chatId: 'chat_friend5' },
  { 
    id: 'yip_mike_1', 
    senderId: 'friend5', 
    content: '', 
    timestamp: Date.now() - 17900000, 
    type: 'yip', 
    isRead: false,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'chat_friend5'
  },
];

// Austin Toon chat messages
const mockAustinMessages: Message[] = [
  { id: '1', senderId: 'current_user', content: 'Hey Alex', timestamp: Date.now() - 1000000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '2', senderId: 'other_user', content: "Hey what's up?", timestamp: Date.now() - 900000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '3', senderId: 'current_user', content: 'Not much, just working on this app', timestamp: Date.now() - 800000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '4', senderId: 'other_user', content: "Cool! How's it going?", timestamp: Date.now() - 700000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '5', senderId: 'current_user', content: 'Pretty good! Just fixing some UI issues', timestamp: Date.now() - 600000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '6', senderId: 'other_user', content: 'Nice, the design looks great', timestamp: Date.now() - 500000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '7', senderId: 'current_user', content: 'Thanks! Are you coming to the party tonight?', timestamp: Date.now() - 400000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '8', senderId: 'other_user', content: 'Yeah definitely! What time?', timestamp: Date.now() - 300000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '9', senderId: 'current_user', content: "Around 8pm at Sarah's place", timestamp: Date.now() - 200000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '10', senderId: 'other_user', content: "Perfect, I'll be there", timestamp: Date.now() - 100000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '11', senderId: 'current_user', content: 'Awesome! See you then', timestamp: Date.now() - 90000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { id: '12', senderId: 'other_user', content: 'Looking forward to it!', timestamp: Date.now() - 80000, type: 'text', isRead: true, chatId: 'chat_other_user' },
  { 
    id: 'yip_austin_1', 
    senderId: 'other_user', 
    content: '', 
    timestamp: Date.now() - 70000, 
    type: 'yip', 
    isRead: false,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'chat_other_user'
  },
];

// Party chat messages
const mockParty1Messages: Message[] = [
  { id: 'party1_1', senderId: 'system', content: 'Beach Bonfire chat created', timestamp: Date.now() - 86400000, type: 'system', isRead: true, chatId: 'party_party1' },
  { id: 'party1_2', senderId: 'friend1', content: "Who's bringing the drinks?", timestamp: Date.now() - 5400000, type: 'text', isRead: false, chatId: 'party_party1' },
  { id: 'party1_3', senderId: 'friend2', content: "I can bring some beers", timestamp: Date.now() - 5300000, type: 'text', isRead: false, chatId: 'party_party1' },
  { id: 'party1_4', senderId: 'friend3', content: "I'll bring snacks and soda", timestamp: Date.now() - 5200000, type: 'text', isRead: false, chatId: 'party_party1' },
  { 
    id: 'yip_party1_1', 
    senderId: 'friend1', 
    content: '', 
    timestamp: Date.now() - 5100000, 
    type: 'yip', 
    isRead: false,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'party_party1',
    yipCaption: 'Beach location!'
  },
];

const mockParty2Messages: Message[] = [
  { id: 'party2_1', senderId: 'system', content: 'Game Night chat created', timestamp: Date.now() - 172800000, type: 'system', isRead: true, chatId: 'party_party2' },
  { id: 'party2_2', senderId: 'friend5', content: "I'll bring Monopoly and Cards Against Humanity", timestamp: Date.now() - 9000000, type: 'text', isRead: true, chatId: 'party_party2' },
  { id: 'party2_3', senderId: 'friend7', content: "Great! I'll bring pizza", timestamp: Date.now() - 8900000, type: 'text', isRead: true, chatId: 'party_party2' },
  { 
    id: 'yip_party2_1', 
    senderId: 'current_user', 
    content: '', 
    timestamp: Date.now() - 8800000, 
    type: 'yip', 
    isRead: true,
    status: 'delivered',
    yipStatus: 'delivered',
    imageUri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=600&fit=crop',
    yipViewDuration: 10,
    chatId: 'party_party2',
    yipCaption: 'My game collection!'
  },
];

export const mockYipMessages: { [chatId: string]: Message[] } = {
  'chat_friend1': mockTaylorMessages,
  'chat_friend2': mockEmmaMessages,
  'chat_friend3': mockAlexMessages,
  'chat_friend4': mockSarahMessages,
  'chat_friend5': mockMikeMessages,
  'chat_other_user': mockAustinMessages,
  'party_party1': mockParty1Messages,
  'party_party2': mockParty2Messages,
};