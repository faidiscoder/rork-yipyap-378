#!/bin/bash

echo "🚀 Starting YipYap Backend Server in Development Mode..."
echo "📍 Server will be available at: http://localhost:3000"
echo "🔗 TRPC endpoint: http://localhost:3000/api/trpc"
echo "🔄 Auto-reloading enabled"
echo ""

# Start the backend server with bun in watch mode
bun --watch backend/index.ts