# AI Voice Calling Platform

A complete AI-powered voice calling platform with Hindi-English support, self-hosted SIP integration, and real-time conversation capabilities.

## 🏗️ Architecture

```
User → Website → Supabase → AI Brain → Asterisk → SIP App → SIM → User
```

## 📁 Project Structure

```
ai-voice-calling-platform/
├── apps/
│   ├── website/          # Lead capture website (React + Vite)
│   └── admin/            # Admin dashboard (React + Vite)
├── services/
│   └── ai-brain/         # AI orchestration server (Node.js)
├── asterisk/             # Asterisk SIP server configuration
├── database/             # Supabase migrations & functions
├── infrastructure/       # Docker, Nginx, Terraform configs
└── docs/                 # Documentation
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- Google Cloud account with Vertex AI enabled
- Supabase project
- ElevenLabs API key

### Development Setup

```bash
# Clone and install
git clone https://github.com/yourusername/ai-voice-calling-platform.git
cd ai-voice-calling-platform
npm install

# Setup environment
cp .env.example .env
# Edit .env with your API keys

# Start development
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key |
| `GOOGLE_PROJECT_ID` | Google Cloud project ID |
| `ELEVENLABS_API_KEY` | ElevenLabs API key |
| `ASTERISK_HOST` | Asterisk server hostname |

## 📚 Documentation

- [Architecture Overview](./docs/architecture.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React, Vite, TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | Supabase (PostgreSQL) |
| AI/LLM | Google Vertex AI |
| TTS | ElevenLabs |
| STT | Whisper / Google Speech |
| Telephony | Asterisk PBX |
| Deployment | Docker, GCP |

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details.
