import { executeQuery, testConnection, getOne } from './connection';
import { seedUsers } from './seed-users';
import { seedSchools } from './seed-schools';

// Enhanced logging function for PM2
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [DATABASE_INIT] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

// Create all necessary tables
export async function createTables() {
  try {
    log('info', 'Creating database tables');
    
    // Users table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100),
        avatar TEXT,
        bio TEXT,
        yip_score INT DEFAULT 0,
        relationship_status ENUM('single', 'taken', 'complicated', 'married') DEFAULT 'single',
        interests JSON,
        zodiac_sign VARCHAR(20),
        pronouns VARCHAR(50),
        is_verified BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        is_banned BOOLEAN DEFAULT FALSE,
        ban_reason TEXT,
        banned_at TIMESTAMP NULL,
        banned_by INT,
        is_online BOOLEAN DEFAULT FALSE,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_username (username),
        INDEX idx_email (email),
        INDEX idx_is_admin (is_admin),
        INDEX idx_is_banned (is_banned),
        INDEX idx_last_seen (last_seen)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // User locations table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_locations (
        user_id INT PRIMARY KEY,
        latitude DECIMAL(10, 8) NOT NULL,
        longitude DECIMAL(11, 8) NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_location (latitude, longitude),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Schools table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS schools (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL,
        address VARCHAR(500),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(50) NOT NULL,
        zip_code VARCHAR(20),
        latitude DECIMAL(10, 8),
        longitude DECIMAL(11, 8),
        school_type ENUM('public', 'private', 'charter') DEFAULT 'public',
        student_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_name (name),
        INDEX idx_location (city, state),
        INDEX idx_coordinates (latitude, longitude)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // User schools relationship table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_schools (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        school_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_school (user_id, school_id),
        INDEX idx_user_id (user_id),
        INDEX idx_school_id (school_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Friendships table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS friendships (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'declined') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_friendship (user_id, friend_id),
        INDEX idx_user_id (user_id),
        INDEX idx_friend_id (friend_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // User blocks table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_blocks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        blocked_user_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_block (user_id, blocked_user_id),
        INDEX idx_user_id (user_id),
        INDEX idx_blocked_user_id (blocked_user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Parties table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS parties (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(500) NOT NULL,
        date TIMESTAMP NOT NULL,
        max_attendees INT,
        emoji VARCHAR(10),
        creator_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_creator_id (creator_id),
        INDEX idx_date (date),
        INDEX idx_location (location(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Party attendees table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS party_attendees (
        id INT PRIMARY KEY AUTO_INCREMENT,
        party_id INT NOT NULL,
        user_id INT NOT NULL,
        status ENUM('attending', 'maybe', 'not_attending') DEFAULT 'attending',
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (party_id) REFERENCES parties(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_party_attendee (party_id, user_id),
        INDEX idx_party_id (party_id),
        INDEX idx_user_id (user_id),
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Stories table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS stories (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        image_url TEXT NOT NULL,
        caption TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_expires_at (expires_at),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Story views table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS story_views (
        id INT PRIMARY KEY AUTO_INCREMENT,
        story_id INT NOT NULL,
        viewer_id INT NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE,
        FOREIGN KEY (viewer_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_story_view (story_id, viewer_id),
        INDEX idx_story_id (story_id),
        INDEX idx_viewer_id (viewer_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Chats table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS chats (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255),
        type ENUM('direct', 'group', 'party', 'school') DEFAULT 'direct',
        created_by INT NOT NULL,
        last_message_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_created_by (created_by),
        INDEX idx_type (type),
        INDEX idx_updated_at (updated_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Chat participants table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        left_at TIMESTAMP NULL,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_chat_participant (chat_id, user_id),
        INDEX idx_chat_id (chat_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Messages table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chat_id INT NOT NULL,
        sender_id INT NOT NULL,
        content TEXT,
        type ENUM('text', 'image', 'video', 'voice', 'yip', 'system') DEFAULT 'text',
        image_uri TEXT,
        video_uri TEXT,
        reply_to_id INT,
        is_read BOOLEAN DEFAULT FALSE,
        is_saved BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        deleted_for ENUM('me', 'everyone'),
        expires_at TIMESTAMP NULL,
        view_count INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL,
        INDEX idx_chat_id (chat_id),
        INDEX idx_sender_id (sender_id),
        INDEX idx_created_at (created_at),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Message deletions table (for per-user deletions)
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS message_deletions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_message_deletion (message_id, user_id),
        INDEX idx_message_id (message_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Saved messages table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS saved_messages (
        id INT PRIMARY KEY AUTO_INCREMENT,
        message_id INT NOT NULL,
        user_id INT NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_saved_message (message_id, user_id),
        INDEX idx_message_id (message_id),
        INDEX idx_user_id (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Chat settings table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS chat_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chat_id INT NOT NULL,
        message_lifespan ENUM('default', 'immediate', 'never') DEFAULT 'default',
        allow_screenshots BOOLEAN DEFAULT TRUE,
        show_typing_indicators BOOLEAN DEFAULT TRUE,
        show_read_receipts BOOLEAN DEFAULT TRUE,
        allow_media_saving BOOLEAN DEFAULT TRUE,
        notify_on_screenshot BOOLEAN DEFAULT TRUE,
        encryption_enabled BOOLEAN DEFAULT FALSE,
        auto_delete_after_hours INT,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        UNIQUE KEY unique_chat_settings (chat_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Typing indicators table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id INT PRIMARY KEY AUTO_INCREMENT,
        chat_id INT NOT NULL,
        user_id INT NOT NULL,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_typing_indicator (chat_id, user_id),
        INDEX idx_chat_id (chat_id),
        INDEX idx_user_id (user_id),
        INDEX idx_started_at (started_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // User analytics table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_analytics (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        event_type VARCHAR(50) NOT NULL,
        event_data JSON,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_event_type (event_type),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Rate limiting table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS rate_limits (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        ip_address VARCHAR(45),
        endpoint VARCHAR(255) NOT NULL,
        request_count INT DEFAULT 1,
        window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_user_id (user_id),
        INDEX idx_ip_address (ip_address),
        INDEX idx_endpoint (endpoint),
        INDEX idx_window_start (window_start)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // User reports table
    await executeQuery(`
      CREATE TABLE IF NOT EXISTS user_reports (
        id INT PRIMARY KEY AUTO_INCREMENT,
        reporter_id INT NOT NULL,
        reported_user_id INT NOT NULL,
        reason VARCHAR(255) NOT NULL,
        note TEXT,
        status ENUM('pending', 'reviewed', 'dismissed') DEFAULT 'pending',
        action_taken ENUM('none', 'warning', 'ban', 'suspend'),
        reviewed_by INT,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_reporter_id (reporter_id),
        INDEX idx_reported_user_id (reported_user_id),
        INDEX idx_status (status),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Add foreign key constraint for chats.last_message_id after messages table is created
    try {
      await executeQuery(`
        ALTER TABLE chats 
        ADD CONSTRAINT fk_chats_last_message 
        FOREIGN KEY (last_message_id) REFERENCES messages(id) ON DELETE SET NULL
      `);
    } catch (error: any) {
      // Ignore error if constraint already exists
      if (!error.message.includes('Duplicate key name')) {
        log('warn', 'Could not add foreign key constraint for chats.last_message_id', {
          error: error.message
        });
      }
    }
    
    log('info', 'All database tables created successfully');
  } catch (error: any) {
    log('error', 'Error creating database tables', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Initialize database with tables and seed data
export async function initializeDatabase() {
  try {
    log('info', 'Starting database initialization');
    
    // Test connection first
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }
    
    // Create all tables
    await createTables();
    log('info', 'Database tables created/verified');
    
    // Check if we need to seed data
    const userCount = await getOne('SELECT COUNT(*) as count FROM users');
    const schoolCount = await getOne('SELECT COUNT(*) as count FROM schools');
    
    log('info', 'Current database state', {
      userCount: userCount?.count || 0,
      schoolCount: schoolCount?.count || 0
    });
    
    // Seed users if none exist
    if (!userCount || userCount.count === 0) {
      log('info', 'Seeding initial users');
      await seedUsers();
    } else {
      log('info', 'Users already exist, skipping user seeding');
    }
    
    // Seed schools if none exist
    if (!schoolCount || schoolCount.count === 0) {
      log('info', 'Seeding initial schools');
      await seedSchools();
    } else {
      log('info', 'Schools already exist, skipping school seeding');
    }
    
    log('info', 'Database initialization completed successfully');
  } catch (error: any) {
    log('error', 'Database initialization failed', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
}

// Clean up expired data - CRITICAL for automatic cleanup
export async function cleanupExpiredData() {
  try {
    log('info', 'Starting cleanup of expired data');
    
    // Delete expired stories (older than 24 hours)
    const expiredStoriesResult = await executeQuery(`
      DELETE FROM stories WHERE expires_at < NOW()
    `) as any;
    
    // Delete expired messages (based on expires_at field)
    const expiredMessagesResult = await executeQuery(`
      DELETE FROM messages WHERE expires_at IS NOT NULL AND expires_at < NOW()
    `) as any;
    
    // Delete expired Yip messages (older than 24 hours and not saved)
    const expiredYipsResult = await executeQuery(`
      DELETE FROM messages 
      WHERE type = 'yip' 
        AND is_saved = FALSE 
        AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
    `) as any;
    
    // Update user online status (users offline for more than 5 minutes)
    const offlineUsersResult = await executeQuery(`
      UPDATE users 
      SET is_online = FALSE 
      WHERE is_online = TRUE AND last_seen < DATE_SUB(NOW(), INTERVAL 5 MINUTE)
    `) as any;
    
    // Clean up old typing indicators (older than 30 seconds)
    const oldTypingResult = await executeQuery(`
      DELETE FROM typing_indicators 
      WHERE started_at < DATE_SUB(NOW(), INTERVAL 30 SECOND)
    `) as any;
    
    // Clean up old rate limit records (older than 1 hour)
    const oldRateLimitsResult = await executeQuery(`
      DELETE FROM rate_limits 
      WHERE window_start < DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `) as any;
    
    // Clean up orphaned story views (for deleted stories)
    const orphanedViewsResult = await executeQuery(`
      DELETE sv FROM story_views sv
      LEFT JOIN stories s ON sv.story_id = s.id
      WHERE s.id IS NULL
    `) as any;
    
    // Clean up orphaned message deletions (for deleted messages)
    const orphanedDeletionsResult = await executeQuery(`
      DELETE md FROM message_deletions md
      LEFT JOIN messages m ON md.message_id = m.id
      WHERE m.id IS NULL
    `) as any;
    
    // Clean up orphaned saved messages (for deleted messages)
    const orphanedSavedResult = await executeQuery(`
      DELETE sm FROM saved_messages sm
      LEFT JOIN messages m ON sm.message_id = m.id
      WHERE m.id IS NULL
    `) as any;
    
    log('info', 'Cleanup completed successfully', {
      expiredStories: expiredStoriesResult.affectedRows || 0,
      expiredMessages: expiredMessagesResult.affectedRows || 0,
      expiredYips: expiredYipsResult.affectedRows || 0,
      offlineUsers: offlineUsersResult.affectedRows || 0,
      oldTyping: oldTypingResult.affectedRows || 0,
      oldRateLimits: oldRateLimitsResult.affectedRows || 0,
      orphanedViews: orphanedViewsResult.affectedRows || 0,
      orphanedDeletions: orphanedDeletionsResult.affectedRows || 0,
      orphanedSaved: orphanedSavedResult.affectedRows || 0
    });
  } catch (error: any) {
    log('error', 'Error during cleanup', {
      error: error.message,
      stack: error.stack
    });
  }
}

// Export for external use
export { testConnection };