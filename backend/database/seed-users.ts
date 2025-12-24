import { executeQuery, getOne } from './connection';
import bcrypt from 'bcryptjs';

// Enhanced logging function for PM2
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [SEED_USERS] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

// Seed initial users
export async function seedUsers() {
  try {
    log('info', 'Seeding users in database');
    
    // Check if users already exist
    const existingUsers = await getOne('SELECT COUNT(*) as count FROM users');
    
    if (existingUsers && existingUsers.count > 0) {
      log('info', `Users already exist in database (${existingUsers.count} users)`);
      return;
    }
    
    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const userPassword = await bcrypt.hash('user123', 10);
    
    // Sample users data
    const users = [
      {
        username: 'admin15',
        email: 'admin15',
        password_hash: adminPassword,
        display_name: 'Admin User',
        bio: 'System Administrator',
        yip_score: 1000,
        relationship_status: 'single',
        interests: JSON.stringify(['technology', 'management', 'security']),
        zodiac_sign: 'leo',
        pronouns: 'they/them',
        is_verified: true,
        is_admin: true,
        is_online: true
      },
      {
        username: 'current_user',
        email: 'test@example.com',
        password_hash: userPassword,
        display_name: 'Test User',
        bio: 'Just testing the app!',
        yip_score: 150,
        relationship_status: 'single',
        interests: JSON.stringify(['music', 'movies', 'travel']),
        zodiac_sign: 'gemini',
        pronouns: 'he/him',
        is_verified: false,
        is_admin: false,
        is_online: false
      },
      {
        username: 'sarah_ocean',
        email: 'sarah@oceanview.edu',
        password_hash: userPassword,
        display_name: 'Sarah Ocean',
        bio: 'Marine biology teacher at Oceanview High',
        yip_score: 320,
        relationship_status: 'taken',
        interests: JSON.stringify(['marine biology', 'teaching', 'surfing']),
        zodiac_sign: 'pisces',
        pronouns: 'she/her',
        is_verified: true,
        is_admin: false,
        is_online: false
      },
      {
        username: 'mike_waves',
        email: 'mike@example.com',
        password_hash: userPassword,
        display_name: 'Mike Waves',
        bio: 'College student studying computer science',
        yip_score: 89,
        relationship_status: 'single',
        interests: JSON.stringify(['coding', 'gaming', 'basketball']),
        zodiac_sign: 'aries',
        pronouns: 'he/him',
        is_verified: false,
        is_admin: false,
        is_online: true
      },
      {
        username: 'emma_reef',
        email: 'emma@example.com',
        password_hash: userPassword,
        display_name: 'Emma Reef',
        bio: 'Environmental science enthusiast',
        yip_score: 245,
        relationship_status: 'complicated',
        interests: JSON.stringify(['environment', 'hiking', 'photography']),
        zodiac_sign: 'virgo',
        pronouns: 'she/her',
        is_verified: false,
        is_admin: false,
        is_online: false
      },
      {
        username: 'alex_tide',
        email: 'alex@example.com',
        password_hash: userPassword,
        display_name: 'Alex Tide',
        bio: 'Artist and creative soul',
        yip_score: 178,
        relationship_status: 'single',
        interests: JSON.stringify(['art', 'music', 'poetry']),
        zodiac_sign: 'libra',
        pronouns: 'they/them',
        is_verified: false,
        is_admin: false,
        is_online: false
      },
      {
        username: 'jordan_bay',
        email: 'jordan@example.com',
        password_hash: userPassword,
        display_name: 'Jordan Bay',
        bio: 'Fitness enthusiast and personal trainer',
        yip_score: 412,
        relationship_status: 'taken',
        interests: JSON.stringify(['fitness', 'nutrition', 'yoga']),
        zodiac_sign: 'scorpio',
        pronouns: 'he/him',
        is_verified: true,
        is_admin: false,
        is_online: true
      },
      {
        username: 'casey_shore',
        email: 'casey@example.com',
        password_hash: userPassword,
        display_name: 'Casey Shore',
        bio: 'Aspiring chef and food blogger',
        yip_score: 267,
        relationship_status: 'single',
        interests: JSON.stringify(['cooking', 'food', 'travel']),
        zodiac_sign: 'taurus',
        pronouns: 'she/her',
        is_verified: false,
        is_admin: false,
        is_online: false
      },
      {
        username: 'taylor_coast',
        email: 'taylor@example.com',
        password_hash: userPassword,
        display_name: 'Taylor Coast',
        bio: 'Music producer and DJ',
        yip_score: 356,
        relationship_status: 'single',
        interests: JSON.stringify(['music production', 'djing', 'concerts']),
        zodiac_sign: 'sagittarius',
        pronouns: 'they/them',
        is_verified: true,
        is_admin: false,
        is_online: false
      },
      {
        username: 'riley_harbor',
        email: 'riley@example.com',
        password_hash: userPassword,
        display_name: 'Riley Harbor',
        bio: 'Psychology student and mental health advocate',
        yip_score: 198,
        relationship_status: 'complicated',
        interests: JSON.stringify(['psychology', 'mental health', 'reading']),
        zodiac_sign: 'cancer',
        pronouns: 'she/her',
        is_verified: false,
        is_admin: false,
        is_online: true
      }
    ];
    
    // Insert users
    for (const user of users) {
      const result = await executeQuery(`
        INSERT INTO users (
          username, email, password_hash, display_name, bio, yip_score,
          relationship_status, interests, zodiac_sign, pronouns,
          is_verified, is_admin, is_online, created_at, last_seen
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        user.username,
        user.email,
        user.password_hash,
        user.display_name,
        user.bio,
        user.yip_score,
        user.relationship_status,
        user.interests,
        user.zodiac_sign,
        user.pronouns,
        user.is_verified ? 1 : 0,
        user.is_admin ? 1 : 0,
        user.is_online ? 1 : 0
      ]) as any;
      
      const userId = result.insertId;
      
      // Add some sample locations for users
      if (user.username !== 'admin15') {
        // Random locations around San Francisco Bay Area
        const baseLatitude = 37.7749;
        const baseLongitude = -122.4194;
        const randomLat = baseLatitude + (Math.random() - 0.5) * 0.1;
        const randomLng = baseLongitude + (Math.random() - 0.5) * 0.1;
        
        await executeQuery(`
          INSERT INTO user_locations (user_id, latitude, longitude, updated_at)
          VALUES (?, ?, ?, NOW())
        `, [userId, randomLat, randomLng]);
      }
    }
    
    // Create some sample friendships
    const friendships = [
      { user1: 'current_user', user2: 'sarah_ocean' },
      { user1: 'current_user', user2: 'mike_waves' },
      { user1: 'sarah_ocean', user2: 'emma_reef' },
      { user1: 'mike_waves', user2: 'alex_tide' },
      { user1: 'jordan_bay', user2: 'casey_shore' },
      { user1: 'taylor_coast', user2: 'riley_harbor' }
    ];
    
    for (const friendship of friendships) {
      // Get user IDs
      const user1 = await getOne('SELECT id FROM users WHERE username = ?', [friendship.user1]);
      const user2 = await getOne('SELECT id FROM users WHERE username = ?', [friendship.user2]);
      
      if (user1 && user2) {
        await executeQuery(`
          INSERT INTO friendships (user_id, friend_id, status, created_at)
          VALUES (?, ?, 'accepted', NOW())
        `, [user1.id, user2.id]);
      }
    }
    
    log('info', `Seeded ${users.length} users and ${friendships.length} friendships in database`);
  } catch (error: any) {
    log('error', 'Error seeding users in database', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}