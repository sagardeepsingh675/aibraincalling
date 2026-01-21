import { createLogger } from '../utils/logger.js';
import * as fs from 'fs';

const logger = createLogger('DeepgramService');

interface TranscriptionResult {
    text: string;
    language?: string;
    confidence?: number;
}

export class DeepgramService {
    private apiKey: string;
    private baseUrl = 'https://api.deepgram.com/v1';

    constructor() {
        this.apiKey = process.env.DEEPGRAM_API_KEY || '';
    }

    /**
     * Transcribe audio file using Deepgram (ultra-fast ~300ms)
     */
    async transcribeFile(filePath: string): Promise<TranscriptionResult> {
        const startTime = Date.now();
        logger.info({ filePath }, 'Transcribing with Deepgram');

        if (!this.apiKey) {
            logger.warn('Deepgram API key not configured');
            return { text: '', language: 'hi' };
        }

        try {
            // Read audio file
            const audioBuffer = fs.readFileSync(filePath);

            // Call Deepgram API
            const response = await fetch(`${this.baseUrl}/listen?model=nova-2&language=hi&detect_language=true&punctuate=true`, {
                method: 'POST',
                headers: {
                    'Authorization': `Token ${this.apiKey}`,
                    'Content-Type': 'audio/wav',
                },
                body: audioBuffer,
            });

            const latency = Date.now() - startTime;
            logger.info({ latency }, 'Deepgram API response time');

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, error: errorText }, 'Deepgram API error');
                throw new Error(`Deepgram error: ${response.status}`);
            }

            const data = await response.json() as {
                results?: {
                    channels?: Array<{
                        alternatives?: Array<{
                            transcript?: string;
                            confidence?: number;
                        }>;
                        detected_language?: string;
                    }>;
                };
            };

            // Extract transcription
            const channel = data.results?.channels?.[0];
            const alternative = channel?.alternatives?.[0];

            const text = alternative?.transcript || '';
            const confidence = alternative?.confidence || 0;
            const language = channel?.detected_language || 'hi';

            logger.info({
                textLength: text.length,
                confidence,
                language,
                latency,
            }, 'Transcription complete');

            return {
                text,
                language,
                confidence,
            };

        } catch (error) {
            logger.error({ error }, 'Deepgram transcription failed');
            throw error;
        }
    }

    /**
     * Check if configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

// Export singleton
export const deepgramService = new DeepgramService();
