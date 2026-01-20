import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

const logger = createLogger('WhisperService');

type TranscriptionOptions = {
    language?: string;           // ISO language code (e.g., 'hi' for Hindi)
    prompt?: string;             // Context to improve accuracy
    temperature?: number;        // 0-1, lower = more deterministic
    responseFormat?: 'json' | 'text' | 'srt' | 'verbose_json' | 'vtt';
};

type TranscriptionResult = {
    text: string;
    language?: string;
    duration?: number;
    segments?: Array<{
        start: number;
        end: number;
        text: string;
    }>;
};

export class WhisperService {
    private apiKey: string;
    private baseUrl = 'https://api.openai.com/v1/audio';
    private audioInputDir: string;

    constructor() {
        this.apiKey = config.stt.openaiKey;
        this.audioInputDir = join(process.cwd(), 'audio_input');

        this.ensureInputDir();
    }

    private async ensureInputDir(): Promise<void> {
        if (!existsSync(this.audioInputDir)) {
            await mkdir(this.audioInputDir, { recursive: true });
            logger.info({ dir: this.audioInputDir }, 'Created audio input directory');
        }
    }

    /**
     * Transcribe audio buffer to text
     */
    async transcribe(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult> {
        logger.info({ audioSize: audioBuffer.length, language: options?.language }, 'Transcribing audio');

        if (!this.isConfigured()) {
            logger.warn('OpenAI API key not configured, using mock transcription');
            return this.mockTranscription(audioBuffer);
        }

        try {
            // Create form data with audio file
            const formData = new FormData();
            const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', 'whisper-1');

            // Set language for better Hindi recognition
            if (options?.language) {
                formData.append('language', options.language);
            } else {
                // Default to Hindi for this voice calling platform
                formData.append('language', 'hi');
            }

            // Add prompt for context
            if (options?.prompt) {
                formData.append('prompt', options.prompt);
            } else {
                // Default Hindi-English context
                formData.append('prompt', 'This is a conversation in Hindi-English mix (Hinglish). Common phrases: namaste, haan, nahi, theek hai, accha.');
            }

            if (options?.temperature !== undefined) {
                formData.append('temperature', options.temperature.toString());
            }

            formData.append('response_format', options?.responseFormat || 'verbose_json');

            const response = await fetch(`${this.baseUrl}/transcriptions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, error: errorText }, 'Whisper API error');
                throw new Error(`Whisper API error: ${response.status} - ${errorText}`);
            }

            const data = await response.json() as {
                text: string;
                language?: string;
                duration?: number;
                segments?: Array<{ start: number; end: number; text: string }>;
            };

            logger.info({ textLength: data.text.length, language: data.language }, 'Transcription complete');

            return {
                text: data.text,
                language: data.language,
                duration: data.duration,
                segments: data.segments,
            };

        } catch (error) {
            logger.error({ error }, 'Error transcribing audio');
            throw error;
        }
    }

    /**
     * Transcribe audio file to text
     */
    async transcribeFile(filePath: string, options?: TranscriptionOptions): Promise<TranscriptionResult> {
        logger.info({ filePath }, 'Transcribing file');

        const audioBuffer = await readFile(filePath);
        return this.transcribe(audioBuffer, options);
    }

    /**
     * Transcribe with automatic language detection
     */
    async transcribeAutoDetect(audioBuffer: Buffer): Promise<TranscriptionResult> {
        // Don't specify language, let Whisper detect
        return this.transcribe(audioBuffer, { language: undefined });
    }

    /**
     * Save audio buffer to file for debugging
     */
    async saveAudioForDebug(audioBuffer: Buffer, filename: string): Promise<string> {
        const filePath = join(this.audioInputDir, filename);
        await writeFile(filePath, audioBuffer);
        logger.debug({ filePath, size: audioBuffer.length }, 'Audio saved for debugging');
        return filePath;
    }

    /**
     * Check if API key is configured
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.apiKey !== 'your-openai-key');
    }

    /**
     * Mock transcription for testing without API key
     */
    private mockTranscription(audioBuffer: Buffer): TranscriptionResult {
        logger.warn('Using mock transcription - configure OPENAI_API_KEY for real transcription');

        // Return a mock response based on audio length
        const durationSeconds = audioBuffer.length / (16000 * 2); // Assuming 16kHz 16-bit audio

        const mockResponses = [
            'Namaste, main theek hoon. Aap kaise hain?',
            'Ji haan, mujhe website ke baare mein jaanna hai.',
            'Accha, please mujhe details batayein.',
            'Dhanyawad, yeh bahut helpful hai.',
            'Nahi, abhi ke liye itna kaafi hai.',
        ];

        const randomResponse = mockResponses[Math.floor(Math.random() * mockResponses.length)];

        return {
            text: randomResponse,
            language: 'hi',
            duration: durationSeconds,
        };
    }

    /**
     * Translate audio to English (useful for logging)
     */
    async translateToEnglish(audioBuffer: Buffer): Promise<string> {
        if (!this.isConfigured()) {
            return 'Mock translation: Hello, how are you?';
        }

        try {
            const formData = new FormData();
            const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', 'whisper-1');

            const response = await fetch(`${this.baseUrl}/translations`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: formData,
            });

            if (!response.ok) {
                throw new Error(`Translation failed: ${response.statusText}`);
            }

            const data = await response.json() as { text: string };
            return data.text;

        } catch (error) {
            logger.error({ error }, 'Error translating audio');
            throw error;
        }
    }

    /**
     * Create a prompt for Hindi-English context
     */
    getHindiEnglishPrompt(): string {
        return `This is a phone conversation in Hindi-English mix (Hinglish).
Common words and phrases:
- Greetings: namaste, namaskar, hello
- Affirmative: haan, ji, theek hai, accha, bilkul
- Negative: nahi, na, mat
- Politeness: please, dhanyawad, shukriya
- Business: website, service, product, company, price
The speaker may switch between Hindi and English naturally.`;
    }
}

// Export singleton instance
export const whisperService = new WhisperService();

