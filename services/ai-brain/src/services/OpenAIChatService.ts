import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('OpenAIChatService');

type ConversationMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export class OpenAIChatService {
    private apiKey: string;
    private conversationHistory: Map<string, ConversationMessage[]>;
    private systemPrompt: string;
    private model: string = 'gpt-4o-mini';  // Fastest model with great quality

    constructor() {
        this.apiKey = config.stt?.openaiKey || process.env.OPENAI_API_KEY || '';
        this.conversationHistory = new Map();

        // System prompt for Hindi-English AI agent (same as before)
        this.systemPrompt = `You are a friendly and professional AI voice assistant speaking in natural Hindi-English mix (Hinglish).

## Your Communication Style
- Use a natural mix of Hindi and English as commonly spoken in India
- Keep responses SHORT (2-3 sentences maximum) - this is a phone conversation
- Be warm, conversational, and respectful
- Use common Hindi greetings and phrases naturally
- Avoid technical jargon

## Your Personality
- Friendly and approachable
- Patient and understanding
- Professional but not stiff
- Helpful and solution-oriented

## Response Guidelines
1. Keep it brief - phone conversations need quick responses
2. Use filler words naturally (haan, ji, accha, bilkul)
3. Confirm understanding before proceeding
4. Ask clarifying questions when needed
5. End conversations gracefully

## Example Responses
- Greeting: "Namaste! Kaise hain aap? Main aapki kya help kar sakta hoon?"
- Confirmation: "Ji haan, main samajh gaya. Let me help you with that."
- Clarification: "Ek minute, please thoda sa aur detail mein batayein?"
- Goodbye: "Accha ji, bahut accha laga aapse baat karke. Take care!"

## What NOT to Do
- Don't give long explanations
- Don't use complex English words
- Don't sound like a robot reading a script
- Don't ignore what the user said
- Don't rush the conversation

Remember: You are having a PHONE conversation. Keep it natural and conversational.`;
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
     * Generate response using OpenAI GPT-4o
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
            if (!this.apiKey || this.apiKey === 'your-openai-api-key') {
                logger.warn('OpenAI API key not configured, using fallback responses');
                return this.generateFallbackResponse(userMessage);
            }

            const startTime = Date.now();

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: history,
                    max_tokens: 150,  // Short responses for phone calls
                    temperature: 0.7,
                }),
            });

            const latency = Date.now() - startTime;
            logger.info({ latency }, 'OpenAI API response time');

            if (!response.ok) {
                const errorText = await response.text();
                logger.error({ status: response.status, error: errorText }, 'OpenAI API error');
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const data = await response.json() as { choices: Array<{ message?: { content?: string } }> };
            const aiResponse = data.choices[0]?.message?.content || this.generateFallbackResponse(userMessage);

            // Add assistant response to history
            history.push({ role: 'assistant', content: aiResponse });
            this.conversationHistory.set(callId, history);

            logger.info({ callId, responseLength: aiResponse.length }, 'AI response generated');
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
            "Namaste! Main aapka AI assistant hoon. Aap kaise hain aaj?",
            "Hello ji! Main aapki kya madad kar sakta hoon?",
            "Namaste! Batayein, main aapke liye kya kar sakta hoon?",
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    /**
     * Get closing message
     */
    getClosing(): string {
        const closings = [
            "Accha ji, bahut accha laga aapse baat karke. Dhanyawad!",
            "Thank you for calling! Koi aur help chahiye toh zaroor bataiyega.",
            "Ji, aapka shukriya! Apna khayal rakhiyega.",
        ];
        return closings[Math.floor(Math.random() * closings.length)];
    }

    /**
     * Generate fallback response when API fails
     */
    private generateFallbackResponse(userMessage: string): string {
        const lower = userMessage.toLowerCase();

        if (lower.includes('hello') || lower.includes('hi') || lower.includes('namaste')) {
            return "Namaste! Main aapka AI assistant hoon. Aap kaise hain?";
        }

        if (lower.includes('bye') || lower.includes('goodbye') || lower.includes('alvida')) {
            return "Accha ji, bahut accha laga aapse baat karke. Take care!";
        }

        if (lower.includes('help') || lower.includes('madad')) {
            return "Ji bilkul, main aapki madad karne ke liye hoon. Batayein kya chahiye?";
        }

        if (lower.includes('thank') || lower.includes('shukriya') || lower.includes('dhanyawad')) {
            return "Ji aapka shukriya! Aur koi help chahiye?";
        }

        return "Accha, main samajh gaya. Thoda aur detail mein batayein please?";
    }

    /**
     * End conversation and cleanup
     */
    endConversation(callId: string): void {
        this.conversationHistory.delete(callId);
        logger.info({ callId }, 'Conversation ended');
    }

    /**
     * Get conversation summary
     */
    getConversationSummary(callId: string): string {
        const history = this.conversationHistory.get(callId) || [];
        const messages = history.filter(m => m.role !== 'system');
        return messages.map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');
    }
}

// Export singleton instance
export const openAIChat = new OpenAIChatService();
