import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { logger } from '../utils/logger';
import { asteriskARI } from './AsteriskARIService';
import { vertexAI } from './VertexAIService';
import { elevenLabs } from './ElevenLabsService';
import { whisperService } from './WhisperService';

interface ConversationSession {
    channelId: string;
    callId: string;
    leadId?: string;
    conversationHistory: Array<{ role: string; content: string }>;
    state: 'greeting' | 'listening' | 'processing' | 'speaking' | 'ended';
    startTime: Date;
    turnCount: number;
}

export class AudioBridgeService extends EventEmitter {
    private sessions: Map<string, ConversationSession> = new Map();
    private audioDir: string;

    constructor() {
        super();
        this.audioDir = path.join(process.cwd(), 'audio_output');

        // Ensure audio directory exists
        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
        }

        this.setupARIListeners();
        logger.info('AudioBridgeService initialized');
    }

    private setupARIListeners(): void {
        asteriskARI.on('callStarted', async (event) => {
            await this.handleCallStarted(event);
        });

        asteriskARI.on('callEnded', (event) => {
            this.handleCallEnded(event.channelId);
        });

        asteriskARI.on('dtmfReceived', (event) => {
            this.handleDTMF(event.channelId, event.digit);
        });
    }

    private async handleCallStarted(event: {
        channelId: string;
        channel: any;
        caller: { name: string; number: string };
        extension: string;
    }): Promise<void> {
        const { channelId, channel, caller, extension } = event;

        logger.info(`New AI call started: ${channelId}`, { caller, extension });

        // Create session
        const session: ConversationSession = {
            channelId,
            callId: `call-${Date.now()}`,
            conversationHistory: [],
            state: 'greeting',
            startTime: new Date(),
            turnCount: 0,
        };
        this.sessions.set(channelId, session);

        try {
            // Answer the call
            await asteriskARI.answerChannel(channelId);

            // Start the conversation
            await this.startConversation(session);
        } catch (error) {
            logger.error(`Failed to start conversation for ${channelId}:`, error);
            this.cleanupSession(channelId);
        }
    }

    private async startConversation(session: ConversationSession): Promise<void> {
        const { channelId } = session;

        try {
            // Generate greeting
            session.state = 'speaking';
            const greeting = vertexAI.getGreeting();

            // Convert to speech
            const audioPath = await this.textToSpeech(greeting, `greeting-${channelId}`);

            // Play greeting
            await this.playAudioFile(channelId, audioPath);

            // Add to conversation history
            session.conversationHistory.push({ role: 'assistant', content: greeting });

            // Start listening for user input
            await this.listenAndRespond(session);

        } catch (error) {
            logger.error(`Conversation start failed for ${channelId}:`, error);
            await this.endConversation(session, 'error');
        }
    }

    private async listenAndRespond(session: ConversationSession): Promise<void> {
        const { channelId } = session;
        const maxTurns = 10;

        while (session.turnCount < maxTurns && session.state !== 'ended') {
            try {
                session.state = 'listening';
                session.turnCount++;

                logger.info(`Turn ${session.turnCount} - Listening on ${channelId}`);

                // Record user speech
                const recordingName = `recording-${channelId}-${session.turnCount}`;
                await asteriskARI.startRecording(channelId, recordingName, 15, 2);

                // Get recording file
                const audioBuffer = await asteriskARI.getRecording(recordingName);

                // Transcribe
                session.state = 'processing';
                const transcription = await this.transcribeAudio(audioBuffer, recordingName);

                if (!transcription || transcription.trim().length === 0) {
                    logger.debug(`Empty transcription on turn ${session.turnCount}`);
                    continue;
                }

                logger.info(`User said: "${transcription}"`);
                session.conversationHistory.push({ role: 'user', content: transcription });

                // Check for end keywords
                if (this.shouldEndConversation(transcription)) {
                    await this.endConversation(session, 'user_ended');
                    break;
                }

                // Generate AI response - use callId for session tracking
                const response = await vertexAI.generateResponse(
                    session.callId,
                    transcription
                );

                logger.info(`AI response: "${response}"`);
                session.conversationHistory.push({ role: 'assistant', content: response });

                // Convert to speech and play
                session.state = 'speaking';
                const audioPath = await this.textToSpeech(response, `response-${channelId}-${session.turnCount}`);
                await this.playAudioFile(channelId, audioPath);

                // Cleanup recording
                await asteriskARI.deleteRecording(recordingName);

            } catch (error) {
                logger.error(`Error in conversation turn ${session.turnCount}:`, error);

                // Try to continue with error recovery
                if (session.turnCount >= maxTurns - 1) {
                    await this.endConversation(session, 'max_turns');
                    break;
                }
            }
        }

        if (session.turnCount >= maxTurns) {
            await this.endConversation(session, 'max_turns');
        }
    }

    private shouldEndConversation(text: string): boolean {
        const endKeywords = [
            'bye', 'goodbye', 'thank you', 'thanks',
            'alvida', 'dhanyavaad', 'shukriya', 'theek hai'
        ];
        const lowerText = text.toLowerCase();
        return endKeywords.some(keyword => lowerText.includes(keyword));
    }

    private async endConversation(
        session: ConversationSession,
        reason: string
    ): Promise<void> {
        const { channelId } = session;
        session.state = 'ended';

        try {
            // Generate closing message
            const closing = vertexAI.getClosing();

            // Play closing
            const audioPath = await this.textToSpeech(closing, `closing-${channelId}`);
            await this.playAudioFile(channelId, audioPath);

            // Wait for playback then hangup
            await new Promise(resolve => setTimeout(resolve, 2000));
            await asteriskARI.hangupChannel(channelId);

        } catch (error) {
            logger.error(`Error ending conversation for ${channelId}:`, error);
        } finally {
            this.cleanupSession(channelId);
            this.emit('conversationEnded', {
                channelId,
                callId: session.callId,
                reason,
                duration: Date.now() - session.startTime.getTime(),
                turns: session.turnCount,
            });
        }
    }

    private async textToSpeech(text: string, filename: string): Promise<string> {
        const audioPath = path.join(this.audioDir, `${filename}.mp3`);

        try {
            const audioBuffer = await elevenLabs.textToSpeech(text);
            fs.writeFileSync(audioPath, audioBuffer);
            return audioPath;
        } catch (error) {
            logger.error('TTS failed:', error);
            throw error;
        }
    }

    private async transcribeAudio(audioBuffer: Buffer, name: string): Promise<string> {
        // Save buffer to temp file for Whisper
        const tempPath = path.join(this.audioDir, `${name}.wav`);
        fs.writeFileSync(tempPath, audioBuffer);

        try {
            const result = await whisperService.transcribeFile(tempPath);
            return result.text;
        } finally {
            // Cleanup temp file
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }
        }
    }

    private async playAudioFile(channelId: string, audioPath: string): Promise<void> {
        // For now, use Asterisk's sound file format
        // In production, we'd convert MP3 to WAV and use ARI external media
        const soundUri = `sound:${audioPath.replace(/\\/g, '/')}`;

        try {
            await asteriskARI.playAudio(channelId, soundUri);
        } catch (error) {
            logger.error(`Failed to play audio ${audioPath}:`, error);
            throw error;
        }
    }

    private handleCallEnded(channelId: string): void {
        const session = this.sessions.get(channelId);
        if (session) {
            session.state = 'ended';
            this.cleanupSession(channelId);
            logger.info(`Call ended: ${channelId}`);
        }
    }

    private handleDTMF(channelId: string, digit: string): void {
        logger.info(`DTMF on ${channelId}: ${digit}`);

        // Handle special DTMF codes
        if (digit === '#') {
            const session = this.sessions.get(channelId);
            if (session) {
                this.endConversation(session, 'dtmf_hangup');
            }
        }
    }

    private cleanupSession(channelId: string): void {
        this.sessions.delete(channelId);
    }

    getSession(channelId: string): ConversationSession | undefined {
        return this.sessions.get(channelId);
    }

    getActiveSessions(): number {
        return this.sessions.size;
    }
}

// Export singleton instance
export const audioBridge = new AudioBridgeService();
