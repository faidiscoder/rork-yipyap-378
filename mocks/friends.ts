import { User } from '@/types/user';
import { getZodiacSign } from '@/utils/zodiac';

// Generate random birthdays for users
function getRandomBirthday(): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June', 
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = months[Math.floor(Math.random() * months.length)];
  const day = Math.floor(Math.random() * 28) + 1; // 1-28 to avoid month edge cases
  return `${month} ${day}`;
}

// Generate random yip scores between 1000 and 5000
function getRandomYipScore(): number {
  return Math.floor(Math.random() * 4000) + 1000;
}

export const mockFriends: User[] = [
  {
    id: "friend1",
    username: "alex",
    displayName: "Alex Chen",
    name: "Alex Chen",
    email: "alex@example.com",
    bio: "Computer Science student at Stanford. Love hiking and photography.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4275,
      longitude: -122.1697
    },
    createdAt: new Date(Date.now() - 86400000 * 60).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    friendCount: 25,
    yipScore: getRandomYipScore(),
    age: 20,
    highSchool: "Palo Alto High",
    interests: ["Coding", "Hiking", "Photography", "Gaming"],
    relationshipStatus: "Single",
    snapScore: getRandomYipScore(),
    verified: true,
    friendStatus: "friends",
    isGhost: false,
    birthday: "June 15",
    zodiacSign: "Gemini",
    streakCount: 15,
    mutualFriends: 5,
    distance: 0.5
  },
  {
    id: "friend2",
    username: "taylor",
    displayName: "Taylor Swift",
    name: "Taylor Swift",
    email: "taylor@example.com",
    bio: "Music lover and aspiring songwriter. Always looking for inspiration.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4298,
      longitude: -122.1639
    },
    createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: false,
    lastActive: new Date(Date.now() - 3600000).toISOString(),
    friendCount: 30,
    yipScore: getRandomYipScore(),
    age: 19,
    highSchool: "Gunn High School",
    interests: ["Music", "Songwriting", "Guitar", "Poetry"],
    relationshipStatus: "Single",
    snapScore: getRandomYipScore(),
    verified: true,
    friendStatus: "friends",
    isGhost: false,
    birthday: "December 13",
    zodiacSign: "Sagittarius",
    streakCount: 22,
    mutualFriends: 3,
    distance: 0.8
  },
  {
    id: "friend3",
    username: "mike",
    displayName: "Mike Johnson",
    name: "Mike Johnson",
    email: "mike@example.com",
    bio: "Basketball player and sports enthusiast. Always up for a game!",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4419,
      longitude: -122.1430
    },
    createdAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    friendCount: 18,
    yipScore: getRandomYipScore(),
    age: 21,
    highSchool: "Menlo-Atherton High",
    interests: ["Basketball", "Football", "Fitness", "Gaming"],
    relationshipStatus: "In a relationship",
    snapScore: getRandomYipScore(),
    verified: false,
    friendStatus: "friends",
    isGhost: false,
    birthday: "October 5",
    zodiacSign: "Libra",
    streakCount: 8,
    mutualFriends: 7,
    distance: 2.5
  },
  {
    id: "friend4",
    username: "sarah",
    displayName: "Sarah Williams",
    name: "Sarah Williams",
    email: "sarah@example.com",
    bio: "Art student and painter. Love exploring new cafes and art galleries.",
    avatar: "https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4092,
      longitude: -122.0609
    },
    createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: false,
    lastActive: new Date(Date.now() - 7200000).toISOString(),
    friendCount: 22,
    yipScore: getRandomYipScore(),
    age: 20,
    highSchool: "Mountain View High",
    interests: ["Art", "Painting", "Coffee", "Museums"],
    relationshipStatus: "Single",
    snapScore: getRandomYipScore(),
    verified: true,
    friendStatus: "friends",
    isGhost: false,
    birthday: "April 15",
    zodiacSign: "Aries",
    streakCount: 12,
    mutualFriends: 2,
    distance: 4.1
  },
  {
    id: "friend5",
    username: "david",
    displayName: "David Kim",
    name: "David Kim",
    email: "david@example.com",
    bio: "Music producer and DJ. Always looking for new sounds and inspiration.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.3882,
      longitude: -122.0833
    },
    createdAt: new Date(Date.now() - 86400000 * 25).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    friendCount: 35,
    yipScore: getRandomYipScore(),
    age: 22,
    highSchool: "Los Altos High",
    interests: ["Music", "DJing", "Concerts", "Production"],
    relationshipStatus: "It's complicated",
    snapScore: getRandomYipScore(),
    verified: false,
    friendStatus: "friends",
    isGhost: false,
    birthday: "January 23",
    zodiacSign: "Aquarius",
    streakCount: 30,
    mutualFriends: 4,
    distance: 3.7
  },
  {
    id: "friend6",
    username: "emily",
    displayName: "Emily Davis",
    name: "Emily Davis",
    email: "emily@example.com",
    bio: "Psychology major with a passion for understanding human behavior.",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4529,
      longitude: -122.1817
    },
    createdAt: new Date(Date.now() - 86400000 * 40).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: false,
    lastActive: new Date(Date.now() - 10800000).toISOString(),
    friendCount: 20,
    yipScore: getRandomYipScore(),
    age: 19,
    highSchool: "Woodside High",
    interests: ["Psychology", "Reading", "Hiking", "Yoga"],
    relationshipStatus: "Single",
    snapScore: getRandomYipScore(),
    verified: true,
    friendStatus: "friends",
    isGhost: false,
    birthday: "August 8",
    zodiacSign: "Leo",
    streakCount: 5,
    mutualFriends: 6,
    distance: 5.0
  },
  {
    id: "friend7",
    username: "ryan",
    displayName: "Ryan Thompson",
    name: "Ryan Thompson",
    email: "ryan@example.com",
    bio: "Engineering student and robotics enthusiast. Working on cool projects.",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4449,
      longitude: -122.1607
    },
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    friendCount: 15,
    yipScore: getRandomYipScore(),
    age: 21,
    highSchool: "Menlo School",
    interests: ["Robotics", "Engineering", "3D Printing", "Drones"],
    relationshipStatus: "Single",
    snapScore: getRandomYipScore(),
    verified: false,
    friendStatus: "friends",
    isGhost: false,
    birthday: "February 28",
    zodiacSign: "Pisces",
    streakCount: 10,
    mutualFriends: 1,
    distance: 1.5
  }
];

