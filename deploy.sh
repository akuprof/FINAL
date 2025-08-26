#!/bin/bash

# 🚀 PLS Travels Deployment Script

echo "🚀 Starting PLS Travels Deployment..."

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Commit and push changes
    echo "📝 Committing changes..."
    git add .
    git commit -m "Deploy: $(date)"
    git push
    
    echo "🚀 Deployment triggered!"
    echo "📊 Check deployment status at:"
    echo "   Frontend: https://vercel.com/dashboard"
    echo "   Backend: https://dashboard.render.com"
    
else
    echo "❌ Build failed! Please check the errors above."
    exit 1
fi
