/**
 * WasenderAPI Client
 *
 * Client for interacting with WasenderAPI to manage WhatsApp sessions
 * and send messages.
 *
 * @see https://docs.wasender.com
 */

const WASENDER_API_URL = process.env.WASENDER_API_URL || 'https://api.wasender.com/v1';
const WASENDER_API_KEY = process.env.WASENDER_API_KEY;

if (!WASENDER_API_KEY) {
    console.warn('WASENDER_API_KEY not set. WhatsApp functionality will be disabled.');
}

export interface WasenderSession {
    sessionId: string;
    status: 'disconnected' | 'connecting' | 'connected' | 'failed';
    qrCode?: string;
    phoneNumber?: string;
    expiresAt?: string;
}

export interface SendMessageOptions {
    sessionId: string;
    to: string;
    message: string;
}

export interface SendMediaOptions {
    sessionId: string;
    to: string;
    mediaUrl: string;
    caption?: string;
}

export interface MessageStatus {
    messageId: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp?: Date;
    error?: string;
}

export interface RateLimitConfig {
    maxMessagesPerMinute: number;
    maxMessagesPerHour: number;
    maxMessagesPerDay: number;
}

export class WasenderClient {
    private apiKey: string;
    private baseUrl: string;
    private rateLimitConfig: RateLimitConfig;
    private messageTimestamps: Map<string, number[]> = new Map();

    constructor(apiKey?: string, baseUrl?: string) {
        this.apiKey = apiKey || WASENDER_API_KEY || '';
        this.baseUrl = baseUrl || WASENDER_API_URL;
        this.rateLimitConfig = {
            maxMessagesPerMinute: 20, // WhatsApp recommended limit
            maxMessagesPerHour: 100,
            maxMessagesPerDay: 1000,
        };
    }

    /**
     * Create a new WhatsApp session
     */
    async createSession(companyId: string): Promise<WasenderSession> {
        const response = await fetch(`${this.baseUrl}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                sessionId: `pulso_${companyId}`,
                webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to create session: ${error.message}`);
        }

