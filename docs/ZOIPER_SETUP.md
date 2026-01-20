# Phase 9: Zoiper SIP App Setup

## 📱 Download Zoiper

Download the free Zoiper app:
- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=com.zoiper.android.app)
- **iPhone**: [App Store](https://apps.apple.com/app/zoiper-lite-voip-soft-phone/id438oiper)
- **Windows/Mac**: [Zoiper Website](https://www.zoiper.com/en/voip-softphone/download/current)

---

## ⚙️ Configuration

### Step 1: Open Zoiper and Add Account

1. Open Zoiper → **Settings** → **Accounts**
2. Tap **+** to add account
3. Select **SIP Account**

### Step 2: Enter Your Credentials

| Field | Value |
|-------|-------|
| **Account name** | AI Voice Platform |
| **Domain** | `34.93.33.112` |
| **Username** | `sipapp` |
| **Password** | `xCOYbVuCePvR3+oS` |
| **Auth username** | `sipapp` |

### Step 3: Advanced Settings (if needed)

| Setting | Value |
|---------|-------|
| **Port** | `5060` |
| **Transport** | UDP |
| **STUN** | Disable (NAT handled by server) |

### Step 4: Save and Register

1. Save the account
2. Wait for "Registered" status (green indicator)
3. If it fails, check firewall rules on GCP

---

## 🧪 Test Calls

Once registered, dial these extensions:

| Extension | Description |
|-----------|-------------|
| `600` | Echo test - hear your voice back |
| `100` | AI Agent (when connected) |

---

## 🔧 Troubleshooting

### "Registration Failed"
1. Check GCP firewall allows UDP 5060
2. Verify password is correct
3. Try restarting Asterisk: `sudo systemctl restart asterisk`

### "No Audio"
1. Check GCP firewall allows UDP 10000-20000
2. Ensure RTP ports are open

### Check Asterisk Registration
On your server:
```bash
asterisk -rx 'sip show peers'
```
Should show `sipapp` with status `OK`

---

## ✅ Success Criteria

- [ ] Zoiper shows "Registered"
- [ ] Dial 600 → Hear echo of your voice
- [ ] Ready for AI integration!
