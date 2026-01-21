import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';
import * as fs from 'fs';

const logger = createLogger('GoogleSTTService');

interface TranscriptionResult {
    text: string;
    language?: string;
    confidence?: number;
}

export class GoogleSTTService {
    private apiKey: string;

    constructor() {
        this.apiKey = config.google?.apiKey || process.env.GOOGLE_API_KEY || '';
    }

    /**
     * Transcribe audio file using Google Cloud Speech-to-Text API
     * Uses the REST API with API key for simplicity
     */
    async transcribeFile(filePath: string): Promise<TranscriptionResult> {
        const startTime = Date.now();
        logger.info({ filePath }, 'Transcribing with Google STT');

        if (!this.apiKey || this.apiKey === 'your-google-api-key') {
            logger.warn('Google API key not configured, returning empty transcription');
            return { text: '', language: 'hi' };
        }

        try {
            // Read audio file and convert to base64
            const audioBytes = fs.readFileSync(filePath);
            const audioContent = audioBytes.toString('base64');

            // Call Google Speech-to-Text API
            const endpoint = `https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`;

            const requestBody = {
                config: {
                    encoding: 'LINEAR16',
                    sampleRateHertz: 8000,  // Asterisk uses 8kHz
                    languageCode: 'hi-IN',  // Hindi (India)
                    alternativeLanguageCodes: ['en-IN'],  // Also detect English
                    enableAutomaticPunctuation: true,
                    model: 'latest_short',  // Optimized for short utterances (faster)
                },
                audio: {
                    content: audioContent,
                },
            };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            const latency = Date.now() - startTime;
            logger.info({ latency }, 'Google STT response time');

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, error: errorText }, 'Google STT API error');
                throw new Error(`Google STT error: ${response.status}`);
            }

            const data = await response.json() as {
                results?: Array<{
                    alternatives?: Array<{
                        transcript?: string;
                        confidence?: number;
                    }>;
                    languageCode?: string;
                }>;
            };

            // Extract transcription from response
            const result = data.results?.[0];
            const alternative = result?.alternatives?.[0];

            const text = alternative?.transcript || '';
            const confidence = alternative?.confidence || 0;
            const language = result?.languageCode || 'hi-IN';

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
            logger.error({ error }, 'Google STT transcription failed');
            throw error;
        }
    }

    /**
     * Check if the service is configured
     */
    isConfigured(): boolean {
        return !!(this.apiKey && this.apiKey !== 'your-google-api-key');
    }
}

// Export singleton instance
export const googleSTT = new GoogleSTTService();
