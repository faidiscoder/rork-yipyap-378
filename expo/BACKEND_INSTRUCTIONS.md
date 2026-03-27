# Backend Setup Instructions

## Quick Start

### 1. Start the Backend Server

In a new terminal, run:

```bash
bun run backend/index.ts
```

This will start the backend server on **http://localhost:3000**

The backend provides:
- TRPC API at `http://localhost:3000/api/trpc`
- Health check at `http://localhost:3000/health`
- All authentication and data endpoints

### 2. Start the Frontend App

In another terminal, run:

```bash
npm start
```

or for web only:

```bash
npm run start-web
```

## Testing the App

### Test Accounts

**Admin Account:**
- Email: `admin15`
- Password: `Godstidys1$`

**Create New User:**
- Use the signup flow in the app
- Email must be a valid format (e.g., `user@example.com`)
- Password must be at least 8 characters with uppercase, lowercase, and numbers

## How It Works

1. **Authentication Flow:**
   - When you open the app without being logged in, you'll see the login screen
   - After successful login/signup, the app stores your token in AsyncStorage
   - The app automatically redirects you to the main tabs
   - Your session persists across app restarts

2. **Backend Connection:**
   - Mobile: Connects to your computer's local IP on port 3000
   - Web: Connects to http://localhost:3000
   - The app automatically detects and connects to the right URL

3. **Database:**
   - Connected to MySQL database at 18.221.219.126
   - All user data, chats, parties, etc. are stored in the database

## Troubleshooting

### Backend not connecting?

1. Make sure the backend is running:
   ```bash
   bun run backend/index.ts
   ```

2. Check the console for the backend URL:
   - You should see: `[INFO] [SERVER] YipYap Backend Server started successfully | {"port":3000}`

3. Test the backend directly:
   ```bash
   curl http://localhost:3000/health
   ```

### Authentication not working?

1. Clear the app storage:
   - Close the app completely
   - Restart both backend and frontend
   - Try logging in again

2. Check console logs:
   - Look for "🔐 Attempting login" messages
   - Check for "✅ Login successful" or error messages

### Can't see the app after login?

1. Check the console for "🔐 Auth State" logs
2. Verify the token is saved (look for "💾 Saving user and token" message)
3. Make sure `isAuthenticated` is `true` in the auth state logs

## Console Logs to Watch

- `🌎 BACKEND_URL set to` - Shows where the app is connecting
- `🔗 TRPC Client connecting to` - Confirms TRPC setup
- `🔐 Attempting login` - User trying to log in
- `📦 Login result` - Shows the response from backend
- `💾 Saving user and token` - Token being stored
- `✅ Login successful` - Login complete
- `🔐 Auth State` - Current authentication status

## Features Working

✅ User Registration
✅ User Login
✅ Session Persistence
✅ Auth Guard (login required)
✅ Backend API
✅ Database Connection
✅ User Profile
✅ Parties, Chats, Stories endpoints ready

## Need Help?

Check the console logs - they contain detailed information about what's happening at each step!
