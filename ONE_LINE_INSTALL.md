# HoloVitals One-Line Installation

## 🚀 Quick Install (Cloudflare Tunnel - Recommended)

```bash
wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.0.0-beta/holovitals-dev-20251002-124840.tar.gz && tar -xzf holovitals-dev-20251002-124840.tar.gz && cd holovitals-dev-20251002-124840 && chmod +x install-cloudflare.sh && ./install-cloudflare.sh
```

## Alternative Installation Options

### Production (Traditional with Nginx + SSL)
```bash
wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.0.0-beta/holovitals-dev-20251002-124840.tar.gz && tar -xzf holovitals-dev-20251002-124840.tar.gz && cd holovitals-dev-20251002-124840 && chmod +x install-production.sh && ./install-production.sh
```

### Hardened Development
```bash
wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.0.0-beta/holovitals-dev-20251002-124840.tar.gz && tar -xzf holovitals-dev-20251002-124840.tar.gz && cd holovitals-dev-20251002-124840 && chmod +x install-hardened.sh && ./install-hardened.sh
```

### Basic Development
```bash
wget https://github.com/cloudbyday90/HoloVitals/releases/download/v1.0.0-beta/holovitals-dev-20251002-124840.tar.gz && tar -xzf holovitals-dev-20251002-124840.tar.gz && cd holovitals-dev-20251002-124840 && chmod +x install-dev.sh && ./install-dev.sh
```

## What You Need

### For Cloudflare Tunnel (Recommended)
- Ubuntu 20.04/22.04 LTS server
- Domain name
- Cloudflare account (free)
- Cloudflare Tunnel token

### For Production
- Ubuntu 20.04/22.04 LTS server
- Domain name pointing to server
- Ports 80 and 443 open

### For Development
- Ubuntu 20.04/22.04 LTS server
- Port 3000 open (or any custom port)

## Installation Time

- **Download:** 1-2 minutes (257 MB)
- **Installation:** 15-20 minutes
- **Total:** ~20 minutes to live application

## After Installation

### Cloudflare Tunnel
Access via: `https://your-domain.com`

### Production
Access via: `https://your-domain.com`

### Development
Access via: `http://your-server-ip:3000`

## Support

For detailed guides, see:
- `QUICK_START_CARD.md`
- `INSTALLATION_OPTIONS.md`
- `CLOUDFLARE_TUNNEL_GUIDE.md`

## Release Information

- **Version:** v1.0.0-beta
- **Release Date:** October 2, 2025
- **Package Size:** 257 MB
- **Release URL:** https://github.com/cloudbyday90/HoloVitals/releases/tag/v1.0.0-beta