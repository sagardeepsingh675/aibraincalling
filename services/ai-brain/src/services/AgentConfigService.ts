import { createLogger } from '../utils/logger.js';
import { supabaseService } from './SupabaseService.js';

const logger = createLogger('AgentConfigService');

export interface AgentConfig {
    id: string;
    agent_name: string;
    company_name: string;
    voice_style: string;
    greeting_template: string;
    availability_question: string;
    positive_responses: string[];
    negative_responses: string[];
    pitch_script: string;
    pitch_key_points: string[];
    positive_close_message: string;
    negative_close_message: string;
    callback_message: string;
    max_turns: number;
    recording_enabled: boolean;
    analytics_enabled: boolean;
    is_active: boolean;
}

class AgentConfigService {
    private config: AgentConfig | null = null;
    private lastFetch: number = 0;
    private readonly cacheDuration = 60000; // 1 minute cache

    /**
     * Get the active agent configuration
     */
    async getConfig(): Promise<AgentConfig> {
        // Return cached config if still valid
        if (this.config && Date.now() - this.lastFetch < this.cacheDuration) {
            return this.config;
        }

        try {
            const supabase = supabaseService.getClient();
            const { data, error } = await supabase
                .from('vc_agent_config')
                .select('*')
                .eq('is_active', true)
                .limit(1)
                .single();

            if (error) {
                logger.warn({ error }, 'Failed to fetch agent config, using defaults');
                return this.getDefaultConfig();
            }

            this.config = data as AgentConfig;
            this.lastFetch = Date.now();
            logger.info({ agentName: this.config.agent_name }, 'Loaded agent configuration');
            return this.config;
        } catch (error) {
            logger.error({ error }, 'Error fetching agent config');
            return this.getDefaultConfig();
        }
    }

    /**
     * Get greeting with placeholders replaced
     */
    async getGreeting(): Promise<string> {
        const config = await this.getConfig();
        return this.replacePlaceholders(config.greeting_template, config);
    }

    /**
     * Get the pitch script
     */
    async getPitchScript(): Promise<string> {
        const config = await this.getConfig();
        return config.pitch_script;
    }

    /**
     * Get closing message based on outcome
     */
    async getClosingMessage(positive: boolean): Promise<string> {
        const config = await this.getConfig();
        return positive ? config.positive_close_message : config.negative_close_message;
    }

    /**
     * Get callback message
     */
    async getCallbackMessage(): Promise<string> {
        const config = await this.getConfig();
        return config.callback_message;
    }

    /**
     * Check if user response is positive
     */
    async isPositiveResponse(text: string): Promise<boolean> {
        const config = await this.getConfig();
        const normalizedText = text.toLowerCase().trim();
        return config.positive_responses.some(keyword =>
            normalizedText.includes(keyword.toLowerCase())
        );
    }

    /**
     * Check if user response is negative
     */
    async isNegativeResponse(text: string): Promise<boolean> {
        const config = await this.getConfig();
        const normalizedText = text.toLowerCase().trim();
        return config.negative_responses.some(keyword =>
            normalizedText.includes(keyword.toLowerCase())
        );
    }

    /**
     * Build system prompt for AI from config
     */
    async buildSystemPrompt(): Promise<string> {
        const config = await this.getConfig();

        return `You are ${config.agent_name}, a ${config.voice_style} AI sales representative for ${config.company_name}.

COMMUNICATION STYLE:
- Speak in natural Hindi-English mix (Hinglish)
- Be ${config.voice_style} and professional
- Keep responses SHORT (1-2 sentences max)
- Match the caller's language preference

CONVERSATION FLOW:
1. Greet the customer warmly
2. Ask if they have 2 minutes
3. If yes, deliver the pitch: ${config.pitch_script}
4. Key points to cover: ${config.pitch_key_points.join(', ')}
5. Handle objections politely
6. Close the conversation appropriately

POSITIVE KEYWORDS (user is interested): ${config.positive_responses.join(', ')}
NEGATIVE KEYWORDS (user is not interested): ${config.negative_responses.join(', ')}

Remember: Keep responses brief and natural for phone conversations.`;
    }

    /**
     * Replace placeholders in template
     */
    private replacePlaceholders(template: string, config: AgentConfig): string {
        return template
            .replace(/\{agent_name\}/g, config.agent_name)
            .replace(/\{company_name\}/g, config.company_name)
            .replace(/\{pitch_script\}/g, config.pitch_script);
    }

    /**
     * Get default configuration
     */
    private getDefaultConfig(): AgentConfig {
        return {
            id: 'default',
            agent_name: 'AI Assistant',
            company_name: 'AI Solutions',
            voice_style: 'friendly',
            greeting_template: 'Namaste! Main {agent_name} bol rahi hoon. Kya help karoon?',
            availability_question: 'Kya aapke paas 2 minute hain?',
            positive_responses: ['ha', 'haan', 'yes', 'okay', 'bilkul', 'bolo', 'batao'],
            negative_responses: ['nahi', 'no', 'busy', 'abhi nahi'],
            pitch_script: 'Main aapko ek achhi service ke baare mein batana chahti hoon.',
            pitch_key_points: ['Great product', 'Save time', 'Special offer'],
            positive_close_message: 'Bahut shukriya! Aapka din achha guzre!',
            negative_close_message: 'Koi baat nahi! Thank you for your time.',
            callback_message: 'Accha ji, kab call kar sakti hoon?',
            max_turns: 10,
            recording_enabled: true,
            analytics_enabled: true,
            is_active: true
        };
    }

    /**
     * Clear cached config (force reload on next request)
     */
    clearCache(): void {
        this.config = null;
        this.lastFetch = 0;
    }
}

export const agentConfigService = new AgentConfigService();
