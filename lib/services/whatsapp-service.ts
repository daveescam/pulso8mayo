
export class WhatsAppService {
    private static apiUrl = process.env.WASENDER_API_URL || 'https://api.wasender.com/api'; // Default or from env
    private static apiKey = process.env.WASENDER_API_KEY;

    static async sendMessage(phone: string, text: string) {
        if (!this.apiKey) {
            console.warn("[WhatsApp] No API Key configured. Mocking send:", text);
            return { success: true, mock: true };
        }

        try {
            const response = await fetch(`${this.apiUrl}/messages/send`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    phone: phone,
                    message: text,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`[WhatsApp] Failed to send message to ${phone}: ${response.status}`, errorText);
                throw new Error(`WhatsApp Send Failed: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[WhatsApp] Error sending message:", error);
            throw error; // Re-throw to let caller handle or retry
        }
    }

    static async createSession(branchId: string) {
        if (!this.apiKey) {
            console.warn("[WhatsApp] No API Key. Mocking session.");
            return { qrCode: "mock-qr-code-data", sessionId: `wa-${branchId}` };
        }

        try {
            const response = await fetch(`${this.apiUrl}/sessions/create`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${this.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    sessionId: `branch-${branchId}`, // Unique session per branch
                    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to create session: ${await response.text()}`);
            }

            return await response.json();
        } catch (error) {
            console.error("[WhatsApp] Session creation failed:", error);
            throw error;
        }
    }
}
