import 'dotenv/config';

export const config = {
    // Server
    port: parseInt(process.env.AI_BRAIN_PORT || '4000'),
    nodeEnv: process.env.NODE_ENV || 'development',

    // Supabase
    supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceKey: process.env.SUPABASE_SERVICE_KEY || '',
    },

    // Google Cloud / Vertex AI
    google: {
        projectId: process.env.GOOGLE_PROJECT_ID || '',
        location: process.env.GOOGLE_LOCATION || 'asia-south1',
        apiKey: process.env.GOOGLE_API_KEY || '',
    },

    // ElevenLabs
    elevenLabs: {
        apiKey: process.env.ELEVENLABS_API_KEY || '',
        voiceId: process.env.ELEVENLABS_VOICE_ID || '',
    },

    // STT
    stt: {
        provider: process.env.STT_PROVIDER || 'whisper',
        openaiKey: process.env.OPENAI_API_KEY || '',
    },

    // Asterisk
    asterisk: {
        host: process.env.ASTERISK_HOST || 'localhost',
        ariPort: parseInt(process.env.ASTERISK_ARI_PORT || '8088'),
        ariUser: process.env.ASTERISK_ARI_USER || 'asterisk',
        ariPassword: process.env.ASTERISK_ARI_PASSWORD || '',
        amiPort: parseInt(process.env.ASTERISK_AMI_PORT || '5038'),
        amiUser: process.env.ASTERISK_AMI_USER || 'admin',
        amiPassword: process.env.ASTERISK_AMI_PASSWORD || '',
    },

    // Redis
    redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
    },

    // Calling config
    calling: {
        hoursStart: parseInt(process.env.CALLING_HOURS_START || '9'),
        hoursEnd: parseInt(process.env.CALLING_HOURS_END || '21'),
        maxConcurrent: parseInt(process.env.MAX_CONCURRENT_CALLS || '5'),
        timeout: parseInt(process.env.CALL_TIMEOUT || '60'),
    },

    // Security
    webhookSecret: process.env.WEBHOOK_SECRET || '',
};
