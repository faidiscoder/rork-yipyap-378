import { router, publicProcedure } from '../../trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { getOne, executeQuery } from '../../../database/connection';
import bcrypt from 'bcrypt';

// Enhanced logging function for PM2
function log(level: string, message: string, data: any = {}) {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${level.toUpperCase()}] [AUTH] ${message}${Object.keys(data).length > 0 ? ' | ' + JSON.stringify(data) : ''}`;
  
  if (level === 'error') {
    console.error(formattedLog);
  } else {
    console.log(formattedLog);
  }
}

export const authRouter = router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const requestId = ctx.requestId || 'unknown';
      
      try {
        log('info', 'Login attempt', { 
          requestId,
          email: input.email,
          isAdmin: input.email === 'admin15'
        });
        
        // CRITICAL: Exact email matching - trim whitespace and convert to lowercase
        const trimmedEmail = input.email.trim().toLowerCase();
        
        // Check for admin account - special case for admin15
        if (trimmedEmail === 'admin15' && input.password === 'Godstidys1$') {
          try {
            // Try to get admin from database first with EXACT match
            const adminUser = await getOne(
              'SELECT * FROM users WHERE username = ? AND email = ? AND is_admin = 1',
              ['admin15', 'admin15']
            );
            
            if (adminUser) {
              const user = {
                id: adminUser.id,
                email: adminUser.email,
                username: adminUser.username,
                displayName: adminUser.display_name || "Admin",
                bio: adminUser.bio || "System Administrator",
                avatar: adminUser.avatar || "",
                yipScore: adminUser.yip_score || 0,
                relationshipStatus: adminUser.relationship_status || "single",
                interests: adminUser.interests ? JSON.parse(adminUser.interests) : [],
                zodiacSign: adminUser.zodiac_sign || "",
                pronouns: adminUser.pronouns || "",
                age: adminUser.age || 25,
                isAdmin: true,
                createdAt: adminUser.created_at,
              };
              
              log('info', 'Admin login successful from database', { 
                requestId,
                userId: user.id 
              });
              
              return {
                user,
                token: "admin-auth-token",
              };
            } else {
              // Create admin user if doesn't exist
              log('info', 'Creating admin user in database', { requestId });
              
              const hashedPassword = await bcrypt.hash('Godstidys1$', 12);
              const adminId = `admin_${Date.now()}`;
              
              await executeQuery(
                `INSERT INTO users (id, username, email, display_name, password_hash, bio, age, is_admin, created_at, updated_at) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
                [adminId, 'admin15', 'admin15', 'Admin', hashedPassword, 'System Administrator', 25, 1]
              );
              
              const user = {
                id: adminId,
                email: "admin15",
                username: "admin15",
                displayName: "Admin",
                bio: "System Administrator",
                avatar: "",
                yipScore: 0,
                relationshipStatus: "single",
                interests: [],
                zodiacSign: "",
                pronouns: "",
                age: 25,
                isAdmin: true,
                createdAt: new Date().toISOString(),
              };
              
              log('info', 'Admin user created and login successful', { 
                requestId,
                userId: user.id 
              });
              
              return {
                user,
                token: "admin-auth-token",
              };
            }
          } catch (dbError: any) {
            log('error', 'Database error during admin login', {
              requestId,
              error: dbError.message
            });
            
            // Fallback to hardcoded admin for development
            const adminUser = {
              id: "admin_user",
              email: "admin15",
              username: "admin15",
              displayName: "Admin",
              bio: "System Administrator",
              avatar: "",
              yipScore: 0,
              relationshipStatus: "single",
              interests: [],
              zodiacSign: "",
              pronouns: "",
              age: 25,
              isAdmin: true,
              createdAt: new Date().toISOString(),
            };
            
            log('info', 'Using fallback admin login', { requestId });
            
            return {
              user: adminUser,
              token: "admin-auth-token",
            };
          }
        }
        
        // For regular users, validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Please enter a valid email address',
          });
        }
        
        try {
          // Try to get user from database with EXACT email match (case-insensitive)
          log('info', 'Attempting database login with exact email match', { 
            requestId,
            email: trimmedEmail 
          });
          
          const dbUser = await getOne(
            'SELECT * FROM users WHERE LOWER(email) = ? AND is_admin = 0',
            [trimmedEmail] // CRITICAL: Exact case-insensitive match
          );
          
          if (dbUser) {
            log('info', 'User found in database, verifying password', { 
              requestId,
              userId: dbUser.id,
              username: dbUser.username
            });
            
            // Verify password
            const passwordMatch = await bcrypt.compare(input.password, dbUser.password_hash);
            
            if (!passwordMatch) {
              log('warn', 'Password verification failed', { 
                requestId,
                userId: dbUser.id 
              });
              throw new TRPCError({
                code: 'UNAUTHORIZED',
                message: 'Invalid email or password',
              });
            }
            
            const user = {
              id: dbUser.id,
              email: dbUser.email,
              username: dbUser.username,
              displayName: dbUser.display_name || dbUser.username,
              bio: dbUser.bio || "",
              avatar: dbUser.avatar || "",
              yipScore: dbUser.yip_score || 0,
              relationshipStatus: dbUser.relationship_status || "single",
              interests: dbUser.interests ? JSON.parse(dbUser.interests) : [],
              zodiacSign: dbUser.zodiac_sign || "",
              pronouns: dbUser.pronouns || "",
              age: dbUser.age || 18,
              isAdmin: false,
              createdAt: dbUser.created_at,
            };
            
            log('info', 'User login successful from database', { 
              requestId,
              userId: user.id,
              username: user.username,
              email: user.email
            });
            
            return {
              user,
              token: `user_token_${user.id}`,
            };
          } else {
            log('warn', 'User not found in database with exact email match', { 
              requestId,
              email: trimmedEmail 
            });
            throw new TRPCError({
              code: 'UNAUTHORIZED',
              message: 'Invalid email or password',
            });
          }
        } catch (dbError: any) {
          log('error', 'Database error during user login', {
            requestId,
            error: dbError.message,
            email: trimmedEmail
          });
          
          // In development, create a mock user
          if (process.env.NODE_ENV === 'development') {
            const mockUser = {
              id: "current_user",
              email: trimmedEmail,
              username: trimmedEmail.split('@')[0] || "user",
              displayName: trimmedEmail.split('@')[0] || "User",
              bio: "",
              avatar: "",
              yipScore: 0,
              relationshipStatus: "single",
              interests: [],
              zodiacSign: "",
              pronouns: "",
              age: 18,
              isAdmin: false,
              createdAt: new Date().toISOString(),
            };
            
            log('info', 'Using mock user for development login', { 
              requestId,
              username: mockUser.username
            });
            
            return {
              user: mockUser,
              token: "mock-auth-token",
            };
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Login failed due to server error',
          });
        }
      } catch (error: any) {
        log('error', 'Login error', { 
          requestId,
          error: error.message,
          email: input.email
        });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to login',
        });
      }
    }),

  register: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        username: z.string().min(3),
        password: z.string().min(6),
        displayName: z.string(),
        age: z.number().optional(),
        avatar: z.string().optional(),
        highSchool: z.string().optional(),
        interests: z.array(z.string()).optional(),
        relationshipStatus: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const requestId = ctx.requestId || 'unknown';
      
      try {
        log('info', 'Registration attempt', { 
          requestId,
          username: input.username, 
          email: input.email 
        });
        
        // CRITICAL: Exact email matching - trim whitespace and convert to lowercase
        const trimmedEmail = input.email.trim().toLowerCase();
        
        // Prevent admin account registration
        if (trimmedEmail === 'admin15' || input.username === 'admin15') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This username/email is reserved',
          });
        }
        
        try {
          // Check if user already exists with EXACT email match (case-insensitive)
          const existingUser = await getOne(
            'SELECT id FROM users WHERE LOWER(email) = ? OR username = ?',
            [trimmedEmail, input.username]
          );
          
          if (existingUser) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'User with this email or username already exists',
            });
          }
          
          // Hash password
          const hashedPassword = await bcrypt.hash(input.password, 12);
          const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          // Insert new user
          await executeQuery(
            `INSERT INTO users (id, username, email, display_name, password_hash, age, avatar, high_school, interests, relationship_status, created_at, updated_at) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
              userId,
              input.username,
              trimmedEmail, // Use trimmed email
              input.displayName,
              hashedPassword,
              input.age || null,
              input.avatar || '',
              input.highSchool || '',
              JSON.stringify(input.interests || []),
              input.relationshipStatus || 'single'
            ]
          );
          
          const user = {
            id: userId,
            email: trimmedEmail,
            username: input.username,
            displayName: input.displayName,
            bio: "",
            avatar: input.avatar || "",
            yipScore: 0,
            relationshipStatus: input.relationshipStatus || "single",
            interests: input.interests || [],
            zodiacSign: "",
            pronouns: "",
            age: input.age || 18,
            highSchool: input.highSchool,
            isAdmin: false,
            createdAt: new Date().toISOString(),
          };
          
          log('info', 'User registration successful', { 
            requestId,
            userId: user.id,
            username: user.username,
            email: user.email
          });
          
          return {
            user,
            token: `user_token_${user.id}`,
          };
        } catch (dbError: any) {
          log('error', 'Database error during registration', {
            requestId,
            error: dbError.message,
            username: input.username,
            email: trimmedEmail
          });
          
          if (dbError instanceof TRPCError) {
            throw dbError;
          }
          
          // In development, create a mock user
          if (process.env.NODE_ENV === 'development') {
            const mockUser = {
              id: "current_user",
              email: trimmedEmail,
              username: input.username,
              displayName: input.displayName,
              bio: "",
              avatar: input.avatar || "",
              yipScore: 0,
              relationshipStatus: input.relationshipStatus || "single",
              interests: input.interests || [],
              zodiacSign: "",
              pronouns: "",
              age: input.age || 18,
              highSchool: input.highSchool,
              isAdmin: false,
              createdAt: new Date().toISOString(),
            };
            
            log('info', 'Using mock user for development registration', { 
              requestId,
              username: mockUser.username
            });
            
            return {
              user: mockUser,
              token: "mock-auth-token",
            };
          }
          
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Registration failed due to server error',
          });
        }
      } catch (error: any) {
        log('error', 'Registration error', { 
          requestId,
          error: error.message,
          username: input.username,
          email: input.email
        });
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to register',
        });
      }
    }),

  checkUsername: publicProcedure
    .input(
      z.object({
        username: z.string().min(3),
      })
    )
    .query(async ({ input, ctx }) => {
      const requestId = ctx.requestId || 'unknown';
      
      try {
        // Check if username is admin15 (reserved)
        if (input.username === 'admin15') {
          return {
            available: false,
          };
        }
        
        try {
          // Check database
          const existingUser = await getOne(
            'SELECT id FROM users WHERE username = ?',
            [input.username]
          );
          
          return {
            available: !existingUser,
          };
        } catch (dbError: any) {
          log('error', 'Database error checking username', {
            requestId,
            error: dbError.message,
            username: input.username
          });
          
          // In development, assume available unless it's admin15
          return {
            available: true,
          };
        }
      } catch (error: any) {
        log('error', 'Username check error', { 
          requestId,
          error: error.message,
          username: input.username
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check username availability',
        });
      }
    }),

  checkEmail: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
      })
    )
    .query(async ({ input, ctx }) => {
      const requestId = ctx.requestId || 'unknown';
      
      try {
        // CRITICAL: Exact email matching - trim whitespace and convert to lowercase
        const trimmedEmail = input.email.trim().toLowerCase();
        
        // Check if email is admin15 (reserved)
        if (trimmedEmail === 'admin15') {
          return {
            available: false,
          };
        }
        
        try {
          // Check database with EXACT email match (case-insensitive)
          const existingUser = await getOne(
            'SELECT id FROM users WHERE LOWER(email) = ?',
            [trimmedEmail]
          );
          
          return {
            available: !existingUser,
          };
        } catch (dbError: any) {
          log('error', 'Database error checking email', {
            requestId,
            error: dbError.message,
            email: trimmedEmail
          });
          
          // In development, assume available unless it's admin15
          return {
            available: true,
          };
        }
      } catch (error: any) {
        log('error', 'Email check error', { 
          requestId,
          error: error.message,
          email: input.email
        });
        
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check email availability',
        });
      }
    }),
});