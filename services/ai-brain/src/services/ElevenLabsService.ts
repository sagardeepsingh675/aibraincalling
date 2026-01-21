import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const logger = createLogger('ElevenLabsService');

type VoiceSettings = {
    stability: number;       // 0-1, higher = more consistent
    similarity_boost: number; // 0-1, higher = more similar to original
    style?: number;          // 0-1, style exaggeration
    use_speaker_boost?: boolean;
};

type TTSOptions = {
    voiceId?: string;
    modelId?: string;
    voiceSettings?: Partial<VoiceSettings>;
    outputFormat?: 'mp3_44100_128' | 'mp3_22050_32' | 'pcm_16000' | 'pcm_22050' | 'ulaw_8000';
};

export class ElevenLabsService {
    private apiKey: string;
    private defaultVoiceId: string;
    private baseUrl = 'https://api.elevenlabs.io/v1';
    private audioOutputDir: string;

    // Default settings optimized for Hindi-English phone calls
    private defaultSettings: VoiceSettings = {
        stability: 0.5,        // Balanced stability
        similarity_boost: 0.75, // High similarity to original voice
        style: 0.3,            // Subtle style for natural speech
        use_speaker_boost: true,
    };

    constructor() {
        this.apiKey = config.elevenLabs.apiKey;
        this.defaultVoiceId = config.elevenLabs.voiceId || 'pNInz6obpgDQGcFmaJgB'; // Adam - multilingual
        this.audioOutputDir = join(process.cwd(), 'audio_output');

        // Create output directory if it doesn't exist
        this.ensureOutputDir();
    }

    private async ensureOutputDir(): Promise<void> {
        if (!existsSync(this.audioOutputDir)) {
            await mkdir(this.audioOutputDir, { recursive: true });
            logger.info({ dir: this.audioOutputDir }, 'Created audio output directory');
        }
    }

