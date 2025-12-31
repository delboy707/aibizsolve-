# QEP AISolve — Idiot's Guide to Claude Code Setup

> Step-by-step instructions for complete beginners. Follow exactly.

---

## What You Need Before Starting

- [x] Supabase project + API keys (you have this)
- [x] Anthropic API key
- [x] OpenAI API key
- [ ] GitHub account
- [ ] Vercel account (free tier is fine)
- [ ] Claude Code installed

---

## STEP 1: Install Claude Code

### On Mac

Open Terminal and run:

```bash
npm install -g @anthropic-ai/claude-code
```

Or if you don't have npm:

```bash
# Install Homebrew first (if you don't have it)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js (includes npm)
brew install node

# Now install Claude Code
npm install -g @anthropic-ai/claude-code
```

### On Windows

1. Install Node.js from https://nodejs.org (LTS version)
2. Open Command Prompt or PowerShell
3. Run:
```bash
npm install -g @anthropic-ai/claude-code
```

### Verify Installation

```bash
claude --version
```

You should see a version number.

---

## STEP 2: Create Your Project Folder

### On Mac (Terminal)

```bash
# Go to where you want your projects (e.g., Documents)
cd ~/Documents

# Create the project folder
mkdir qep-aisolve

# Go into it
cd qep-aisolve

# Create subfolders
mkdir -p skills/references
mkdir -p scripts
mkdir -p workflows
```

### On Windows (Command Prompt)

```bash
# Go to where you want your projects
cd C:\Users\YourName\Documents

# Create the project folder
mkdir qep-aisolve

# Go into it
cd qep-aisolve

# Create subfolders
mkdir skills
mkdir skills\references
mkdir scripts
mkdir workflows
```

---

## STEP 3: Add Your Files to the Project Folder

After downloading the files I gave you, your folder should look like this:

```
qep-aisolve/
├── CLAUDE.md                    ← Main instruction file (rename from v3)
├── QUICKSTART.md                ← Quick reference
├── .env.local                   ← Your API keys (create this)
├── skills/
│   ├── SKILL.md                 ← Master skill file
│   └── references/
│       ├── problem-classification.md
│       ├── workflow-taxonomy.md
│       ├── cross-domain-synergy.md
│       └── document-structure.md
├── scripts/
│   ├── pipeline.ts
│   ├── parse-workflows.ts
│   ├── generate-embeddings.ts
│   ├── seed-workflows.ts
│   ├── verify-data.ts
│   ├── types.ts
│   └── package.json
└── workflows/                   ← Your .docx files go here
    ├── marketing/
    │   ├── MARKETING_PROMPTS_1.docx
    │   ├── MARKETING_PROMPTS_2.docx
    │   └── ...
    ├── strategy/
    ├── sales/
    ├── operations/
    ├── innovation/
    ├── hr/
    └── finance/
```

### How to Move Files

**From Downloads to Project (Mac):**
```bash
# Assuming files are in Downloads
mv ~/Downloads/AI-Solve-CLAUDE-Implementation-Guide-v3.md ~/Documents/qep-aisolve/CLAUDE.md
mv ~/Downloads/AI-Solve-QUICKSTART-Reference-v3.md ~/Documents/qep-aisolve/QUICKSTART.md
```

**Or just use Finder/File Explorer** to drag and drop files into the folder.

---

## STEP 4: Create Your .env.local File

This file stores your secret API keys. **Never commit this to GitHub.**

### Create the file

**Mac:**
```bash
cd ~/Documents/qep-aisolve
nano .env.local
```

**Or use any text editor** (VS Code, TextEdit, Notepad).

### Add your keys

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# Anthropic (Claude)
ANTHROPIC_API_KEY=sk-ant-...your-key...

# OpenAI (for embeddings)
OPENAI_API_KEY=sk-...your-key...

# Stripe (add later in Sprint 6)
# STRIPE_SECRET_KEY=sk_live_...
# STRIPE_WEBHOOK_SECRET=whsec_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# App URL (update when you deploy)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Save and close.

---

## STEP 5: Initialize Git Repository

```bash
cd ~/Documents/qep-aisolve

# Initialize git
git init

# Create .gitignore to protect secrets
echo ".env.local" >> .gitignore
echo ".env" >> .gitignore
echo "node_modules/" >> .gitignore
echo ".next/" >> .gitignore

# Add all files
git add .

# First commit
git commit -m "Initial project setup with specs and skills"
```

---

## STEP 6: Create GitHub Repository

### Option A: Using GitHub Website

1. Go to https://github.com
2. Click the **+** icon → **New repository**
3. Name: `qep-aisolve`
4. Make it **Private** (recommended)
5. Do NOT initialize with README (you already have files)
6. Click **Create repository**
7. Copy the commands shown and run them:

```bash
cd ~/Documents/qep-aisolve
git remote add origin https://github.com/YOUR-USERNAME/qep-aisolve.git
git branch -M main
git push -u origin main
```

### Option B: Using GitHub CLI

```bash
# Install GitHub CLI first
brew install gh  # Mac
# or download from https://cli.github.com

# Login
gh auth login

# Create repo and push
cd ~/Documents/qep-aisolve
gh repo create qep-aisolve --private --source=. --push
```

