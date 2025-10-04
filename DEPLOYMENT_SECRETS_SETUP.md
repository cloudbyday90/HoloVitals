# GitHub Secrets Configuration for Automated Deployment

## Required Secrets

To enable automated deployment, you need to add these secrets to your GitHub repository:

### 1. Navigate to Repository Settings
1. Go to https://github.com/cloudbyday90/HoloVitals
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

### 2. Add Server Connection Secrets

#### SERVER_HOST
- **Name:** `SERVER_HOST`
- **Value:** Your server IP or domain (e.g., `holovitals.net` or `123.45.67.89`)

#### SERVER_USER
- **Name:** `SERVER_USER`
- **Value:** Your SSH username (e.g., `holovitalsdev`)

#### SSH_PRIVATE_KEY
- **Name:** `SSH_PRIVATE_KEY`
- **Value:** Your SSH private key

**To generate SSH key on your server:**
```bash
# On your server
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy  # Copy this entire output
```

Then paste the private key content into the GitHub secret.

#### SERVER_PORT (Optional)
- **Name:** `SERVER_PORT`
- **Value:** SSH port (default: `22`)

### 3. Add Application Secrets

#### DATABASE_URL
- **Name:** `DATABASE_URL`
- **Value:** Your PostgreSQL connection string
- **Example:** `postgresql://holovitals:password@localhost:5432/holovitals`

#### NEXTAUTH_SECRET
- **Name:** `NEXTAUTH_SECRET`
- **Value:** Your NextAuth secret (from server's .env.local)

**To get from server:**
```bash
# On your server
cd ~/HoloVitals
grep NEXTAUTH_SECRET .env.local
```

### 4. Add Notification Secrets (Optional)

#### TELEGRAM_BOT_TOKEN (Optional)
- **Name:** `TELEGRAM_BOT_TOKEN`
- **Value:** Your Telegram bot token
- **How to get:** Message @BotFather on Telegram

#### TELEGRAM_CHAT_ID (Optional)
- **Name:** `TELEGRAM_CHAT_ID`
- **Value:** Your Telegram chat ID
- **How to get:** Message @userinfobot on Telegram

## Verification

After adding all secrets, verify they're set:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. You should see:
   - ✅ SERVER_HOST
   - ✅ SERVER_USER
   - ✅ SSH_PRIVATE_KEY
   - ✅ DATABASE_URL
   - ✅ NEXTAUTH_SECRET
   - ⚪ SERVER_PORT (optional)
   - ⚪ TELEGRAM_BOT_TOKEN (optional)
   - ⚪ TELEGRAM_CHAT_ID (optional)

## Testing the Deployment

Once secrets are configured:

1. **Manual Test:**
   - Go to **Actions** tab
   - Click **Deploy to Production**
   - Click **Run workflow**
   - Select `main` branch
   - Click **Run workflow**

2. **Automatic Test:**
   - Make a small change to the code
   - Push to main branch
   - GitHub Actions will automatically deploy

## Security Notes

- ✅ SSH private key is encrypted in GitHub
- ✅ Secrets are never exposed in logs
- ✅ Only authorized workflows can access secrets
- ✅ Secrets are not passed to forked repositories

## Troubleshooting

### If deployment fails:

1. **Check GitHub Actions logs:**
   - Go to **Actions** tab
   - Click on the failed workflow
   - Review the logs

2. **Verify SSH access:**
   ```bash
   # Test SSH connection
   ssh -i ~/.ssh/github_deploy user@holovitals.net
   ```

3. **Verify secrets are set:**
   - Check Settings → Secrets and variables → Actions
   - Ensure all required secrets are present

4. **Check server logs:**
   ```bash
   # On your server
   pm2 logs holovitals
   ```

## Next Steps

After configuring secrets:
1. Test manual deployment via GitHub Actions
2. Verify application is running
3. Set up monitoring dashboard (Phase 2)