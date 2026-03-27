import { serve } from '@hono/node-server';
import app from './hono';
import { cleanupExpiredData } from './database/init';
import { executeQuery } from './database/connection';

// Enhanced logging function for PM2 and production
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [SERVER] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

// Rate limiting middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(identifier: string, maxRequests: number = 100, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

// Analytics tracking
export async function trackEvent(userId: string | null, eventType: string, eventData: any = {}, ipAddress?: string, userAgent?: string) {
  try {
    if (!userId) return; // Skip tracking for unauthenticated users
    
    await executeQuery(`
      INSERT INTO user_analytics (user_id, event_type, event_data, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `, [
      userId,
      eventType,
      JSON.stringify(eventData),
      ipAddress || null,
      userAgent || null
    ]);
    
    log('info', 'Event tracked', { userId, eventType, eventData });
  } catch (error: any) {
    log('error', 'Failed to track event', {
      userId,
      eventType,
      error: error.message
    });
  }
}

// Rate limit tracking in database
export async function trackRateLimit(userId: string | null, ipAddress: string, endpoint: string) {
  try {
    const windowStart = new Date();
    windowStart.setMinutes(windowStart.getMinutes() - 1); // 1 minute window
    
    // Check existing rate limit record
    const existing = await executeQuery(`
      SELECT request_count FROM rate_limits 
      WHERE (user_id = ? OR ip_address = ?) 
        AND endpoint = ? 
        AND window_start > ?
    `, [userId, ipAddress, endpoint, windowStart]) as any[];
    
    if (existing.length > 0) {
      // Update existing record
      await executeQuery(`
        UPDATE rate_limits 
        SET request_count = request_count + 1, updated_at = NOW()
        WHERE (user_id = ? OR ip_address = ?) 
          AND endpoint = ? 
          AND window_start > ?
      `, [userId, ipAddress, endpoint, windowStart]);
    } else {
      // Create new record
      await executeQuery(`
        INSERT INTO rate_limits (user_id, ip_address, endpoint, request_count, window_start)
        VALUES (?, ?, ?, 1, NOW())
      `, [userId, ipAddress, endpoint]);
    }
  } catch (error: any) {
    log('error', 'Failed to track rate limit', {
      userId,
      ipAddress,
      endpoint,
      error: error.message
    });
  }
}

const port = parseInt(process.env.PORT || '3000');
const hostname = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';

// Set up scheduled cleanup jobs for production
function setupCleanupJobs() {
  // Clean up expired stories every minute (they expire after 24 hours)
  setInterval(async () => {
    try {
      log('info', 'Running scheduled story cleanup');
      await cleanupExpiredData();
    } catch (error: any) {
      log('error', 'Error during story cleanup', {
        error: error.message,
        stack: error.stack
      });
    }
  }, 60 * 1000); // 1 minute

  // Clean up other expired data every 5 minutes
  setInterval(async () => {
    try {
      log('info', 'Running scheduled cleanup of expired data');
      await cleanupExpiredData();
    } catch (error: any) {
      log('error', 'Error during scheduled cleanup', {
        error: error.message,
        stack: error.stack
      });
    }
  }, 5 * 60 * 1000); // 5 minutes

  // Clean up old messages and data every hour
  setInterval(async () => {
    try {
      log('info', 'Running hourly data cleanup');
      await cleanupExpiredData();
    } catch (error: any) {
      log('error', 'Error during hourly cleanup', {
        error: error.message
      });
    }
  }, 60 * 60 * 1000); // 1 hour

  // Clean up in-memory rate limit cache every 10 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    }
    log('info', 'Cleaned up rate limit cache', { remainingEntries: rateLimitMap.size });
  }, 10 * 60 * 1000); // 10 minutes

  log('info', 'Production cleanup jobs scheduled successfully');
}

// Start server
const server = serve({
  fetch: app.fetch,
  port,
  hostname,
}, (info) => {
  log('info', 'YipYap Backend Server started successfully', {
    port: info.port,
    hostname,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    processId: process.pid,
    nodeVersion: process.version,
    platform: process.platform
  });

  // Set up cleanup jobs after server starts
  setupCleanupJobs();
});

// Graceful shutdown handling for production
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully');
  server.close(() => {
    log('info', 'Server closed successfully');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('info', 'SIGINT received, shutting down gracefully');
  server.close(() => {
    log('info', 'Server closed successfully');
    process.exit(0);
  });
});

// Handle uncaught exceptions in production
process.on('uncaughtException', (error) => {
  log('error', 'Uncaught exception - shutting down', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log('error', 'Unhandled rejection - shutting down', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});

// Log memory usage every 10 minutes in production
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    log('info', 'Memory usage report', {
      rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    });
  }, 10 * 60 * 1000); // 10 minutes
}

export default app;