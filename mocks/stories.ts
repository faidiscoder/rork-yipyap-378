export interface Story {
  id: string;
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  imageUrl: string;
  caption?: string;
  timestamp: number;
  isViewed: boolean;
  viewCount: number;
  duration: number; // in seconds
}

const storyImages = [
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1532980400857-e8d9d275d858?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=600&fit=crop'
];

const storyCaptions = [
  'Having the best day ever! ☀️',
  'Coffee and good vibes ☕',
  'Weekend adventures 🌟',
  'Study break time 📚',
  'Beautiful sunset tonight 🌅',
  'Hanging with friends 👥',
  'New haircut, who dis? ✂️',
  'Concert was amazing! 🎵',
  'Beach day vibes 🏖️',
  'Workout complete! 💪',
  'Delicious dinner 🍽️',
  'Art project finished 🎨',
  'Game night fun 🎮',
  'Movie marathon mode 🎬',
  'Nature walk therapy 🌲',
  'Late night coding session 💻',
  'Dance practice done 💃',
  'Cooking experiment 👨‍🍳',
  'Road trip memories 🚗',
  'Music festival vibes 🎪'
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Generate mock stories for the first 30 users
export const mockStories: Story[] = [];

for (let i = 1; i <= 30; i++) {
  const userId = `user_${i}`;
  const storyCount = Math.floor(Math.random() * 3) + 1; // 1-3 stories per user
  
  for (let j = 0; j < storyCount; j++) {
    const story: Story = {
      id: `story_${userId}_${j + 1}`,
      userId,
      username: `user${i}`,
      displayName: `User ${i}`,
      avatar: `https://images.unsplash.com/photo-${1535713875002 + i}?w=100&h=100&fit=crop&crop=face`,
      imageUrl: getRandomElement(storyImages),
      caption: Math.random() > 0.3 ? getRandomElement(storyCaptions) : undefined,
      timestamp: Date.now() - Math.random() * 86400000, // Random time in last 24h
      isViewed: Math.random() > 0.7, // 30% chance of being viewed
      viewCount: Math.floor(Math.random() * 50) + 1,
      duration: Math.floor(Math.random() * 10) + 5 // 5-15 seconds
    };
    
    mockStories.push(story);
  }
}

// Add test user's story
mockStories.unshift({
  id: 'story_current_user_1',
  userId: 'current_user',
  username: 'testuser',
  displayName: 'Test User',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop&crop=face',
  imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=600&fit=crop',
  caption: 'Testing the new story feature! 🚀',
  timestamp: Date.now() - 1800000, // 30 minutes ago
  isViewed: false,
  viewCount: 0,
  duration: 10
});

// Group stories by user
export const getStoriesByUser = () => {
  const storiesByUser: { [userId: string]: Story[] } = {};
  
  mockStories.forEach(story => {
    if (!storiesByUser[story.userId]) {
      storiesByUser[story.userId] = [];
    }
    storiesByUser[story.userId].push(story);
  });
  
  // Sort stories within each user by timestamp (newest first)
  Object.keys(storiesByUser).forEach(userId => {
    storiesByUser[userId].sort((a, b) => b.timestamp - a.timestamp);
  });
  
  return storiesByUser;
};

// Get users who have stories
export const getUsersWithStories = () => {
  const storiesByUser = getStoriesByUser();
  return Object.keys(storiesByUser).map(userId => ({
    userId,
    stories: storiesByUser[userId],
    hasUnviewed: storiesByUser[userId].some(story => !story.isViewed)
  }));
};