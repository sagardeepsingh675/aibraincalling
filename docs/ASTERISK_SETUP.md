# Phase 8: Asterisk Cloud Server Setup Guide

## 🖥️ Server Requirements

### Recommended Cloud Provider: Google Cloud (GCP)
Since you're already using GCP for Gemini AI, it makes sense to use the same platform.

### Server Specifications
| Resource | Minimum | Recommended |
|----------|---------|-------------|
| **vCPUs** | 2 | 4 |
| **RAM** | 4 GB | 8 GB |
| **Storage** | 20 GB SSD | 50 GB SSD |
| **OS** | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |
| **Region** | asia-south1 (Mumbai) | asia-south1 (Mumbai) |

### Estimated Cost
- **e2-medium** (2 vCPU, 4GB RAM): ~$25-30/month
- **e2-standard-4** (4 vCPU, 8GB RAM): ~$50-60/month

---

## 📋 Step-by-Step Setup

### Step 1: Create GCP VM Instance

1. Go to [GCP Console](https://console.cloud.google.com/compute/instances)
2. Click **"Create Instance"**
3. Configure:
   - **Name**: `asterisk-server`
   - **Region**: `asia-south1` (Mumbai)
   - **Machine type**: `e2-medium` (start small, upgrade later)
   - **Boot disk**: Ubuntu 22.04 LTS, 30GB SSD
   - **Firewall**: ✅ Allow HTTP, ✅ Allow HTTPS

4. Click **"Create"**

### Step 2: Configure Firewall Rules

Go to VPC Network → Firewall → Create Firewall Rule:

| Rule Name | Direction | Ports | Source |
|-----------|-----------|-------|--------|
| `allow-sip` | Ingress | UDP 5060 | 0.0.0.0/0 |
| `allow-rtp` | Ingress | UDP 10000-20000 | 0.0.0.0/0 |
| `allow-ari` | Ingress | TCP 8088-8089 | Your IP only |
| `allow-ami` | Ingress | TCP 5038 | Your IP only |

### Step 3: SSH into Server

```bash
# Use GCP Console SSH or:
gcloud compute ssh asterisk-server --zone=asia-south1-a
```

### Step 4: Install Asterisk

Run these commands on the server:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y build-essential wget libssl-dev libncurses5-dev \
    libnewt-dev libxml2-dev linux-headers-$(uname -r) libsqlite3-dev \
    uuid-dev libjansson-dev libsrtp2-dev

# Download Asterisk 20 LTS
cd /usr/src
sudo wget https://downloads.asterisk.org/pub/telephony/asterisk/asterisk-20-current.tar.gz
sudo tar xvf asterisk-20-current.tar.gz
cd asterisk-20.*

# Configure and compile
sudo contrib/scripts/get_mp3_source.sh
sudo contrib/scripts/install_prereq install
sudo ./configure --with-pjproject-bundled --with-jansson-bundled
sudo make menuselect.makeopts  # Select modules
    sudo make -j$(nproc)
sudo make install
sudo make samples
sudo make config

# Start Asterisk
sudo systemctl enable asterisk
sudo systemctl start asterisk
```

### Step 5: Verify Installation

```bash
sudo asterisk -rvvv
# Should show Asterisk CLI
# Type 'core show version' to verify
```

---

## 🔧 Configuration Files

After installation, copy the config files from this project:

```bash
# On the Asterisk server, create config directory
sudo mkdir -p /etc/asterisk/backup
sudo cp /etc/asterisk/*.conf /etc/asterisk/backup/

# Copy our configs (you'll need to transfer these files)
# sip.conf, extensions.conf, manager.conf, ari.conf, http.conf, rtp.conf
```

### Config File Locations
- `/etc/asterisk/sip.conf` - SIP endpoints
- `/etc/asterisk/extensions.conf` - Dial plan
- `/etc/asterisk/manager.conf` - AMI access
- `/etc/asterisk/ari.conf` - REST API
- `/etc/asterisk/http.conf` - HTTP server for ARI
- `/etc/asterisk/rtp.conf` - RTP ports

---

## 🔒 Security Checklist

- [ ] Change default passwords in config files
- [ ] Restrict AMI/ARI access to specific IPs
- [ ] Enable fail2ban for SIP
- [ ] Use strong passwords for SIP accounts
- [ ] Consider using TLS for SIP (port 5061)

---

## 📞 SIP Trunk Options (for making calls)

To make real phone calls, you need a SIP trunk provider:

### Recommended Providers for India
| Provider | Cost | Notes |
|----------|------|-------|
| **Exotel** | Pay-per-call | Popular in India, good API |
| **Plivo** | $0.0065/min | Global, good for testing |
| **Twilio** | $0.014/min | Most features, higher cost |
| **Vonage** | $0.01/min | Good international rates |

### For Testing (Free)
- **Zoiper** - Free softphone app (iOS/Android/PC)
- Can call between Zoiper clients for free testing

---

## 🚀 Next Steps After Server Setup

1. SSH into your server
2. Run the installation commands
3. Copy config files from `e:\dex\calling\asterisk\config\`
4. Update passwords in config files
5. Restart Asterisk: `sudo systemctl restart asterisk`
6. Test with Zoiper app

Let me know when your server is ready and I'll help with the next configuration steps!
