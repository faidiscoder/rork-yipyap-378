# YipYap Development Setup

## Starting the Application

### 1. Start the Backend Server
First, start the backend server in one terminal:

```bash
# Development mode with auto-reload
bash start-backend-dev.sh

# Or run directly:
bun --watch backend/index.ts
```

The backend will be available at:
- **Server**: http://localhost:3000
- **TRPC API**: http://localhost:3000/api/trpc
- **Health Check**: http://localhost:3000/health

### 2. Start the Expo App
In another terminal, start the Expo development server:

```bash
bun start
```

## Important Notes

- **Backend must be running first** - The app will show network errors if the backend is not running
- **Port 3000** - Make sure nothing else is using port 3000
- **Auto-reload** - The backend will automatically restart when you make changes to backend files
- **Authentication** - Users will be redirected to login if not authenticated
- **Admin Access** - Only the user with username "admin15" has admin privileges

## Troubleshooting

### Network Errors
If you see "Network request failed" errors:
1. Make sure the backend server is running on port 3000
2. Check that no firewall is blocking the connection
3. Verify the backend logs show successful startup

### Authentication Issues
If login doesn't work:
1. Check backend logs for authentication errors
2. Verify the database connection is working
3. Make sure user credentials exist in the database

### Database Issues
If you see database errors:
1. Check that MySQL is running
2. Verify database credentials in backend configuration
3. Run database initialization scripts if needed