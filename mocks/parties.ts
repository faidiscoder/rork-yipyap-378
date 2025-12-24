export interface Party {
  id: string;
  title: string;
  description: string;
  hostId: string;
  hostName: string;
  hostAvatar: string;
  date: string;
  time: string;
  location: string;
  address: string;
  attendeeCount: number;
  maxAttendees?: number;
  isPrivate: boolean;
  tags: string[];
  imageUrl: string;
  createdAt: string;
  rsvpStatus?: 'attending' | 'maybe' | 'not_attending' | 'invited';
  attendees: string[];
  invitedUsers: string[];
  chatId?: string;
  emoji: string;
  ageRestriction?: string;
  dresscode?: string;
  price?: number;
  isVerified: boolean;
}

const partyTitles = [
  'Beach Bonfire Night',
  'House Party Extravaganza',
  'Rooftop Sunset Vibes',
  'Game Night Madness',
  'Movie Marathon Night',
  'Pool Party Splash',
  'Birthday Bash',
  'Study Break Party',
  'Halloween Costume Party',
  'New Year Countdown',
  'Spring Break Kickoff',
  'End of Exams Celebration',
  'Friday Night Hangout',
  'Weekend Warriors',
  'Backyard BBQ',
  'Dance Floor Fever',
  'Karaoke Night',
  'Pizza Party',
  'Sleepover Squad',
  'Adventure Club Meetup',
  'Art & Paint Night',
  'Music Jam Session',
  'Outdoor Movie Night',
  'Camping Under Stars',
  'Sports Watch Party',
  'Cooking Challenge',
  'Board Game Tournament',
  'Video Game Championship',
  'Talent Show Night',
  'Themed Costume Party'
];

const partyDescriptions = [
  'Come join us for an amazing night of fun, music, and great company!',
  'The party of the year is here! Don\'t miss out on the fun.',
  'Chill vibes, good music, and awesome people. What more could you want?',
  'Let\'s celebrate and make some unforgettable memories together!',
  'Bring your friends and get ready for an epic night!',
  'Food, drinks, music, and dancing - everything you need for a perfect party!',
  'Join us for a night you won\'t forget. See you there!',
  'Time to unwind and have some fun with friends!',
  'The ultimate hangout spot for the weekend. Come through!',
  'Good vibes only! Let\'s party and have a blast!',
  'Celebrating life and friendship with an amazing party!',
  'Music, laughter, and good times await you!',
  'Don\'t miss this incredible party experience!',
  'Join the fun and meet new people at our awesome party!',
  'The perfect way to spend your weekend - partying with friends!'
];

const locations = [
  'Palo Alto Community Center',
  'Stanford Campus Quad',
  'Menlo Park Beach',
  'Los Altos Hills Mansion',
  'Mountain View Rooftop',
  'Cupertino House Party',
  'Saratoga Backyard',
  'Fremont Park Pavilion',
  'San Jose Event Hall',
  'Santa Clara Recreation Center',
  'Sunnyvale Community Pool',
  'Milpitas Sports Complex',
  'Campbell Park Gazebo',
  'Los Gatos Creek Trail',
  'Redwood City Marina',
  'Foster City Lagoon',
  'Belmont Hillside',
  'San Mateo Beach Club',
  'Half Moon Bay Pier',
  'Pacifica Sunset Point'
];

const partyTags = [
  'music', 'dancing', 'food', 'drinks', 'games', 'outdoor', 'indoor', 'casual', 'formal',
  'themed', 'birthday', 'celebration', 'study break', 'weekend', 'night', 'day',
  'pool', 'beach', 'rooftop', 'house', 'backyard', 'park', 'community', 'friends',
  'networking', 'social', 'fun', 'chill', 'energetic', 'exclusive'
];

const partyImages = [
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1532980400857-e8d9d275d858?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600&h=400&fit=crop'
];

