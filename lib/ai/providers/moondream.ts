
export interface AIProviderConfig {
    apiKey: string;
    model?: string;
    maxTokens?: number;
}

export interface AIAnalysisResult {
    isCompliant: boolean;
    confidence: number;
    description: string;
    detectedValues?: Record<string, any>;
    rawResponse?: any;
}

export class MoondreamProvider {
    private apiKey: string;
    private baseUrl = 'https://api.moondream.ai/v1';

    constructor(config: AIProviderConfig) {
        this.apiKey = config.apiKey;
    }

    async analyzeImage(imageUrl: string, prompt: string): Promise<AIAnalysisResult> {
        try {
            let base64Image = imageUrl;

            // If it's a URL, fetch and convert to base64
            if (imageUrl.startsWith('http')) {
                try {
                    console.log(`[Moondream] Fetching image for base64 conversion: ${imageUrl}`);
                    const imageRes = await fetch(imageUrl);
                    if (!imageRes.ok) throw new Error(`Failed to fetch image: ${imageRes.statusText}`);
                    const arrayBuffer = await imageRes.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const mimeType = imageRes.headers.get('content-type') || 'image/jpeg';
                    base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;
                } catch (imgError) {
                    console.error('[Moondream] Image fetch failed:', imgError);
                    throw new Error(`Failed to download image for analysis: ${imgError}`);
                }
            }

            const response = await fetch(`${this.baseUrl}/query`, {
                method: 'POST',
                headers: {
                    'X-Moondream-Auth': this.apiKey,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image_url: base64Image,
                    question: prompt,
                    stream: false
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Moondream API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            const answer = data.answer || '';

            // Simple heuristic to determine compliance from text
            // In a real scenario, we might want to ask for JSON output or specific keywords
            const isCompliant = !answer.toLowerCase().includes('no') &&
                !answer.toLowerCase().includes('dirty') &&
                !answer.toLowerCase().includes('fail');

            return {
                isCompliant,
                confidence: 0.9, // Moondream often doesn't return confidence, placeholder
                description: answer,
                rawResponse: data
            };

        } catch (error) {
            console.error('Moondream analysis failed:', error);
            throw error;
        }
    }
}
