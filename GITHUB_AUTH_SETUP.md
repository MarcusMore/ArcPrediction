# GitHub Authentication Setup

GitHub no longer accepts passwords for Git operations. You need to use one of these methods:

## Option 1: Personal Access Token (PAT) - Recommended

### Step 1: Create a Personal Access Token

1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Direct link: https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Give it a name: "Forsightt Project"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `workflow` (if you plan to use GitHub Actions)
5. Click "Generate token"
6. **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Use Token for Authentication

When pushing, use the token as your password:

```bash
# When prompted for username: enter your GitHub username
# When prompted for password: paste your Personal Access Token (not your GitHub password)
git push -u origin main
```

### Step 3: Store Credentials (Optional)

To avoid entering the token every time:

**Windows (Git Credential Manager):**
```bash
# Git will prompt you once, then store it
git config --global credential.helper wincred
```

**Or use Git Credential Manager:**
```bash
git config --global credential.helper manager-core
```

## Option 2: SSH Authentication

### Step 1: Generate SSH Key (if you don't have one)

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# Press Enter to accept default location
# Optionally set a passphrase for extra security
```

### Step 2: Add SSH Key to GitHub

1. Copy your public key:
```bash
# Windows PowerShell
cat ~/.ssh/id_ed25519.pub | clip

# Or manually open: C:\Users\YourUsername\.ssh\id_ed25519.pub
```

2. Go to GitHub → Settings → SSH and GPG keys
   - Direct link: https://github.com/settings/keys
3. Click "New SSH key"
4. Paste your public key
5. Click "Add SSH key"

### Step 3: Change Remote to SSH

```bash
# Remove HTTPS remote
git remote remove origin

# Add SSH remote
git remote add origin git@github.com:MarcusMore/ArcPrediction.git

# Test connection
ssh -T git@github.com

# Push
git push -u origin main
```

## Option 3: GitHub CLI (gh)

### Install GitHub CLI

```bash
# Install via winget (Windows)
winget install --id GitHub.cli

# Or download from: https://cli.github.com/
```

### Authenticate

```bash
# Login
gh auth login

# Follow the prompts to authenticate
```

### Push

```bash
git push -u origin main
```

## Quick Fix for Current Error

If you want to use PAT right now:

```bash
# Update remote URL (if needed)
git remote set-url origin https://github.com/MarcusMore/ArcPrediction.git

# Push (will prompt for credentials)
# Username: MarcusMore
# Password: [paste your Personal Access Token here]
git push -u origin main
```

## Recommended: Use SSH

SSH is more secure and convenient once set up:

```bash
# 1. Check if you have SSH key
ls ~/.ssh/id_ed25519.pub

# 2. If not, generate one
ssh-keygen -t ed25519 -C "your_email@example.com"

# 3. Copy public key
cat ~/.ssh/id_ed25519.pub

# 4. Add to GitHub (Settings → SSH and GPG keys)

# 5. Change remote to SSH
git remote set-url origin git@github.com:MarcusMore/ArcPrediction.git

# 6. Test and push
ssh -T git@github.com
git push -u origin main
```

---

**Need help?** Choose the method that works best for you:
- **PAT**: Quick setup, works immediately
- **SSH**: More secure, no password prompts after setup
- **GitHub CLI**: Good for GitHub-specific workflows