    /**
     * Convert text to speech and return audio buffer
     */
    async textToSpeech(text: string, options?: TTSOptions): Promise<Buffer> {
        logger.info({ textLength: text.length, voiceId: options?.voiceId || this.defaultVoiceId }, 'Converting text to speech');

        if (!this.apiKey || this.apiKey === 'your-elevenlabs-api-key') {
            logger.warn('ElevenLabs API key not configured');
            throw new Error('ElevenLabs API key not configured');
        }

        const voiceId = options?.voiceId || this.defaultVoiceId;
        const modelId = options?.modelId || 'eleven_multilingual_v2'; // Supports Hindi

        try {
            const response = await fetch(
                `${this.baseUrl}/text-to-speech/${voiceId}`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.apiKey,
                    },
                    body: JSON.stringify({
                        text,
                        model_id: modelId,
                        voice_settings: {
                            ...this.defaultSettings,
                            ...options?.voiceSettings,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, error: errorText }, 'ElevenLabs API error');
                throw new Error(`ElevenLabs API error: ${response.status} - ${errorText}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = Buffer.from(arrayBuffer);

            logger.info({ audioSize: audioBuffer.length }, 'TTS conversion complete');
            return audioBuffer;

        } catch (error) {
            logger.error({ error }, 'Error converting text to speech');
            throw error;
        }
    }

    /**
     * Convert text to speech and save to file
     */
    async textToSpeechFile(text: string, filename: string, options?: TTSOptions): Promise<string> {
        const audioBuffer = await this.textToSpeech(text, options);

        const filePath = join(this.audioOutputDir, filename.endsWith('.mp3') ? filename : `${filename}.mp3`);
        await writeFile(filePath, audioBuffer);

        logger.info({ filePath, size: audioBuffer.length }, 'Audio file saved');
        return filePath;
    }

    /**
     * Stream text to speech and save to file (faster than regular TTS)
     * Returns as soon as the file is ready to play
     */
    async streamTextToSpeechFile(text: string, filename: string, options?: TTSOptions): Promise<string> {
        const startTime = Date.now();
        logger.info({ textLength: text.length }, 'Streaming TTS to file');

        if (!this.apiKey || this.apiKey === 'your-elevenlabs-api-key') {
            throw new Error('ElevenLabs API key not configured');
        }

        const voiceId = options?.voiceId || this.defaultVoiceId;
        const modelId = options?.modelId || 'eleven_turbo_v2_5';  // Fastest model!

        const filePath = join(this.audioOutputDir, filename.endsWith('.mp3') ? filename : `${filename}.mp3`);

        try {
            const response = await fetch(
                `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.apiKey,
                    },
                    body: JSON.stringify({
                        text,
                        model_id: modelId,
                        voice_settings: {
                            ...this.defaultSettings,
                            ...options?.voiceSettings,
                        },
                    }),
                }
            );

            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs streaming error: ${response.status} - ${errorText}`);
            }

            // Collect all chunks
            const chunks: Buffer[] = [];
            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(Buffer.from(value));
            }

            const audioBuffer = Buffer.concat(chunks);
            await writeFile(filePath, audioBuffer);

            const latency = Date.now() - startTime;
            logger.info({ filePath, size: audioBuffer.length, latency }, 'Streaming TTS file saved');
            return filePath;

        } catch (error) {
            logger.error({ error }, 'Error streaming TTS to file');
            throw error;
        }
    }

    /**
     * Stream text to speech (for lower latency)
     */
    async *streamTextToSpeech(text: string, options?: TTSOptions): AsyncGenerator<Buffer> {
        logger.info({ textLength: text.length }, 'Streaming text to speech');

        if (!this.apiKey || this.apiKey === 'your-elevenlabs-api-key') {
            throw new Error('ElevenLabs API key not configured');
        }

        const voiceId = options?.voiceId || this.defaultVoiceId;
        const modelId = options?.modelId || 'eleven_multilingual_v2';

        try {
            const response = await fetch(
                `${this.baseUrl}/text-to-speech/${voiceId}/stream`,
                {
                    method: 'POST',
                    headers: {
                        'Accept': 'audio/mpeg',
                        'Content-Type': 'application/json',
                        'xi-api-key': this.apiKey,
                    },
                    body: JSON.stringify({
                        text,
                        model_id: modelId,
                        voice_settings: {
                            ...this.defaultSettings,
                            ...options?.voiceSettings,
                        },
                    }),
                }
            );

            if (!response.ok || !response.body) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs streaming error: ${response.status} - ${errorText}`);
            }

            const reader = response.body.getReader();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                yield Buffer.from(value);
            }

            logger.info('TTS streaming complete');

        } catch (error) {
            logger.error({ error }, 'Error streaming text to speech');
            throw error;
        }
    }

    /**
     * Get available voices
     */
    async getVoices(): Promise<any[]> {
        if (!this.apiKey) {
            return [];
        }

        try {
            const response = await fetch(`${this.baseUrl}/voices`, {
                headers: {
                    'xi-api-key': this.apiKey,
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch voices: ${response.statusText}`);
            }

            const data = await response.json() as { voices: any[] };
            logger.info({ count: data.voices.length }, 'Fetched available voices');
            return data.voices;

        } catch (error) {
            logger.error({ error }, 'Error fetching voices');
            return [];
        }
    }

    /**
     * Get recommended Hindi voices
     */
    getRecommendedHindiVoices(): { id: string; name: string; description: string }[] {
        return [
            {
                id: 'pNInz6obpgDQGcFmaJgB',
                name: 'Adam',
                description: 'Multilingual male voice - good for Hindi-English',
            },
            {
                id: 'EXAVITQu4vr4xnSDxMaL',
                name: 'Bella',
                description: 'Multilingual female voice - warm and professional',
            },
            {
                id: '21m00Tcm4TlvDq8ikWAM',
                name: 'Rachel',
                description: 'Female voice - clear and friendly',
            },
            {
                id: 'AZnzlk1XvdvUeBnXmlld',
                name: 'Domi',
                description: 'Female voice - young and energetic',
            },
        ];
    }

    /**
     * Get user's subscription info (for quota tracking)
     */
    async getSubscriptionInfo(): Promise<{ character_count: number; character_limit: number } | null> {
        if (!this.apiKey) {
            return null;
        }

        try {
            const response = await fetch(`${this.baseUrl}/user/subscription`, {
                headers: {
                    'xi-api-key': this.apiKey,
                },
            });

            if (!response.ok) {
                return null;
            }

            const data = await response.json() as { character_count: number; character_limit: number };
            return {
                character_count: data.character_count,
                character_limit: data.character_limit,
            };

        } catch {
            return null;
        }
    }

    /**
     * Check if API key is configured
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.apiKey !== 'your-elevenlabs-api-key');
    }
}

// Export singleton instance
export const elevenLabs = new ElevenLabsService();

