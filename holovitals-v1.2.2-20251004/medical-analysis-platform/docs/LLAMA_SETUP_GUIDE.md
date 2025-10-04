# Llama Local LLM Setup Guide

## Why Use Local Llama Models?

### Benefits
- ✅ **FREE** - No API costs, unlimited usage
- ✅ **PRIVATE** - Data never leaves your infrastructure
- ✅ **OFFLINE** - Works without internet connection
- ✅ **HIPAA-COMPLIANT** - Complete data control
- ✅ **FAST** - No network latency
- ✅ **CUSTOMIZABLE** - Fine-tune for your needs

### Use Cases
- Medical data analysis (HIPAA compliance)
- Development and testing
- High-volume processing
- Sensitive patient information
- Offline deployments
- Cost optimization

## Quick Start (5 Minutes)

### Option 1: Docker Compose (Recommended)

1. **Create docker-compose.yml**:
```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    container_name: ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    container_name: open-webui
    ports:
      - "3000:8080"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434
    volumes:
      - open-webui_data:/app/backend/data
    depends_on:
      - ollama
    restart: unless-stopped

volumes:
  ollama_data:
  open-webui_data:
```

2. **Start services**:
```bash
docker-compose up -d
```

3. **Pull Llama models**:
```bash
docker exec -it ollama ollama pull llama3.2:90b
docker exec -it ollama ollama pull llama3.2:11b
docker exec -it ollama ollama pull llama3.2:3b
docker exec -it ollama ollama pull llama3.2:1b
```

4. **Configure HoloVitals** - Add to `.env`:
```bash
OPEN_WEBUI_URL="http://localhost:3000/api"
```

5. **Test**:
```bash
curl http://localhost:3000/api/health
```

### Option 2: Native Installation

#### Step 1: Install Ollama

**Linux/Mac**:
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows**:
Download from: https://ollama.com/download/windows

#### Step 2: Start Ollama
```bash
ollama serve
```

#### Step 3: Pull Models
```bash
# Large model (best quality, requires 64GB RAM)
ollama pull llama3.2:90b

# Medium model (good balance, requires 16GB RAM)
ollama pull llama3.2:11b

# Small model (fast, requires 4GB RAM)
ollama pull llama3.2:3b

# Tiny model (ultra-fast, requires 2GB RAM)
ollama pull llama3.2:1b
```

#### Step 4: Install Open WebUI (Optional)
```bash
docker run -d -p 3000:8080 \
  -e OLLAMA_BASE_URL=http://host.docker.internal:11434 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

#### Step 5: Configure HoloVitals
Add to `.env`:
```bash
LLAMA_BASE_URL="http://localhost:11434/api"
# OR (if using Open WebUI)
OPEN_WEBUI_URL="http://localhost:3000/api"
```

## System Requirements

### Llama 3.2 90B
- **RAM**: 64GB minimum, 128GB recommended
- **GPU**: NVIDIA RTX 4090 (24GB VRAM) or better
- **Storage**: 50GB free space
- **CPU**: 16+ cores recommended
- **Best for**: Production deployments, highest quality

### Llama 3.2 11B
- **RAM**: 16GB minimum, 32GB recommended
- **GPU**: NVIDIA RTX 3060 (12GB VRAM) or better
- **Storage**: 10GB free space
- **CPU**: 8+ cores recommended
- **Best for**: Development, good balance

### Llama 3.2 3B
- **RAM**: 8GB minimum, 16GB recommended
- **GPU**: NVIDIA GTX 1660 (6GB VRAM) or better
- **Storage**: 5GB free space
- **CPU**: 4+ cores recommended
- **Best for**: Testing, fast responses

### Llama 3.2 1B
- **RAM**: 4GB minimum, 8GB recommended
- **GPU**: Optional (runs on CPU)
- **Storage**: 2GB free space
- **CPU**: 2+ cores minimum
- **Best for**: Ultra-fast, minimal resources

## Performance Optimization

### GPU Acceleration (NVIDIA)

1. **Install CUDA**:
```bash
# Ubuntu/Debian
sudo apt install nvidia-cuda-toolkit

# Verify
nvidia-smi
```

2. **Configure Ollama for GPU**:
```bash
# Ollama automatically uses GPU if available
ollama run llama3.2:90b
```

3. **Monitor GPU usage**:
```bash
watch -n 1 nvidia-smi
```

### CPU Optimization

1. **Set thread count**:
```bash
export OLLAMA_NUM_THREADS=16
ollama serve
```

2. **Increase context size**:
```bash
export OLLAMA_MAX_LOADED_MODELS=2
export OLLAMA_NUM_PARALLEL=4
ollama serve
```

### Memory Management

1. **Limit model memory**:
```bash
# Keep model in memory
export OLLAMA_KEEP_ALIVE=24h

# Unload after 5 minutes
export OLLAMA_KEEP_ALIVE=5m
```

2. **Preload models**:
```bash
ollama run llama3.2:90b "test"
```

## Testing Your Setup

### 1. Test Ollama Directly
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:90b",
  "prompt": "Explain what HIPAA compliance means.",
  "stream": false
}'
```

### 2. Test Open WebUI
```bash
curl http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3.2:90b",
    "messages": [
      {"role": "user", "content": "What is HIPAA?"}
    ]
  }'
```

