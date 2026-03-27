# 🚀 YipYap Quick Start

## Start the App (2 Terminals)

### Terminal 1: Backend
```bash
bun run backend/index.ts
```
Wait for: `✅ YipYap Backend Server started successfully`

### Terminal 2: Frontend
```bash
npm start
```
or for web only:
```bash
npm run start-web
```

## ✅ Expected Behavior

1. **App Opens** → You see the LOGIN screen (not the main app)
2. **Enter Credentials** → Login with test account or create new one
3. **Submit** → Loading spinner appears
4. **Success** → Automatically redirected to main app tabs
5. **Restart App** → Still logged in (no login screen)

## 🧪 Test Accounts

**Admin:**
- Email: `admin15`
- Password: `Godstidys1$`

**New User:** Click "Sign Up" and fill the form

## 🔍 Verify It's Working

Check your console for these logs:

✅ `🌎 BACKEND_URL set to http://localhost:3000`
✅ `🔗 TRPC Client connecting to: http://localhost:3000/api/trpc`
✅ `[INFO] [SERVER] YipYap Backend Server started successfully`
✅ `🔐 Attempting login with email: ...`
✅ `📦 Login result: { user: {...}, token: "..." }`
✅ `✅ Login successful - user should be redirected`
✅ `🔐 Auth State: { isAuthenticated: true, hasUser: true, hasToken: true }`

## 🐛 Something Wrong?

### Backend not starting?
```bash
# Install dependencies
bun install

# Try starting again
bun run backend/index.ts
```

### Can't login?
- Make sure backend shows "Server started successfully"
- Check email/password are correct
- Look for error messages in red box
- Check console for detailed error logs

### Still see login screen after login?
- Look for "💾 Saving user and token..." in console
- Check "Auth State" shows `isAuthenticated: true`
- Try clearing app storage and restarting

## 📚 More Info

- `FIXES_APPLIED.md` - Detailed list of all fixes
- `BACKEND_INSTRUCTIONS.md` - Backend setup details
- `START_HERE.md` - Complete guide

## ✨ All Fixed!

✅ Backend connects properly
✅ Login/signup buttons work
✅ Authentication guard active
✅ Session persists across restarts
✅ Proper error handling
✅ Detailed logging everywhere

Happy coding! 🎉
