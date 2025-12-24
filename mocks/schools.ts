export interface School {
  id: string;
  name: string;
  type: 'high_school' | 'college' | 'university';
  location: {
    city: string;
    state: string;
    country: string;
  };
  studentCount?: number;
  isVerified: boolean;
  logo?: string;
}

export const mockSchools: School[] = [
  {
    id: 'school_1',
    name: 'Lincoln High School',
    type: 'high_school',
    location: {
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA'
    },
    studentCount: 1200,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_2',
    name: 'Roosevelt High School',
    type: 'high_school',
    location: {
      city: 'New York',
      state: 'NY',
      country: 'USA'
    },
    studentCount: 1500,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_3',
    name: 'Washington High School',
    type: 'high_school',
    location: {
      city: 'Chicago',
      state: 'IL',
      country: 'USA'
    },
    studentCount: 1000,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1562774053-701939374585?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_4',
    name: 'Jefferson High School',
    type: 'high_school',
    location: {
      city: 'Houston',
      state: 'TX',
      country: 'USA'
    },
    studentCount: 1300,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_5',
    name: 'Madison High School',
    type: 'high_school',
    location: {
      city: 'Phoenix',
      state: 'AZ',
      country: 'USA'
    },
    studentCount: 900,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_6',
    name: 'University of California, Los Angeles',
    type: 'university',
    location: {
      city: 'Los Angeles',
      state: 'CA',
      country: 'USA'
    },
    studentCount: 45000,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_7',
    name: 'Harvard University',
    type: 'university',
    location: {
      city: 'Cambridge',
      state: 'MA',
      country: 'USA'
    },
    studentCount: 23000,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_8',
    name: 'Stanford University',
    type: 'university',
    location: {
      city: 'Stanford',
      state: 'CA',
      country: 'USA'
    },
    studentCount: 17000,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1564981797816-1043664bf78d?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_9',
    name: 'Massachusetts Institute of Technology',
    type: 'university',
    location: {
      city: 'Cambridge',
      state: 'MA',
      country: 'USA'
    },
    studentCount: 11000,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: 'school_10',
    name: 'University of Texas at Austin',
    type: 'university',
    location: {
      city: 'Austin',
      state: 'TX',
      country: 'USA'
    },
    studentCount: 51000,
    isVerified: true,
    logo: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=100&h=100&fit=crop&crop=center'
  }
];

// Export default for compatibility
export default mockSchools;