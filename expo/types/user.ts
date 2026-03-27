export interface User {
  id: string;
  username: string;
  displayName: string;
  name?: string;
  email: string;
  bio: string;
  avatar: string;
  friendCount?: number;
  yipScore: number;
  relationshipStatus: string;
  interests: string[];
  zodiacSign: string;
  pronouns: string;
  isAdmin?: boolean;
  createdAt: string;
  lastSeen?: number;
  isVerified?: boolean;
  isOnline?: boolean;
  age: number;
  dateOfBirth?: string;
  birthday?: string;
  highSchool?: string;
  verified?: boolean;
  lastActive?: string;
  streakCount?: number;
  friends?: string[];
  school?: string;
  distance?: number;
  gender?: 'male' | 'female' | 'other';
  isVIP?: boolean;
  mutualFriends?: number;
  photos?: string[];
  photosCaptions?: string[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  displayName: string;
  age: number;
  avatar?: string;
  highSchool?: string;
  interests?: string[];
  relationshipStatus?: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reason: string;
  note?: string;
  timestamp: number;
  status: 'pending' | 'reviewed';
  reviewedBy?: string;
  reviewedAt?: number;
  action?: 'none' | 'warning' | 'ban' | 'suspend';
}