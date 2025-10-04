# HoloVitals Dev Environment Deployment

## Prerequisites
- Ubuntu 20.04 LTS or newer (or Debian-based system)
- At least 2GB RAM
- At least 10GB free disk space
- SSH access to your server

## Transfer Package to Server

### Option 1: Using SCP
```bash
scp holovitals-dev-*.tar.gz your-username@your-server-ip:/home/your-username/
```

### Option 2: Using SFTP
```bash
sftp your-username@your-server-ip
put holovitals-dev-*.tar.gz
exit
```

### Option 3: Using rsync
```bash
rsync -avz holovitals-dev-*.tar.gz your-username@your-server-ip:/home/your-username/
```

## Installation Steps

1. **SSH into your server:**
```bash
ssh your-username@your-server-ip
```

2. **Extract the package:**
```bash
tar -xzf holovitals-dev-*.tar.gz
cd holovitals-dev-*
```

3. **Run the installation script:**
```bash
chmod +x install-dev.sh
./install-dev.sh
```

4. **Save the credentials** displayed at the end of installation

5. **Start the development server:**
```bash
npm run dev
```

6. **Access the application:**
- If on the server: http://localhost:3000
- If remote: Set up SSH tunnel or configure firewall

## SSH Tunnel (for remote access)

If you want to access the app from your local machine:

```bash
ssh -L 3000:localhost:3000 your-username@your-server-ip
```

Then open http://localhost:3000 in your local browser.

## Firewall Configuration (optional)

To allow direct access on port 3000:

```bash
sudo ufw allow 3000/tcp
sudo ufw reload
```

Then access via: http://your-server-ip:3000

## Management Commands

### Start development server:
```bash
npm run dev
```

### View logs:
```bash
npm run dev | tee app.log
```

### Stop server:
Press `Ctrl+C` in the terminal

### Restart services:
```bash
sudo systemctl restart postgresql
sudo systemctl restart redis-server
```

### Check service status:
```bash
sudo systemctl status postgresql
sudo systemctl status redis-server
```

### View database:
```bash
psql -U holovitals -d holovitals
```

## Troubleshooting

### Port already in use:
```bash
# Find process using port 3000
sudo lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database connection issues:
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Redis connection issues:
```bash
# Check Redis is running
sudo systemctl status redis-server

# Restart Redis
sudo systemctl restart redis-server
```

## Environment Variables

Edit `.env.local` to add API keys:

```bash
nano .env.local
```

Add your keys:
- `OPENAI_API_KEY` - For AI features
- `STRIPE_SECRET_KEY` - For payment features
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - For payment features

Then restart the server.

## Updating the Application

1. Transfer new package to server
2. Extract to new directory
3. Copy `.env.local` from old directory
4. Run `npm install` and `npx prisma migrate deploy`
5. Restart server

## Support

For issues, check:
- Application logs: `app.log`
- PostgreSQL logs: `sudo journalctl -u postgresql`
- Redis logs: `sudo journalctl -u redis-server`
- System logs: `sudo journalctl -xe`
