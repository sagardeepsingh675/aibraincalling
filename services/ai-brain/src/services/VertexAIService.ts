import { config } from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('VertexAIService');

type ConversationMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

type GenerationConfig = {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    topK?: number;
};

export class VertexAIService {
    private projectId: string;
    private location: string;
    private conversationHistory: Map<string, ConversationMessage[]>;
    private systemPrompt: string;
    private defaultConfig: GenerationConfig;

    constructor() {
        this.projectId = config.google.projectId;
        this.location = config.google.location;
        this.conversationHistory = new Map();

        this.defaultConfig = {
            temperature: 0.7,
            maxOutputTokens: 150,  // Keep responses short for phone calls
            topP: 0.95,
            topK: 40,
        };

        // System prompt for Hindi-English AI agent
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
     * Generate response using Vertex AI (Gemini)
     */
    async generateResponse(
        callId: string,
        userMessage: string,
        generationConfig?: GenerationConfig
    ): Promise<string> {
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
            const mergedConfig = { ...this.defaultConfig, ...generationConfig };

            // Check if we have valid Google API key
            if (!config.google.apiKey || config.google.apiKey === 'your-google-api-key') {
                logger.warn('Google API key not configured, using fallback responses');
                return this.generateFallbackResponse(userMessage);
            }

            // Call Gemini API
            const response = await this.callVertexAI(history, mergedConfig);

            // Add assistant response to history
            history.push({ role: 'assistant', content: response });
            this.conversationHistory.set(callId, history);

            logger.info({ callId, responseLength: response.length }, 'AI response generated');
            return response;

        } catch (error) {
            logger.error({ callId, error }, 'Error generating AI response');

            // Fallback to simple response on error
            const fallback = this.generateFallbackResponse(userMessage);
            history.push({ role: 'assistant', content: fallback });
            this.conversationHistory.set(callId, history);

            return fallback;
        }
    }

    /**
     * Call Gemini API with API key (simpler than Vertex AI OAuth)
     */
    private async callVertexAI(
        messages: ConversationMessage[],
        genConfig: GenerationConfig
    ): Promise<string> {
        const apiKey = config.google.apiKey;

        // Use Gemini API with API key - Gemini 2.0 Flash (latest)
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

        // Build the request body
        const contents = this.convertToGeminiFormat(messages);

        const requestBody = {
            contents,
            generationConfig: {
                temperature: genConfig.temperature,
                maxOutputTokens: genConfig.maxOutputTokens,
                topP: genConfig.topP,
                topK: genConfig.topK,
            },
            safetySettings: [
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
            ],
        };

        logger.debug({ endpoint: endpoint.split('?')[0] }, 'Calling Gemini API');

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
        }

        const data = await response.json() as {
            candidates?: Array<{
                content?: { parts?: Array<{ text?: string }> }
            }>
        };

        // Extract text from response
        const candidate = data.candidates?.[0];
        if (!candidate?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response structure from Vertex AI');
        }

        return candidate.content.parts[0].text;
    }

    /**
     * Convert messages to Gemini format
     */
    private convertToGeminiFormat(messages: ConversationMessage[]): any[] {
        const contents: any[] = [];

        // Find system message for context
        const systemMessage = messages.find(m => m.role === 'system');

        for (const msg of messages) {
            if (msg.role === 'system') continue; // Handle separately

            const role = msg.role === 'user' ? 'user' : 'model';
            let text = msg.content;

            // Prepend system context to first user message
            if (msg.role === 'user' && contents.length === 0 && systemMessage) {
                text = `[Context: ${systemMessage.content}]\n\nUser: ${msg.content}`;
            }

            contents.push({
                role,
                parts: [{ text }],
            });
        }

        return contents;
    }

    /**
     * Get Google Cloud access token
     */
    private async getAccessToken(): Promise<string> {
        // In production, use Application Default Credentials
        // For now, we'll use gcloud CLI token or service account

        try {
            // Try to get token from metadata server (when running on GCP)
            const metadataResponse = await fetch(
                'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
                { headers: { 'Metadata-Flavor': 'Google' } }
            );

            if (metadataResponse.ok) {
                const data = await metadataResponse.json() as { access_token: string };
                return data.access_token;
            }
        } catch {
            // Not on GCP, continue to other methods
        }

        // For local development, use gcloud CLI
        const { exec } = await import('child_process');
        const { promisify } = await import('util');
        const execAsync = promisify(exec);

        try {
            const { stdout } = await execAsync('gcloud auth print-access-token');
            return stdout.trim();
        } catch (error) {
            logger.error({ error }, 'Failed to get access token. Run: gcloud auth application-default login');
            throw new Error('Could not obtain Google Cloud access token');
        }
    }

    /**
     * Generate fallback response when AI is not available
     */
    private generateFallbackResponse(userMessage: string): string {
        const lowerMessage = userMessage.toLowerCase();

        // Greeting responses
        if (lowerMessage.includes('hello') || lowerMessage.includes('hi') ||
            lowerMessage.includes('namaste') || lowerMessage.includes('namaskar')) {
            return 'Namaste! Kaise hain aap? Main aapki kya help kar sakta hoon?';
        }

        // Goodbye responses
        if (lowerMessage.includes('bye') || lowerMessage.includes('goodbye') ||
            lowerMessage.includes('alvida') || lowerMessage.includes('bye bye')) {
            return 'Accha ji, bahut accha laga aapse baat karke. Take care!';
        }

        // Thank you responses
        if (lowerMessage.includes('thank') || lowerMessage.includes('dhanyawad') ||
            lowerMessage.includes('shukriya')) {
            return 'Aapka bahut bahut dhanyawad! Koi aur help chahiye?';
        }

        // Yes/No responses
        if (lowerMessage === 'yes' || lowerMessage === 'haan' || lowerMessage === 'ji') {
            return 'Bahut accha! Aage batayein, main sun raha hoon.';
        }
        if (lowerMessage === 'no' || lowerMessage === 'nahi' || lowerMessage === 'na') {
            return 'Theek hai, koi baat nahi. Kya aur kuch help chahiye?';
        }

        // Default response
        return 'Ji haan, main samajh gaya. Please mujhe thoda aur detail mein batayein?';
    }

    /**
     * Get opening greeting for a call
     */
    getGreeting(leadName?: string): string {
        if (leadName) {
            return `Namaste ${leadName} ji! Main aapka AI assistant hoon. Aap kaise hain aaj?`;
        }
        return 'Namaste! Main aapka AI assistant hoon. Aap kaise hain aaj?';
    }

    /**
     * Get closing message
     */
    getClosing(): string {
        return 'Bahut accha laga aapse baat karke. Agar koi aur help chahiye, to please dobara call karein. Dhanyawad, take care!';
    }

    /**
     * Clear conversation history for a call
     */
    clearConversation(callId: string): void {
        this.conversationHistory.delete(callId);
        logger.info({ callId }, 'Conversation history cleared');
    }

    /**
     * Get conversation history for debugging/logging
     */
    getHistory(callId: string): ConversationMessage[] {
        return this.conversationHistory.get(callId) || [];
    }

    /**
     * Get conversation summary for call log
     */
    getConversationSummary(callId: string): string {
        const history = this.conversationHistory.get(callId) || [];
        const messages = history.filter(m => m.role !== 'system');

        return messages
            .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
            .join('\n');
    }
}

// Export singleton instance
export const vertexAI = new VertexAIService();

