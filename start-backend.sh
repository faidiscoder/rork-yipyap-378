#!/bin/bash

echo "🚀 Starting YipYap Backend Server..."
echo "📍 Server will be available at: http://localhost:3000"
echo "🔗 TRPC endpoint: http://localhost:3000/api/trpc"
echo ""

# Start the backend server with bun
bun run backend/index.ts