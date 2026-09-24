#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "========================================="
echo "  Reviewly Single-Service Unified Build  "
echo "========================================="

# 1. Build frontend React static assets
echo "--> Installing frontend dependencies..."
cd frontend
npm install

echo "--> Building frontend with Vite..."
npm run build
cd ..

# 2. Copy built assets into backend/dist for fail-safe resolution
echo "--> Copying built static files to backend/dist..."
mkdir -p backend/dist
cp -r frontend/dist/* backend/dist/

# 3. Install backend Python dependencies
echo "--> Installing backend Python dependencies..."
cd backend
python -m pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo "========================================="
echo "        Build Completed Successfully     "
echo "========================================="