export const mockBotFriends: User[] = [
  {
    id: "bot1",
    username: "yipbot",
    displayName: "YipYap Bot",
    name: "YipYap Bot",
    email: "bot@yipyap.com",
    bio: "Your friendly YipYap assistant! I'm here to help you navigate the app and make new friends.",
    avatar: "https://images.unsplash.com/photo-1531747118685-ca8fa6e08806?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4275,
      longitude: -122.1697
    },
    createdAt: new Date(Date.now() - 86400000 * 365).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    friendCount: 9999,
    yipScore: 9999,
    age: 1,
    highSchool: "YipYap Academy",
    interests: ["Helping", "Chatting", "Making Friends", "YipYap"],
    relationshipStatus: "It's complicated",
    snapScore: 9999,
    verified: true,
    friendStatus: "friends",
    isGhost: false,
    birthday: "May 1",
    zodiacSign: "Taurus",
    streakCount: 365,
    isBot: true,
    mutualFriends: 0,
    distance: 0
  },
  {
    id: "bot2",
    username: "newsbot",
    displayName: "Campus News",
    name: "Campus News",
    email: "news@yipyap.com",
    bio: "Your source for the latest campus news and events! Stay updated with what's happening around you.",
    avatar: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4275,
      longitude: -122.1697
    },
    createdAt: new Date(Date.now() - 86400000 * 300).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    friendCount: 5000,
    yipScore: 8500,
    age: 1,
    highSchool: "YipYap Academy",
    interests: ["News", "Events", "Campus Life", "Updates"],
    relationshipStatus: "Single",
    snapScore: 8500,
    verified: true,
    friendStatus: "friends",
    isGhost: false,
    birthday: "September 1",
    zodiacSign: "Virgo",
    streakCount: 300,
    isBot: true,
    mutualFriends: 0,
    distance: 0
  },
  {
    id: "bot3",
    username: "partybot",
    displayName: "Party Finder",
    name: "Party Finder",
    email: "party@yipyap.com",
    bio: "Find the hottest parties and events near you! I'll keep you updated on all the fun happening around campus.",
    avatar: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80",
    location: {
      latitude: 37.4275,
      longitude: -122.1697
    },
    createdAt: new Date(Date.now() - 86400000 * 250).toISOString(),
    updatedAt: new Date().toISOString(),
    isOnline: true,
    lastActive: new Date().toISOString(),
    friendCount: 7500,
    yipScore: 9200,
    age: 1,
    highSchool: "YipYap Academy",
    interests: ["Parties", "Events", "Music", "Fun"],
    relationshipStatus: "It's complicated",
    snapScore: 9200,
    verified: true,
    friendStatus: "friends",
    isGhost: false,
    birthday: "July 4",
    zodiacSign: "Cancer",
    streakCount: 250,
    isBot: true,
    mutualFriends: 0,
    distance: 0
  }
];

// Update zodiac signs based on birthdays
export const mockFriendsWithZodiac = mockFriends.map(friend => {
  if (friend.birthday && !friend.zodiacSign) {
    return {
      ...friend,
      zodiacSign: getZodiacSign(friend.birthday)
    };
  }
  return friend;
});

export const mockBotFriendsWithZodiac = mockBotFriends.map(bot => {
  if (bot.birthday && !bot.zodiacSign) {
    return {
      ...bot,
      zodiacSign: getZodiacSign(bot.birthday)
    };
  }
  return bot;
});

export const allMockFriends = [...mockFriendsWithZodiac, ...mockBotFriendsWithZodiac];