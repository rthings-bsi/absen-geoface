#!/bin/bash

# 🧹 Cleanup Debug Files (Run after testing)

echo "Removing debug files..."

# Remove test script
if [ -f "test-admin-auth.js" ]; then
  rm test-admin-auth.js
  echo "✅ Deleted: test-admin-auth.js"
fi

# Remove debug API endpoint
if [ -f "src/app/api/debug/session/route.ts" ]; then
  rm src/app/api/debug/session/route.ts
  echo "✅ Deleted: src/app/api/debug/session/route.ts"
fi

# Remove this script itself
if [ -f "CLEANUP.sh" ]; then
  echo "✅ Cleanup complete!"
fi