        const data = await response.json();
        return {
            sessionId: data.sessionId,
            status: data.status,
            qrCode: data.qrCode,
            expiresAt: data.expiresAt,
        };
    }

    /**
     * Get QR code for session
     */
    async getQRCode(sessionId: string): Promise<string | null> {
        const response = await fetch(`${this.baseUrl}/sessions/${sessionId}/qr`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            if (response.status === 404) {
                return null;
            }
            throw new Error('Failed to get QR code');
        }

        const data = await response.json();
        return data.qrCode;
    }

    /**
     * Get session status
     */
    async getSessionStatus(sessionId: string): Promise<WasenderSession> {
        const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to get session status');
        }

        const data = await response.json();
        return {
            sessionId: data.sessionId,
            status: data.status,
            phoneNumber: data.phoneNumber,
        };
    }

    /**
     * Delete a session
     */
    async deleteSession(sessionId: string): Promise<void> {
        const response = await fetch(`${this.baseUrl}/sessions/${sessionId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete session');
        }
    }

    /**
     * Send a text message
     */
    async sendMessage(options: SendMessageOptions): Promise<{ messageId: string }> {
        const response = await fetch(`${this.baseUrl}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                sessionId: options.sessionId,
                to: options.to,
                type: 'text',
                text: options.message,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to send message: ${error.message}`);
        }

        const data = await response.json();
        return { messageId: data.messageId };
    }

    /**
     * Send a media message (image, document, etc.)
     */
    async sendMedia(options: SendMediaOptions): Promise<{ messageId: string }> {
        const response = await fetch(`${this.baseUrl}/messages/send`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`,
            },
            body: JSON.stringify({
                sessionId: options.sessionId,
                to: options.to,
                type: 'media',
                mediaUrl: options.mediaUrl,
                caption: options.caption,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`Failed to send media: ${error.message}`);
        }

        const data = await response.json();
        return { messageId: data.messageId };
    }

    /**
     * Send a formatted workflow assignment message with SmartLink
     */
    async sendWorkflowAssignment(
        sessionId: string,
        phone: string,
        workflowName: string,
        link: string,
        type: 'ASSIGNED' | 'REMINDER' = 'ASSIGNED'
    ): Promise<{ messageId: string }> {
        let message = "";

        if (type === 'ASSIGNED') {
            message = `📋 *Nueva Tarea Asignada*\n\nSe te ha asignado el workflow: *${workflowName}*.\n\nPor favor complétalo aquí:\n${link}`;
        } else {
            message = `⏰ *Recordatorio*\n\nTienes pendiente el workflow: *${workflowName}*.\n\nAccede aquí:\n${link}`;
        }

        return this.sendMessage({ sessionId, to: phone, message });
    }

    /**
     * Verify webhook signature
     */
    verifyWebhookSignature(payload: string, signature: string): boolean {
        const crypto = require('crypto');
        const secret = process.env.WASENDER_WEBHOOK_SECRET || '';
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payload)
            .digest('hex');

        return signature === expectedSignature;
    }

    /**
     * Check rate limits before sending message
     */
    checkRateLimit(sessionId: string): { allowed: boolean; retryAfter?: number } {
        const now = Date.now();
        const timestamps = this.messageTimestamps.get(sessionId) || [];

        // Filter timestamps for different time windows
        const oneMinuteAgo = now - 60 * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;
        const oneDayAgo = now - 24 * 60 * 60 * 1000;

        const messagesLastMinute = timestamps.filter(t => t > oneMinuteAgo).length;
        const messagesLastHour = timestamps.filter(t => t > oneHourAgo).length;
        const messagesLastDay = timestamps.filter(t => t > oneDayAgo).length;

        // Check limits
        if (messagesLastMinute >= this.rateLimitConfig.maxMessagesPerMinute) {
            return { allowed: false, retryAfter: 60 };
        }
        if (messagesLastHour >= this.rateLimitConfig.maxMessagesPerHour) {
            return { allowed: false, retryAfter: 3600 };
        }
        if (messagesLastDay >= this.rateLimitConfig.maxMessagesPerDay) {
            return { allowed: false, retryAfter: 86400 };
        }

        return { allowed: true };
    }

    /**
     * Record message timestamp for rate limiting
     */
    private recordMessageTimestamp(sessionId: string): void {
        const now = Date.now();
        const timestamps = this.messageTimestamps.get(sessionId) || [];
        timestamps.push(now);

        // Keep only last 24 hours of timestamps
        const oneDayAgo = now - 24 * 60 * 60 * 1000;
        const filtered = timestamps.filter(t => t > oneDayAgo);

        this.messageTimestamps.set(sessionId, filtered);
    }

    /**
     * Get message delivery status
     */
    async getMessageStatus(sessionId: string, messageId: string): Promise<MessageStatus> {
        try {
            const response = await fetch(`${this.baseUrl}/messages/${messageId}/status`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to get message status');
            }

            const data = await response.json();
            return {
                messageId: data.messageId,
                status: data.status,
                timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
                error: data.error,
            };
        } catch (error) {
            console.error('[WasenderClient] Failed to get message status:', error);
            throw error;
        }
    }

    /**
     * Send bulk messages with rate limiting
     */
    async sendBulkMessages(
        sessionId: string,
        messages: Array<{ to: string; message: string }>
    ): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
        const results = [];

        for (const msg of messages) {
            // Check rate limit
            const rateLimit = this.checkRateLimit(sessionId);
            if (!rateLimit.allowed) {
                results.push({
                    to: msg.to,
                    success: false,
                    error: `Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`,
                });
                continue;
            }

            try {
                const result = await this.sendMessage({
                    sessionId,
                    to: msg.to,
                    message: msg.message,
                });

                this.recordMessageTimestamp(sessionId);
                results.push({
                    to: msg.to,
                    success: true,
                    messageId: result.messageId,
                });
            } catch (error) {
                results.push({
                    to: msg.to,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        return results;
    }

    /**
     * Configure rate limits
     */
    setRateLimits(config: Partial<RateLimitConfig>): void {
        this.rateLimitConfig = {
            ...this.rateLimitConfig,
            ...config,
        };
    }
}

// Singleton instance
export const wasenderClient = new WasenderClient();

/**
 * Standalone function to send WhatsApp message (for backward compatibility)
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<{ messageId: string }> {
    return wasenderClient.sendMessage({
        sessionId: process.env.WHATSAPP_SESSION_ID || 'default',
        to,
        message,
    });
}