---

## STEP 7: Connect Vercel to GitHub

1. Go to https://vercel.com
2. Sign up / Log in with GitHub
3. Click **Add New...** → **Project**
4. Select your `qep-aisolve` repository
5. Click **Import**
6. **Framework Preset**: Next.js (will auto-detect later)
7. **Environment Variables**: Add all your keys from .env.local
8. Click **Deploy**

**Note**: The first deploy will fail because we haven't built the app yet. That's OK!

---

## STEP 8: Start Claude Code

Now the fun part!

```bash
# Make sure you're in the project folder
cd ~/Documents/qep-aisolve

# Start Claude Code
claude
```

You'll see a prompt like:
```
claude>
```

---

## STEP 9: Your First Message to Claude Code

Copy and paste this exactly:

```
Read the CLAUDE.md file in this directory - it's the complete project specification for QEP AISolve. Also read the skills/ folder which contains the AI methodology.

We're building QEP AISolve, a strategic consulting AI platform. 

Before we start coding, confirm you understand:
1. The tech stack (Next.js, Supabase, Claude API)
2. The Alchemy Layer architecture
3. The PWYW pricing model
4. That frameworks must remain invisible to users

Then let's start Sprint 1: Foundation.
```

Claude Code will read your files and start building!

---

## STEP 10: How Claude Code Works

### Basic Commands

| What You Type | What Happens |
|---------------|--------------|
| Your request in plain English | Claude writes code |
| `/help` | Show help |
| `/clear` | Clear conversation |
| `exit` or Ctrl+C | Exit Claude Code |

### Example Conversation

```
claude> Read CLAUDE.md and start Sprint 1

[Claude reads the file and responds...]

Claude: I've read the spec. Let me start by initializing the Next.js project 
with TypeScript and Tailwind CSS...

[Claude creates files, you see them appear in your folder]

Claude: I've created the initial project structure. Should I continue with 
setting up Supabase authentication?

claude> Yes, continue

[Claude keeps building...]
```

### Watching Claude Work

While Claude Code runs, you can:
- Open the folder in VS Code to watch files appear
- See the terminal output as Claude runs commands
- Interrupt with Ctrl+C if something goes wrong

---

## STEP 11: After Claude Code Creates Files

Every so often, commit your changes:

```bash
# In a new terminal window (keep Claude Code running)
cd ~/Documents/qep-aisolve

git add .
git commit -m "Sprint 1: Foundation setup complete"
git push
```

Vercel will automatically deploy when you push!

---

## Common Issues & Fixes

### "claude: command not found"

```bash
# Reinstall
npm install -g @anthropic-ai/claude-code

# Or check your PATH
echo $PATH
```

### "Permission denied"

```bash
# Mac/Linux
sudo npm install -g @anthropic-ai/claude-code
```

### Claude Code Can't Find Files

Make sure you're in the right directory:
```bash
pwd  # Shows current directory
ls   # Lists files - you should see CLAUDE.md
```

### Git Push Rejected

```bash
git pull origin main --rebase
git push
```

### Vercel Build Fails

Check the build logs in Vercel dashboard. Common fixes:
- Make sure all environment variables are set
- Check for TypeScript errors

---

## Quick Reference: Terminal Commands

| Command | What It Does |
|---------|--------------|
| `cd folder` | Go into folder |
| `cd ..` | Go up one folder |
| `ls` | List files (Mac/Linux) |
| `dir` | List files (Windows) |
| `pwd` | Show current location |
| `mkdir name` | Create folder |
| `touch file` | Create empty file (Mac/Linux) |
| `code .` | Open VS Code here |

---

## Your Folder Structure After Setup

```
qep-aisolve/
├── CLAUDE.md              ← ✅ Project spec
├── QUICKSTART.md          ← ✅ Quick reference  
├── .env.local             ← ✅ Your API keys (SECRET!)
├── .gitignore             ← ✅ Protects secrets
├── skills/                ← ✅ AI methodology
│   ├── SKILL.md
│   └── references/
│       └── *.md
├── scripts/               ← ✅ Content pipeline
│   └── *.ts
└── workflows/             ← ✅ Your .docx files
    ├── marketing/
    ├── strategy/
    └── ...
```

---

## Summary: The 5-Minute Version

```bash
# 1. Install Claude Code
npm install -g @anthropic-ai/claude-code

# 2. Create project folder and add your files
mkdir qep-aisolve
cd qep-aisolve
# [Add CLAUDE.md, skills/, scripts/, .env.local]

# 3. Initialize git
git init
echo ".env.local" >> .gitignore
git add .
git commit -m "Initial setup"

# 4. Create GitHub repo and push
gh repo create qep-aisolve --private --source=. --push

# 5. Connect Vercel to GitHub (via website)

# 6. Start building!
claude
> Read CLAUDE.md and start Sprint 1
```

---

## Next Steps

1. ✅ Follow this guide to set up your environment
2. ✅ Run the Content Pipeline to load your workflows
3. ✅ Start Claude Code and begin Sprint 1
4. 🔄 Commit and push regularly
5. 🔄 Check Vercel for deployments

Good luck! 🚀
