import { EventEmitter } from 'events';
import { config } from '../config';
import { logger } from '../utils/logger';

// ARI Client types
interface ARIChannel {
    id: string;
    name: string;
    state: string;
    caller: { name: string; number: string };
    connected: { name: string; number: string };
    dialplan: { context: string; exten: string; priority: number };
    answer: () => Promise<void>;
    hangup: () => Promise<void>;
    play: (opts: { media: string }, playbackId?: string) => Promise<ARIPlayback>;
    record: (opts: RecordOptions) => Promise<ARIRecording>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    removeAllListeners: (event?: string) => void;
}

interface ARIPlayback {
    id: string;
    on: (event: string, handler: () => void) => void;
}

interface ARIRecording {
    name: string;
    on: (event: string, handler: () => void) => void;
}

interface RecordOptions {
    name: string;
    format: string;
    maxDurationSeconds?: number;
    maxSilenceSeconds?: number;
    beep?: boolean;
    terminateOn?: string;
}

interface ARIBridge {
    id: string;
    addChannel: (opts: { channel: string }) => Promise<void>;
    destroy: () => Promise<void>;
}

interface ARIClient {
    start: (appName: string) => Promise<void>;
    on: (event: string, handler: (...args: any[]) => void) => void;
    channels: {
        get: (opts: { channelId: string }) => Promise<ARIChannel>;
        originate: (opts: any) => Promise<ARIChannel>;
    };
    bridges: {
        create: (opts: { type: string }) => Promise<ARIBridge>;
    };
    recordings: {
        getStoredFile: (opts: { recordingName: string }) => Promise<Buffer>;
        deleteStored: (opts: { recordingName: string }) => Promise<void>;
    };
}

export class AsteriskARIService extends EventEmitter {
    private client: ARIClient | null = null;
    private connected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 5000;
    private appName = 'ai-voice-app';

    constructor() {
        super();
        logger.info('AsteriskARIService initialized');
    }

    async connect(): Promise<boolean> {
        const ariUrl = `http://${config.asterisk.host}:${config.asterisk.ariPort}`;
        const { ariUser, ariPassword } = config.asterisk;

        if (!config.asterisk.ariPassword) {
            logger.warn('Asterisk ARI password not configured, skipping connection');
            return false;
        }

        try {
            // Dynamic import of ari-client
            const ariClient = await import('ari-client');

            logger.info(`Connecting to ARI at ${ariUrl}`);

            this.client = await ariClient.connect(ariUrl, ariUser, ariPassword) as ARIClient;
            this.connected = true;
            this.reconnectAttempts = 0;

            // Register event handlers
            this.setupEventHandlers();

            // Start the Stasis application
            await this.client.start(this.appName);

            logger.info(`ARI connected and ${this.appName} application started`);
            this.emit('connected');

            return true;
        } catch (error) {
            logger.error('ARI connection failed:', error);
            this.connected = false;
            this.scheduleReconnect();
            return false;
        }
    }

    private setupEventHandlers(): void {
        if (!this.client) return;

        // Handle new calls entering the Stasis app
        this.client.on('StasisStart', (event: any, channel: ARIChannel) => {
            logger.info(`StasisStart: Channel ${channel.id} entered ${this.appName}`, {
                caller: channel.caller,
                dialplan: channel.dialplan,
            });

            this.emit('callStarted', {
                channelId: channel.id,
                channel,
                caller: channel.caller,
                extension: channel.dialplan.exten,
            });
        });

        // Handle calls leaving the Stasis app
        this.client.on('StasisEnd', (event: any, channel: ARIChannel) => {
            logger.info(`StasisEnd: Channel ${channel.id} left ${this.appName}`);
            this.emit('callEnded', { channelId: channel.id });
        });

        // Handle channel state changes
        this.client.on('ChannelStateChange', (event: any, channel: ARIChannel) => {
            logger.debug(`Channel ${channel.id} state changed to ${channel.state}`);
        });

        // Handle DTMF input
        this.client.on('ChannelDtmfReceived', (event: any, channel: ARIChannel) => {
            logger.info(`DTMF received on ${channel.id}: ${event.digit}`);
            this.emit('dtmfReceived', {
                channelId: channel.id,
                digit: event.digit,
            });
        });
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            logger.error('Max reconnection attempts reached');
            return;
        }

