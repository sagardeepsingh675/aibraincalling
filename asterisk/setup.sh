#!/bin/bash
# ===========================================
# Asterisk Quick Setup Script
# AI Voice Calling Platform
# ===========================================

# Generate secure passwords
SIPAPP_PASS=$(openssl rand -base64 12)
AIBRAIN_PASS=$(openssl rand -base64 12)
AMI_PASS=$(openssl rand -base64 12)
ARI_PASS=$(openssl rand -base64 12)

echo "============================================="
echo "  Asterisk AI Voice Platform Setup"
echo "============================================="
echo ""
echo "Generated passwords (SAVE THESE!):"
echo "  SIP App Password:  $SIPAPP_PASS"
echo "  AI Brain Password: $AIBRAIN_PASS"
echo "  AMI Password:      $AMI_PASS"
echo "  ARI Password:      $ARI_PASS"
echo ""

# Create SIP configuration
cat > /etc/asterisk/sip.conf << 'SIPCONF'
; ===========================================
; Asterisk SIP Configuration
; AI Voice Calling Platform
; ===========================================

[general]
context=default
allowguest=no
allowoverlap=no
bindport=5060
bindaddr=0.0.0.0
srvlookup=yes
alwaysauthreject=yes
directmedia=no
nat=force_rport,comedia

; Codecs
disallow=all
allow=ulaw
allow=alaw
allow=g722
allow=opus

; Registration settings
registertimeout=20
registerattempts=10

; ===========================================
; SIP App Extension (Zoiper/Groundwire)
; ===========================================
[sipapp]
type=friend
host=dynamic
SIPCONF

echo "secret=$SIPAPP_PASS" >> /etc/asterisk/sip.conf

cat >> /etc/asterisk/sip.conf << 'SIPCONF2'
context=from-sipapp
canreinvite=no
nat=force_rport,comedia
qualify=yes
disallow=all
allow=opus
allow=ulaw
allow=alaw

; ===========================================
; AI Brain Server Extension
; ===========================================
[aibrain]
type=friend
host=dynamic
SIPCONF2

echo "secret=$AIBRAIN_PASS" >> /etc/asterisk/sip.conf

cat >> /etc/asterisk/sip.conf << 'SIPCONF3'
context=from-internal
canreinvite=no
qualify=yes
SIPCONF3

# Create Extensions (Dialplan)
cat > /etc/asterisk/extensions.conf << 'EXTCONF'
; ===========================================
; Asterisk Dialplan
; AI Voice Calling Platform
; ===========================================

[general]
static=yes
writeprotect=no
clearglobalvars=no

[globals]
AI_BRAIN_HOST=YOUR_AI_BRAIN_IP
AI_BRAIN_PORT=4000

; ===========================================
; Default Context (catch-all)
; ===========================================
[default]
exten => _X.,1,NoOp(Unauthorized call attempt)
 same => n,Hangup()

; ===========================================
; Incoming calls from SIP App
; ===========================================
[from-sipapp]
; Dial internal extensions
exten => 100,1,NoOp(Calling AI Agent)
 same => n,Answer()
 same => n,Wait(1)
 same => n,Playback(hello-world)
 same => n,Stasis(ai-voice-app)
 same => n,Hangup()

; Test echo
exten => 600,1,Answer()
 same => n,Echo()

; ===========================================
; Internal Context (for AI Brain)
; ===========================================
[from-internal]
exten => _X.,1,NoOp(Internal call to ${EXTEN})
 same => n,Dial(SIP/${EXTEN},30)
 same => n,Hangup()

; ===========================================
; Outbound Calls (via SIP Trunk)
; ===========================================
[from-trunk]
exten => _X.,1,NoOp(Outbound call to ${EXTEN})
 same => n,Answer()
 same => n,Wait(1)
 same => n,Stasis(ai-voice-app)
 same => n,Hangup()

; ===========================================
; ARI Stasis Application
; ===========================================
[stasis-app]
exten => start,1,NoOp(Starting AI Voice Session)
 same => n,Answer()
 same => n,Stasis(ai-voice-app)
 same => n,Hangup()
EXTCONF

# Create Manager (AMI) configuration
cat > /etc/asterisk/manager.conf << AMICONF
; ===========================================
; Asterisk Manager Interface (AMI)
; ===========================================

[general]
enabled=yes
port=5038
bindaddr=0.0.0.0

[aibrain]
secret=$AMI_PASS
deny=0.0.0.0/0.0.0.0
permit=0.0.0.0/0.0.0.0
read=system,call,log,verbose,agent,user,config,dtmf,reporting,cdr
write=system,call,agent,user,config,command,reporting,originate
AMICONF

# Create ARI configuration
cat > /etc/asterisk/ari.conf << ARICONF
; ===========================================
; Asterisk REST Interface (ARI)
; ===========================================

[general]
enabled=yes
pretty=yes
allowed_origins=*

[aibrain]
type=user
read_only=no
password=$ARI_PASS
ARICONF

# Create HTTP configuration for ARI
cat > /etc/asterisk/http.conf << 'HTTPCONF'
; ===========================================
; Asterisk HTTP Server
; ===========================================

[general]
enabled=yes
bindaddr=0.0.0.0
bindport=8088
prefix=
enablestatic=no
HTTPCONF

# Create RTP configuration
cat > /etc/asterisk/rtp.conf << 'RTPCONF'
; ===========================================
; RTP Configuration
; ===========================================

[general]
rtpstart=10000
rtpend=20000
rtpchecksums=no
strictrtp=yes
icesupport=yes
stunaddr=stun.l.google.com:19302
RTPCONF

# Restart Asterisk
echo ""
echo "Restarting Asterisk..."
systemctl restart asterisk

# Wait for restart
sleep 3

# Show status
echo ""
echo "============================================="
echo "  Setup Complete!"
echo "============================================="
echo ""
echo "SAVE THESE CREDENTIALS:"
echo ""
echo "SIP App (Zoiper) Settings:"
echo "  Username: sipapp"
echo "  Password: $SIPAPP_PASS"
echo "  Server: YOUR_SERVER_IP"
echo "  Port: 5060"
echo ""
echo "AI Brain Settings (add to .env):"
echo "  ASTERISK_HOST=YOUR_SERVER_IP"
echo "  ASTERISK_ARI_PORT=8088"
echo "  ASTERISK_ARI_USER=aibrain"
echo "  ASTERISK_ARI_PASSWORD=$ARI_PASS"
echo "  ASTERISK_AMI_PORT=5038"
echo "  ASTERISK_AMI_USER=aibrain"
echo "  ASTERISK_AMI_PASSWORD=$AMI_PASS"
echo ""
echo "Test command: asterisk -rx 'sip show peers'"
echo "============================================="
