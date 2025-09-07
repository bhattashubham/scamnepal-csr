#!/bin/bash

# ScamNepal CSR Deployment Script
# This script helps prepare the project for deployment

echo "🚀 ScamNepal CSR - Deployment Preparation"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "✅ Project root directory confirmed"

# Build backend
echo "📦 Building backend..."
cd backend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm install
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo ""
echo "🎉 Build completed successfully!"
echo ""
echo "📋 Next Steps:"
echo "1. Push your code to GitHub"
echo "2. Deploy backend to Render:"
echo "   - Create PostgreSQL database"
echo "   - Create Web Service"
echo "   - Set environment variables"
echo "3. Deploy frontend to Vercel:"
echo "   - Import GitHub repository"
echo "   - Set environment variables"
echo "   - Deploy"
echo ""
echo "📖 See DEPLOYMENT_GUIDE.md for detailed instructions"
echo ""
echo "🔗 Useful URLs:"
echo "   - Render: https://render.com"
echo "   - Vercel: https://vercel.com"
echo ""
