import { createLogger } from '../utils/logger.js';

const logger = createLogger('GroqService');

type ConversationMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export class GroqService {
    private apiKey: string;
    private conversationHistory: Map<string, ConversationMessage[]>;
    private systemPrompt: string;
    private model: string = 'llama-3.3-70b-versatile';  // Fast and capable

    constructor() {
        this.apiKey = process.env.GROQ_API_KEY || '';
        this.conversationHistory = new Map();

        // System prompt for Hindi-English AI agent
        this.systemPrompt = `You are a friendly AI voice assistant speaking in natural Hindi-English mix (Hinglish).

Rules:
- Keep responses SHORT (1-2 sentences max) - this is a phone call
- Use natural Hinglish like "Namaste", "ji", "accha", "bilkul"
- Be warm and helpful
- Don't give long explanations

Example responses:
- "Namaste! Aapki kya help karoon?"
- "Ji bilkul, main samajh gaya."
- "Accha ji, koi baat nahi!"`;
    }

    /**
     * Initialize conversation for a new call
     */
    initConversation(callId: string, customPrompt?: string): void {
        const messages: ConversationMessage[] = [
            { role: 'system', content: customPrompt || this.systemPrompt }
        ];
        this.conversationHistory.set(callId, messages);
        logger.info({ callId }, 'Conversation initialized');
    }

    /**
     * Generate response using Groq (ultra-fast!)
     */
    async generateResponse(callId: string, userMessage: string): Promise<string> {
        logger.info({ callId, userMessage: userMessage.substring(0, 50) }, 'Generating AI response');

        // Get or create conversation history
        let history = this.conversationHistory.get(callId);
        if (!history) {
            this.initConversation(callId);
            history = this.conversationHistory.get(callId)!;
        }

        // Add user message to history
        history.push({ role: 'user', content: userMessage });

        try {
            if (!this.apiKey) {
                logger.warn('Groq API key not configured');
                return this.generateFallbackResponse(userMessage);
            }

            const startTime = Date.now();

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: history,
                    max_tokens: 100,  // Short responses for phone calls
                    temperature: 0.7,
                }),
            });

            const latency = Date.now() - startTime;
            logger.info({ latency }, 'Groq API response time');

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, error: errorText }, 'Groq API error');
                throw new Error(`Groq API error: ${response.status}`);
            }

            const data = await response.json() as { choices: Array<{ message?: { content?: string } }> };
            const aiResponse = data.choices[0]?.message?.content || this.generateFallbackResponse(userMessage);

            // Add assistant response to history
            history.push({ role: 'assistant', content: aiResponse });
            this.conversationHistory.set(callId, history);

            logger.info({ callId, responseLength: aiResponse.length, latency }, 'AI response generated');
            return aiResponse;

        } catch (error) {
            logger.error({ callId, error }, 'Error generating AI response');
            const fallback = this.generateFallbackResponse(userMessage);
            history.push({ role: 'assistant', content: fallback });
            return fallback;
        }
    }

    /**
     * Get greeting message
     */
    getGreeting(): string {
        const greetings = [
            "Namaste! Main aapka AI assistant hoon. Kya help karoon?",
            "Hello ji! Batayein, kya chahiye?",
            "Namaste! Aap kaise hain?",
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Get closing message
     */
    getClosing(): string {
        return "Accha ji, dhanyawad! Take care!";
    }

    /**
     * Generate fallback response
     */
    private generateFallbackResponse(userMessage: string): string {
        const lower = userMessage.toLowerCase();

        if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste')) {
            return "Namaste! Aapki kya help karoon?";
        }

        if (lower.includes('bye') || lower.includes('goodbye')) {
            return "Accha ji, bye! Take care!";
        }

        return "Ji, main samajh gaya. Aur batayein?";
    }

    /**
     * End conversation
     */
    endConversation(callId: string): void {
        this.conversationHistory.delete(callId);
        logger.info({ callId }, 'Conversation ended');
    }

    /**
     * Check if configured
     */
    isConfigured(): boolean {
        return !!this.apiKey;
    }
}

// Export singleton instance
export const groqService = new GroqService();
