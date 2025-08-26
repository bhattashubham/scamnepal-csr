# GitHub Repository Setup Guide

This guide will help you set up your GitHub repository and push the ScamNepal code.

## 🚀 Step 1: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in to your account
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the repository details:
   - **Repository name**: `scamnepal-csr` (or your preferred name)
   - **Description**: `Community Scam Registry - A comprehensive platform for tracking and reporting scams`
   - **Visibility**: Choose Public or Private
   - **Initialize with**: Don't check any boxes (we already have code)
5. Click "Create repository"

## 🔗 Step 2: Add Remote Origin

After creating the repository, GitHub will show you the repository URL. Copy it and run:

```bash
# Replace YOUR_USERNAME with your actual GitHub username
git remote add origin https://github.com/YOUR_USERNAME/scamnepal-csr.git

# Or if you prefer SSH (recommended for frequent pushes):
git remote add origin git@github.com:YOUR_USERNAME/scamnepal-csr.git
```

## 📤 Step 3: Push to GitHub

```bash
# Push the main branch to GitHub
git push -u origin main

# For subsequent pushes, you can simply use:
git push
```

## 🔐 Step 4: Set Up SSH (Optional but Recommended)

If you want to use SSH instead of HTTPS:

1. **Generate SSH key** (if you don't have one):
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   ```

2. **Add SSH key to SSH agent**:
   ```bash
   ssh-add ~/.ssh/id_ed25519
   ```

3. **Copy public key**:
   ```bash
   cat ~/.ssh/id_ed25519.pub
   ```

4. **Add to GitHub**:
   - Go to GitHub Settings → SSH and GPG keys
   - Click "New SSH key"
   - Paste your public key and save

## 🌿 Step 5: Set Up Branch Protection (Recommended)

1. Go to your repository on GitHub
2. Click "Settings" → "Branches"
3. Click "Add rule"
4. Set branch name pattern to `main`
5. Check these options:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
6. Click "Create"

## 📋 Step 6: Verify Setup

```bash
# Check remote configuration
git remote -v

# Check branch status
git branch -a

# Test push (should work without errors)
git push
```

## 🔄 Step 7: Development Workflow

### Making Changes
```bash
# Create a new feature branch
git checkout -b feature/new-feature

# Make your changes
# ... edit files ...

# Add and commit changes
git add .
git commit -m "Add new feature: description"

# Push to GitHub
git push origin feature/new-feature
```

### Creating Pull Requests
1. Go to your repository on GitHub
2. Click "Compare & pull request" for your feature branch
3. Fill in the PR description
4. Request review if needed
5. Merge when approved

## 🚨 Troubleshooting

### Permission Denied Error
```bash
# If you get permission errors, check your remote URL:
git remote -v

# If it's HTTPS, you might need to authenticate:
git remote set-url origin git@github.com:YOUR_USERNAME/scamnepal-csr.git
```

### Branch Protection Issues
```bash
# If you can't push to main due to protection:
git checkout -b feature/your-feature
git push origin feature/your-feature
# Then create a PR on GitHub
```

### Large File Issues
```bash
# If you have large files that shouldn't be in git:
git rm --cached path/to/large/file
git commit -m "Remove large file"
git push
```

## 📚 Additional GitHub Features

### Issues
- Create issues for bugs, feature requests, or questions
- Use labels to categorize issues
- Assign issues to team members

### Projects
- Create project boards for organizing work
- Use Kanban-style boards for workflow management

### Actions
- Set up GitHub Actions for CI/CD
- Automate testing and deployment

### Wiki
- Create documentation wiki for your project
- Keep setup guides and user documentation

## 🎯 Next Steps

After setting up your GitHub repository:

1. **Invite Collaborators** (if working with a team)
2. **Set up GitHub Actions** for automated testing
3. **Create Issues** for planned features
4. **Set up Project Boards** for project management
5. **Configure Branch Protection** for code quality
6. **Set up Dependabot** for dependency updates

## 📞 Need Help?

- GitHub Help: [help.github.com](https://help.github.com)
- Git Documentation: [git-scm.com/doc](https://git-scm.com/doc)
- GitHub Community: [github.community](https://github.community)

---

**Your ScamNepal repository is now ready for collaboration! 🚀**
