import { User } from '@/types/user';

export const mockUsers: User[] = [
  {
    id: 'user1',
    name: 'Alex Johnson',
    displayName: 'Alex',
    username: 'alexj',
    email: 'alex@example.com',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Just a regular person trying to make friends.',
    age: 22,
    gender: 'male',
    highSchool: 'Palo Alto High',
    relationshipStatus: 'single',
    interests: ['Music', 'Sports', 'Movies'],
    isVerified: true,
    isOnline: true,
    lastActive: new Date().toISOString(),
    streakCount: 5,
    yipScore: 1200,
    mutualFriends: 3,
    distance: 0.5,
    birthday: 'April 15',
    zodiacSign: 'Aries',
    photos: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80'
    ],
    photosCaptions: [
      'Just hanging out',
      'Beach day'
    ],
    stories: [
      {
        id: 'story1',
        url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 3600000,
        caption: 'Having a great day!'
      }
    ]
  },
  {
    id: 'user2',
    name: 'Taylor Smith',
    displayName: 'Taylor',
    username: 'taylors',
    email: 'taylor@example.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Living life one day at a time. Love hiking and photography.',
    age: 24,
    gender: 'female',
    highSchool: 'Gunn High School',
    relationshipStatus: 'taken',
    interests: ['Photography', 'Hiking', 'Travel'],
    isVerified: true,
    isOnline: false,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    streakCount: 12,
    yipScore: 2500,
    mutualFriends: 5,
    distance: 1.2,
    birthday: 'May 22',
    zodiacSign: 'Gemini',
    photos: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80'
    ],
    photosCaptions: [
      'Coffee time',
      'Hiking trip',
      'Beach sunset'
    ],
    stories: [
      {
        id: 'story2',
        url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 7200000,
        caption: 'Coffee and coding'
      },
      {
        id: 'story3',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 3600000,
        caption: 'Weekend vibes'
      }
    ]
  },
  {
    id: 'user3',
    name: 'Jordan Lee',
    displayName: 'Jordan',
    username: 'jordanl',
    email: 'jordan@example.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Music lover and coffee addict.',
    age: 21,
    gender: 'male',
    highSchool: 'Menlo-Atherton High',
    relationshipStatus: 'complicated',
    interests: ['Music', 'Coffee', 'Art'],
    isVerified: false,
    isOnline: true,
    lastActive: new Date().toISOString(),
    streakCount: 3,
    yipScore: 800,
    mutualFriends: 2,
    distance: 2.5,
    birthday: 'October 10',
    zodiacSign: 'Libra',
    stories: [
      {
        id: 'story4',
        url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 10800000,
        caption: 'Music session'
      }
    ]
  },
  {
    id: 'user4',
    name: 'Casey Brown',
    displayName: 'Casey',
    username: 'caseyb',
    email: 'casey@example.com',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Tech enthusiast and gamer.',
    age: 23,
    gender: 'female',
    highSchool: 'Woodside High',
    relationshipStatus: 'single',
    interests: ['Gaming', 'Technology', 'Anime'],
    isVerified: true,
    isOnline: false,
    lastActive: new Date(Date.now() - 7200000).toISOString(),
    streakCount: 8,
    yipScore: 1500,
    mutualFriends: 4,
    distance: 3.1,
    birthday: 'January 30',
    zodiacSign: 'Aquarius',
    stories: [
      {
        id: 'story5',
        url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 14400000,
        caption: 'Gaming night'
      }
    ]
  },
  {
    id: 'user5',
    name: 'Riley Garcia',
    displayName: 'Riley',
    username: 'rileyg',
    email: 'riley@example.com',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Foodie and fitness enthusiast.',
    age: 25,
    gender: 'female',
    highSchool: 'Los Altos High',
    relationshipStatus: 'taken',
    interests: ['Cooking', 'Fitness', 'Travel'],
    isVerified: true,
    isOnline: true,
    lastActive: new Date().toISOString(),
    streakCount: 15,
    yipScore: 3000,
    mutualFriends: 7,
    distance: 1.8,
    birthday: 'July 12',
    zodiacSign: 'Cancer',
    isVIP: true,
    stories: [
      {
        id: 'story6',
        url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 5400000,
        caption: 'Workout complete!'
      },
      {
        id: 'story7',
        url: 'https://images.unsplash.com/photo-1532980400857-e8d9d275d858?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 3600000,
        caption: 'Meal prep Sunday'
      }
    ]
  },
  {
    id: 'user6',
    name: 'Morgan Wilson',
    displayName: 'Morgan',
    username: 'morganw',
    email: 'morgan@example.com',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Book lover and aspiring writer.',
    age: 22,
    gender: 'male',
    highSchool: 'Mountain View High',
    relationshipStatus: 'single',
    interests: ['Reading', 'Writing', 'Poetry'],
    isVerified: false,
    isOnline: false,
    lastActive: new Date(Date.now() - 14400000).toISOString(),
    streakCount: 2,
    yipScore: 600,
    mutualFriends: 1,
    distance: 4.2,
    birthday: 'March 5',
    zodiacSign: 'Pisces',
    stories: [
      {
        id: 'story8',
        url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 18000000,
        caption: 'Reading my favorite book'
      }
    ]
  },
  {
    id: 'user7',
    name: 'Avery Martinez',
    displayName: 'Avery',
    username: 'averym',
    email: 'avery@example.com',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Music producer and DJ.',
    age: 24,
    gender: 'female',
    highSchool: 'Palo Alto High',
    relationshipStatus: 'complicated',
    interests: ['Music Production', 'DJing', 'Concerts'],
    isVerified: true,
    isOnline: true,
    lastActive: new Date().toISOString(),
    streakCount: 10,
    yipScore: 2200,
    mutualFriends: 6,
    distance: 0.8,
    birthday: 'September 18',
    zodiacSign: 'Virgo',
    stories: [
      {
        id: 'story9',
        url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 7200000,
        caption: 'New track dropping soon'
      },
      {
        id: 'story10',
        url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 3600000,
        caption: 'Studio session'
      }
    ]
  },
  {
    id: 'user8',
    name: 'Quinn Thompson',
    displayName: 'Quinn',
    username: 'quinnt',
    email: 'quinn@example.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Environmental activist and nature lover.',
    age: 23,
    gender: 'male',
    highSchool: 'Gunn High School',
    relationshipStatus: 'single',
    interests: ['Environment', 'Hiking', 'Photography'],
    isVerified: true,
    isOnline: false,
    lastActive: new Date(Date.now() - 10800000).toISOString(),
    streakCount: 7,
    yipScore: 1800,
    mutualFriends: 3,
    distance: 2.0,
    birthday: 'June 8',
    zodiacSign: 'Gemini',
    stories: [
      {
        id: 'story11',
        url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 21600000,
        caption: 'Beach cleanup day'
      }
    ]
  },
  {
    id: 'user9',
    name: 'Jamie Rodriguez',
    displayName: 'Jamie',
    username: 'jamier',
    email: 'jamie@example.com',
    avatar: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Sports enthusiast and coach.',
    age: 25,
    gender: 'female',
    highSchool: 'Menlo-Atherton High',
    relationshipStatus: 'taken',
    interests: ['Sports', 'Coaching', 'Fitness'],
    isVerified: false,
    isOnline: true,
    lastActive: new Date().toISOString(),
    streakCount: 20,
    yipScore: 3500,
    mutualFriends: 8,
    distance: 1.5,
    birthday: 'November 22',
    zodiacSign: 'Sagittarius',
    isVIP: true,
    stories: [
      {
        id: 'story12',
        url: 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 10800000,
        caption: 'Game day!'
      },
      {
        id: 'story13',
        url: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 7200000,
        caption: 'Training session'
      },
      {
        id: 'story14',
        url: 'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 3600000,
        caption: 'Workout complete'
      }
    ]
  },
  {
    id: 'user10',
    name: 'Reese Campbell',
    displayName: 'Reese',
    username: 'reesec',
    email: 'reese@example.com',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
    bio: 'Fashion designer and artist.',
    age: 22,
    gender: 'male',
    highSchool: 'Woodside High',
    relationshipStatus: 'single',
    interests: ['Fashion', 'Art', 'Design'],
    isVerified: true,
    isOnline: false,
    lastActive: new Date(Date.now() - 21600000).toISOString(),
    streakCount: 4,
    yipScore: 1000,
    mutualFriends: 2,
    distance: 3.5,
    birthday: 'February 14',
    zodiacSign: 'Aquarius',
    stories: [
      {
        id: 'story15',
        url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
        timestamp: Date.now() - 25200000,
        caption: 'New design in progress'
      }
    ]
  }
];