const emojis = ['🎉', '🎊', '🥳', '🎈', '🎂', '🍕', '🎵', '🕺', '💃', '🌟', '🔥', '✨', '🎭', '🎪', '🎨'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateRandomDate(): { date: string; time: string } {
  const now = new Date();
  const futureDate = new Date(now.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Next 30 days
  
  const date = futureDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const hours = Math.floor(Math.random() * 12) + 6; // 6 PM to 5 AM
  const minutes = Math.random() > 0.5 ? '00' : '30';
  const ampm = hours >= 12 ? 'AM' : 'PM';
  const displayHours = hours > 12 ? hours - 12 : hours;
  
  const time = `${displayHours}:${minutes} ${ampm}`;
  
  return { date, time };
}

// Generate 50 mock parties
export const mockParties: Party[] = [];

for (let i = 1; i <= 50; i++) {
  const hostId = `user_${Math.floor(Math.random() * 100) + 1}`;
  const { date, time } = generateRandomDate();
  const attendeeCount = Math.floor(Math.random() * 100) + 5;
  const maxAttendees = Math.random() > 0.7 ? attendeeCount + Math.floor(Math.random() * 50) + 10 : undefined;
  
  const party: Party = {
    id: `party_${i}`,
    title: getRandomElement(partyTitles),
    description: getRandomElement(partyDescriptions),
    hostId,
    hostName: `Host ${i}`,
    hostAvatar: `https://images.unsplash.com/photo-${1535713875002 + i}?w=100&h=100&fit=crop&crop=face`,
    date,
    time,
    location: getRandomElement(locations),
    address: `${Math.floor(Math.random() * 9999) + 1000} ${getRandomElement(['Main St', 'Oak Ave', 'Park Blvd', 'University Dr', 'Campus Way'])}`,
    attendeeCount,
    maxAttendees,
    isPrivate: Math.random() > 0.7, // 30% chance of being private
    tags: getRandomElements(partyTags, Math.floor(Math.random() * 5) + 2),
    imageUrl: getRandomElement(partyImages),
    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Created in last week
    rsvpStatus: Math.random() > 0.8 ? getRandomElement(['attending', 'maybe', 'not_attending', 'invited']) : undefined,
    attendees: Array.from({ length: Math.floor(attendeeCount * 0.7) }, (_, j) => `user_${j + 1}`),
    invitedUsers: Array.from({ length: Math.floor(Math.random() * 20) + 5 }, (_, j) => `user_${j + 50}`),
    chatId: `party_chat_${i}`,
    emoji: getRandomElement(emojis),
    ageRestriction: Math.random() > 0.8 ? '18+' : undefined,
    dresscode: Math.random() > 0.9 ? getRandomElement(['Casual', 'Semi-formal', 'Costume', 'Beach attire']) : undefined,
    price: Math.random() > 0.8 ? Math.floor(Math.random() * 50) + 5 : undefined,
    isVerified: Math.random() > 0.8 // 20% chance of being verified
  };
  
  mockParties.push(party);
}

// Add some parties that the test user is involved in
mockParties.push({
  id: 'party_test_1',
  title: 'Test User\'s Birthday Bash',
  description: 'Come celebrate with me! Food, music, and great company guaranteed!',
  hostId: 'current_user',
  hostName: 'Test User',
  hostAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
  date: 'Saturday, January 20, 2024',
  time: '7:00 PM',
  location: 'Palo Alto Community Center',
  address: '1313 Newell Rd, Palo Alto, CA',
  attendeeCount: 25,
  maxAttendees: 50,
  isPrivate: false,
  tags: ['birthday', 'celebration', 'music', 'food', 'friends'],
  imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&h=400&fit=crop',
  createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  rsvpStatus: 'attending',
  attendees: ['current_user', 'user_1', 'user_2', 'user_3', 'user_4', 'user_5'],
  invitedUsers: ['user_6', 'user_7', 'user_8', 'user_9', 'user_10'],
  chatId: 'party_chat_test_1',
  emoji: '🎂',
  isVerified: true
});

// Get parties by status
export const getPartiesByStatus = (status?: string) => {
  if (!status) return mockParties;
  return mockParties.filter(party => party.rsvpStatus === status);
};

// Get parties hosted by user
export const getPartiesByHost = (hostId: string) => {
  return mockParties.filter(party => party.hostId === hostId);
};

// Get parties user is attending
export const getPartiesAttending = (userId: string) => {
  return mockParties.filter(party => 
    party.attendees.includes(userId) || party.rsvpStatus === 'attending'
  );
};

// Get parties user is invited to
export const getPartiesInvited = (userId: string) => {
  return mockParties.filter(party => 
    party.invitedUsers.includes(userId) || party.rsvpStatus === 'invited'
  );
};