        this.reconnectAttempts++;
        const delay = this.reconnectDelay * this.reconnectAttempts;

        logger.info(`Scheduling ARI reconnection in ${delay}ms (attempt ${this.reconnectAttempts})`);

        setTimeout(() => this.connect(), delay);
    }

    async answerChannel(channelId: string): Promise<void> {
        if (!this.client) throw new Error('ARI not connected');

        try {
            const channel = await this.client.channels.get({ channelId });
            await channel.answer();
            logger.info(`Answered channel ${channelId}`);
        } catch (error) {
            logger.error(`Failed to answer channel ${channelId}:`, error);
            throw error;
        }
    }

    async hangupChannel(channelId: string): Promise<void> {
        if (!this.client) throw new Error('ARI not connected');

        try {
            const channel = await this.client.channels.get({ channelId });
            await channel.hangup();
            logger.info(`Hungup channel ${channelId}`);
        } catch (error) {
            logger.error(`Failed to hangup channel ${channelId}:`, error);
            throw error;
        }
    }

    async playAudio(channelId: string, audioFile: string): Promise<string> {
        if (!this.client) throw new Error('ARI not connected');

        try {
            const channel = await this.client.channels.get({ channelId });
            const playbackId = `playback-${Date.now()}`;

            // Play audio file (sound: prefix for Asterisk sounds, recording: for recordings)
            const playback = await channel.play({ media: audioFile }, playbackId);

            logger.info(`Playing audio on channel ${channelId}: ${audioFile}`);

            return new Promise((resolve, reject) => {
                playback.on('PlaybackFinished', () => {
                    logger.debug(`Playback finished on channel ${channelId}`);
                    resolve(playbackId);
                });
            });
        } catch (error) {
            logger.error(`Failed to play audio on channel ${channelId}:`, error);
            throw error;
        }
    }

    async startRecording(
        channelId: string,
        recordingName: string,
        maxDurationSeconds = 30,
        maxSilenceSeconds = 3
    ): Promise<string> {
        if (!this.client) throw new Error('ARI not connected');

        try {
            const channel = await this.client.channels.get({ channelId });

            const recording = await channel.record({
                name: recordingName,
                format: 'wav',
                maxDurationSeconds,
                maxSilenceSeconds,
                beep: false,
                terminateOn: '#',
            });

            logger.info(`Started recording on channel ${channelId}: ${recordingName}`);

            return new Promise((resolve, reject) => {
                recording.on('RecordingFinished', () => {
                    logger.info(`Recording finished: ${recordingName}`);
                    resolve(recordingName);
                });

                recording.on('RecordingFailed', () => {
                    logger.error(`Recording failed: ${recordingName}`);
                    reject(new Error('Recording failed'));
                });
            });
        } catch (error) {
            logger.error(`Failed to start recording on channel ${channelId}:`, error);
            throw error;
        }
    }

    async getRecording(recordingName: string): Promise<Buffer> {
        if (!this.client) throw new Error('ARI not connected');

        try {
            const file = await this.client.recordings.getStoredFile({ recordingName });
            return file;
        } catch (error) {
            logger.error(`Failed to get recording ${recordingName}:`, error);
            throw error;
        }
    }

    async deleteRecording(recordingName: string): Promise<void> {
        if (!this.client) throw new Error('ARI not connected');

        try {
            await this.client.recordings.deleteStored({ recordingName });
            logger.debug(`Deleted recording: ${recordingName}`);
        } catch (error) {
            logger.error(`Failed to delete recording ${recordingName}:`, error);
        }
    }

    async createBridge(): Promise<ARIBridge> {
        if (!this.client) throw new Error('ARI not connected');

        const bridge = await this.client.bridges.create({ type: 'mixing' });
        logger.info(`Created bridge: ${bridge.id}`);
        return bridge;
    }

    isConnected(): boolean {
        return this.connected;
    }

    getClient(): ARIClient | null {
        return this.client;
    }
}

// Export singleton instance
export const asteriskARI = new AsteriskARIService();