// Map user IDs to friend IDs for the mock data
export const mockUserFriendMap = {
  'friend1': 'user2', // Taylor Smith
  'friend2': 'user3', // Jordan Lee
  'friend3': 'user4', // Casey Brown
  'friend4': 'user5', // Riley Garcia
  'friend5': 'user6', // Morgan Wilson
  'friend6': 'user7', // Avery Martinez
  'friend7': 'user8', // Quinn Thompson
  'friend8': 'user9', // Jamie Rodriguez
  'friend9': 'user10', // Reese Campbell
  'friend10': 'user1', // Alex Johnson
  'other_user': 'user1', // Alex Johnson
};

// Function to get a user by ID
export const getUserById = (id: string): User | null => {
  if (!id) return null;
  
  // CRITICAL: Never return admin account
  if (id === 'admin_user' || id === 'admin15') {
    return null;
  }
  
  // Check if this is a friend ID that needs to be mapped to a user ID
  const mappedId = mockUserFriendMap[id] || id;
  
  return mockUsers.find(user => user.id === mappedId) || null;
};

// Export a function to get a random user (excluding admin)
export const getRandomUser = (): User => {
  const filteredUsers = mockUsers.filter(user => 
    user.id !== 'admin_user' && 
    user.username !== 'admin15' && 
    user.email !== 'admin15'
  );
  const randomIndex = Math.floor(Math.random() * filteredUsers.length);
  return filteredUsers[randomIndex];
};