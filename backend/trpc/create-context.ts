import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { Context as HonoContext } from 'hono';
import { User } from '../../types/user';
import { getOne } from '../database/connection';

export interface TRPCContext {
  req: Request;
  user: User | null;
  token: string | null;
  requestId: string;
  [key: string]: unknown;
}

// Enhanced logging function for PM2
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [CONTEXT] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

export async function createContext(
  opts: FetchCreateContextFnOptions,
  c?: HonoContext,
  requestId?: string
): Promise<TRPCContext> {
  const reqId = requestId || `ctx_${Date.now()}`;
  
  try {
    // Get authorization header
    const authHeader = opts.req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || null;
    
    log('info', 'Creating TRPC context', { 
      requestId: reqId,
      hasToken: !!token,
      tokenPreview: token ? `${token.substring(0, 10)}...` : null
    });
    
    let user: User | null = null;
    
    // If token exists, validate it and get user info
    if (token && token !== 'null' && token !== 'undefined') {
      try {
        // Handle different token types
        if (token === 'admin-auth-token') {
          // Admin token - get admin user
          const adminUser = await getOne(
            'SELECT * FROM users WHERE username = ? AND is_admin = 1',
            ['admin15']
          );
          
          if (adminUser) {
            user = {
              id: String(adminUser.id), // Convert number to string
              username: adminUser.username,
              displayName: adminUser.display_name || "Admin",
              email: adminUser.email || "admin@yipyap.com",
              bio: adminUser.bio || "System Administrator",
              avatar: adminUser.avatar || "",
              yipScore: adminUser.yip_score || 0,
              relationshipStatus: adminUser.relationship_status || "single",
              interests: adminUser.interests ? JSON.parse(adminUser.interests) : [],
              zodiacSign: adminUser.zodiac_sign || "",
              pronouns: adminUser.pronouns || "",
              isAdmin: true,
              createdAt: new Date(adminUser.created_at).toISOString(),
              age: adminUser.age || 25,
            };
            
            log('info', 'Admin user authenticated', { 
              requestId: reqId,
              userId: user.id 
            });
          }
        } else if (token.startsWith('user_token_') || token === 'mock-auth-token') {
          // Regular user token
          let userId: string;
          
          if (token === 'mock-auth-token') {
            userId = 'current_user';
          } else {
            userId = token.replace('user_token_', '');
          }
          
          const dbUser = await getOne(
            'SELECT * FROM users WHERE id = ? AND is_admin = 0',
            [userId]
          );
          
          if (dbUser) {
            user = {
              id: String(dbUser.id), // Convert number to string
              username: dbUser.username,
              displayName: dbUser.display_name || dbUser.username,
              email: dbUser.email || "",
              bio: dbUser.bio || "",
              avatar: dbUser.avatar || "",
              yipScore: dbUser.yip_score || 0,
              relationshipStatus: dbUser.relationship_status || "single",
              interests: dbUser.interests ? JSON.parse(dbUser.interests) : [],
              zodiacSign: dbUser.zodiac_sign || "",
              pronouns: dbUser.pronouns || "",
              isAdmin: false,
              createdAt: new Date(dbUser.created_at).toISOString(),
              age: dbUser.age || 18,
            };
            
            log('info', 'User authenticated from database', { 
              requestId: reqId,
              userId: user.id,
              username: user.username
            });
          } else if (token === 'mock-auth-token' && process.env.NODE_ENV === 'development') {
            // Fallback mock user for development
            user = {
              id: "current_user",
              username: "testuser",
              displayName: "Test User",
              email: "test@example.com",
              bio: "",
              avatar: "",
              yipScore: 0,
              relationshipStatus: "single",
              interests: [],
              zodiacSign: "",
              pronouns: "",
              isAdmin: false,
              createdAt: new Date().toISOString(),
              age: 20,
            };
            
            log('info', 'Mock user authenticated for development', { 
              requestId: reqId,
              userId: user.id
            });
          }
        }
      } catch (error: any) {
        log('error', 'Error validating token', {
          requestId: reqId,
          error: error.message,
          tokenPreview: token ? `${token.substring(0, 10)}...` : null
        });
      }
    }
    
    const context = {
      req: opts.req,
      user,
      token,
      requestId: reqId
    };
    
    log('info', 'TRPC context created', { 
      requestId: reqId,
      hasUser: !!user,
      userId: user?.id,
      isAdmin: user?.isAdmin
    });
    
    return context;
  } catch (error: any) {
    log('error', 'Error creating TRPC context', {
      requestId: reqId,
      error: error.message,
      stack: error.stack
    });
    
    // Return basic context even if there's an error
    return {
      req: opts.req,
      user: null,
      token: null,
      requestId: reqId
    };
  }
}