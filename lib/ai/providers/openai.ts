
import OpenAI from 'openai';
import { AIAnalysisResult, AIProviderConfig } from './moondream';

export class OpenAIProvider {
    private client: OpenAI;
    private model: string;

    constructor(config: AIProviderConfig) {
        this.client = new OpenAI({
            apiKey: config.apiKey,
        });
        this.model = config.model || 'gpt-4-vision-preview';
    }

    async analyzeImage(imageUrl: string, prompt: string): Promise<AIAnalysisResult> {
        try {
            const response = await this.client.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: "user",
                        content: [
                            { type: "text", text: prompt },
                            {
                                type: "image_url",
                                image_url: {
                                    "url": imageUrl,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 300,
            });

            const content = response.choices[0].message.content || '';

            // OpenAI usually gives better reasoning, we can ask for JSON in prompt
            // For now, consistent with Moondream basic implementation
            const isCompliant = !content.toLowerCase().includes('non-compliant') &&
                !content.toLowerCase().includes('fail');

            return {
                isCompliant,
                confidence: 0.95, // OpenAI is generally more robust
                description: content,
                rawResponse: response
            };

        } catch (error) {
            console.error('OpenAI analysis failed:', error);
            throw error;
        }
    }
}
