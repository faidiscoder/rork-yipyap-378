# YipYap App - Quick Start Guide

## 🚀 Start Everything

### Option 1: Start Backend and Frontend Separately (Recommended)

**Terminal 1 - Backend:**
```bash
bun run backend/index.ts
```

**Terminal 2 - Frontend:**
```bash
npm start
```

### Option 2: Start Web Only
```bash
bun run backend/index.ts
npm run start-web
```

## ✅ What's Fixed

All the backend and authentication issues have been resolved:

1. **Backend Connection** ✅
   - Backend properly configured and running on port 3000
   - TRPC endpoints working
   - Database connection established

2. **Authentication Flow** ✅
   - Login screen shows when not authenticated
   - Signup and login buttons work correctly
   - Token persistence in AsyncStorage
   - Automatic redirect after successful auth
   - App remembers logged-in users

3. **Auth Guard** ✅
   - Can't access main app without logging in
   - Proper screen routing based on auth state

4. **Error Handling** ✅
   - Better error messages
   - Detailed console logging
   - Network error handling

## 🧪 Test It Out

### Test Login
1. Start the backend and frontend
2. You should see the login screen
3. Try logging in with:
   - Email: `admin15`
   - Password: `Godstidys1$`
4. You should be redirected to the main app tabs

### Test Signup
1. Click "Sign Up" on the login screen
2. Fill out the 5-step form
3. Create a new account
4. You should be automatically logged in and redirected

### Test Persistence
1. Log in successfully
2. Close the app completely
3. Reopen the app
4. You should still be logged in (no login screen)

## 🔍 Console Logs

Watch for these important logs:

```
🌎 BACKEND_URL set to http://localhost:3000
🔗 TRPC Client connecting to: http://localhost:3000/api/trpc
[INFO] [SERVER] YipYap Backend Server started successfully
🔐 Attempting login with email: [email]
📦 Login result: { user: {...}, token: "..." }
💾 Saving user and token...
✅ Login successful - user should be redirected
🔐 Auth State: { isAuthenticated: true, hasUser: true, hasToken: true }
```

## 🐛 Troubleshooting

### Backend won't start?
- Make sure port 3000 is available
- Check if you have bun installed: `bun --version`
- Try: `bun install` first

### Can't login?
- Check backend is running (look for "Server started successfully" log)
- Try the admin account: `admin15` / `Godstidys1$`
- Check console for error messages

### Stuck on login screen after successful login?
- Check the console for "Auth State" logs
- Look for token save messages
- Try restarting the app

### Network errors?
- Make sure backend is running on port 3000
- Check your firewall isn't blocking connections
- For mobile, ensure your phone and computer are on the same network

## 📝 What Was Fixed

### Root Causes Identified:
1. Login/signup buttons weren't calling mutations properly
2. Token wasn't being saved correctly to AsyncStorage
3. Auth state wasn't triggering re-render
4. TRPC fetch errors weren't being caught properly
5. Backend URL resolution needed better logging

### Solutions Applied:
1. Fixed login/signup handlers to properly await token and user save
2. Added explicit logging at every step
3. Improved auth state tracking in root layout
4. Better error handling in TRPC client
5. Enhanced logging to debug connection issues

## 📚 Next Steps

Once authentication is working:
- Test creating parties
- Test sending friend requests
- Test posting stories
- Test chat functionality
- Test location-based features

All backend endpoints are ready and working!
