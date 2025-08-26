#!/bin/bash

# ScamNepal GitHub Setup Script
# This script will help you set up your GitHub repository

echo "🚀 ScamNepal GitHub Setup Script"
echo "=================================="
echo ""

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install Git first."
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Please run this script from the Scamnepal project root directory."
    exit 1
fi

echo "✅ Project structure verified"
echo ""

# Get GitHub username
read -p "Enter your GitHub username: " GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ GitHub username is required"
    exit 1
fi

echo ""
echo "📋 Repository Setup Instructions:"
echo "1. Go to https://github.com/new"
echo "2. Repository name: scamnepal-csr"
echo "3. Description: Community Scam Registry - A comprehensive platform for tracking and reporting scams"
echo "4. Choose Public or Private"
echo "5. DO NOT initialize with README, .gitignore, or license (we already have these)"
echo "6. Click 'Create repository'"
echo ""

read -p "Have you created the repository? (y/n): " REPO_CREATED

if [[ $REPO_CREATED =~ ^[Yy]$ ]]; then
    echo ""
    echo "🔗 Setting up remote origin..."
    
    # Remove existing remote if any
    git remote remove origin 2>/dev/null
    
    # Add new remote
    git remote add origin "https://github.com/$GITHUB_USERNAME/scamnepal-csr.git"
    
    if [ $? -eq 0 ]; then
        echo "✅ Remote origin set successfully"
        echo ""
        echo "📤 Pushing code to GitHub..."
        
        # Push to GitHub
        git push -u origin main
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "🎉 SUCCESS! Your ScamNepal project is now on GitHub!"
            echo ""
            echo "🔗 Repository URL: https://github.com/$GITHUB_USERNAME/scamnepal-csr"
            echo ""
            echo "📋 Next steps:"
            echo "1. Visit your repository on GitHub"
            echo "2. Verify all files are uploaded correctly"
            echo "3. Check that README.md displays properly"
            echo "4. Set up branch protection (optional but recommended)"
            echo "5. Invite collaborators if needed"
            echo ""
            echo "🚀 Happy coding!"
        else
            echo "❌ Failed to push to GitHub. Please check your credentials and try again."
            echo "You may need to authenticate with GitHub first."
        fi
    else
        echo "❌ Failed to set remote origin"
        exit 1
    fi
else
    echo ""
    echo "⏳ Please create the repository first, then run this script again."
    echo "Repository URL: https://github.com/new"
    exit 0
fi