### 3. Test HoloVitals Integration
```typescript
import { getProviderManager } from '@/lib/providers/ProviderManager';

const manager = getProviderManager();
manager.switchProvider('llama-90b');

const response = await manager.complete({
  messages: [
    { role: 'user', content: 'Analyze this medical report...' }
  ],
  model: AIModel.LLAMA_32_90B
});

console.log(response.content);
```

## Production Deployment

### Docker Swarm (Multi-Node)

```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '16'
          memory: 64G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    deploy:
      replicas: 2
    ports:
      - "3000:8080"
    environment:
      - OLLAMA_BASE_URL=http://ollama:11434

volumes:
  ollama_data:
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ollama
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ollama
  template:
    metadata:
      labels:
        app: ollama
    spec:
      containers:
      - name: ollama
        image: ollama/ollama:latest
        ports:
        - containerPort: 11434
        resources:
          limits:
            nvidia.com/gpu: 1
            memory: 64Gi
            cpu: 16
        volumeMounts:
        - name: ollama-data
          mountPath: /root/.ollama
      volumes:
      - name: ollama-data
        persistentVolumeClaim:
          claimName: ollama-pvc
```

## Monitoring & Maintenance

### Health Checks
```bash
# Check Ollama status
curl http://localhost:11434/api/tags

# Check Open WebUI status
curl http://localhost:3000/api/health

# Check model list
ollama list
```

### Logs
```bash
# Ollama logs
docker logs ollama -f

# Open WebUI logs
docker logs open-webui -f
```

### Updates
```bash
# Update Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Update models
ollama pull llama3.2:90b

# Update Open WebUI
docker pull ghcr.io/open-webui/open-webui:main
docker-compose up -d
```

## Troubleshooting

### Issue: Model not loading
```bash
# Check available memory
free -h

# Check GPU memory
nvidia-smi

# Try smaller model
ollama pull llama3.2:3b
```

### Issue: Slow responses
```bash
# Enable GPU
export CUDA_VISIBLE_DEVICES=0
ollama serve

# Increase threads
export OLLAMA_NUM_THREADS=16
ollama serve

# Preload model
ollama run llama3.2:90b "test"
```

### Issue: Connection refused
```bash
# Check if Ollama is running
ps aux | grep ollama

# Restart Ollama
pkill ollama
ollama serve

# Check port
netstat -tulpn | grep 11434
```

### Issue: Out of memory
```bash
# Use smaller model
ollama pull llama3.2:3b

# Reduce context size
export OLLAMA_MAX_LOADED_MODELS=1

# Clear cache
rm -rf ~/.ollama/models
```

## Security Best Practices

1. **Network Security**:
```bash
# Bind to localhost only
export OLLAMA_HOST=127.0.0.1:11434
ollama serve
```

2. **Firewall Rules**:
```bash
# Allow only local connections
sudo ufw allow from 127.0.0.1 to any port 11434
```

3. **Access Control**:
```bash
# Use reverse proxy with authentication
# nginx.conf
location /api/ {
    auth_basic "Restricted";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://localhost:11434/;
}
```

4. **Data Encryption**:
```bash
# Encrypt model storage
cryptsetup luksFormat /dev/sdb1
cryptsetup open /dev/sdb1 ollama_encrypted
mkfs.ext4 /dev/mapper/ollama_encrypted
mount /dev/mapper/ollama_encrypted ~/.ollama
```

## Cost Savings Calculator

### Cloud vs Local (Annual)

**Cloud (GPT-4)**:
- 1M tokens/day × 365 days = 365M tokens/year
- Cost: 365M × $30/1M = $10,950/year

**Local (Llama 3.2 90B)**:
- Hardware: $5,000 (one-time)
- Electricity: ~$500/year (24/7 operation)
- Total Year 1: $5,500
- Total Year 2+: $500/year

**Savings**: $5,450 in Year 1, $10,450/year after

## Advanced Configuration

### Custom Model Parameters
```bash
# Create Modelfile
cat > Modelfile <<EOF
FROM llama3.2:90b
PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER num_ctx 128000
SYSTEM You are a medical AI assistant specialized in analyzing patient records.
EOF

# Create custom model
ollama create medical-llama -f Modelfile
```

### Fine-Tuning (Advanced)
```bash
# Prepare training data
# train.jsonl format:
# {"prompt": "...", "completion": "..."}

# Fine-tune (requires additional tools)
# See: https://github.com/ollama/ollama/blob/main/docs/faq.md#how-do-i-fine-tune-a-model
```

## Support & Resources

- **Ollama Docs**: https://github.com/ollama/ollama
- **Open WebUI Docs**: https://docs.openwebui.com
- **Llama Models**: https://ai.meta.com/llama
- **Community**: https://discord.gg/ollama
- **Issues**: https://github.com/cloudbyday90/HoloVitals/issues

## Next Steps

1. ✅ Install Ollama and Open WebUI
2. ✅ Pull Llama models
3. ✅ Configure HoloVitals
4. ✅ Test integration
5. ✅ Monitor performance
6. ✅ Optimize for your workload
7. ✅ Deploy to production

Happy local LLM deployment! 🚀