/**
 * WasenderAPI Client
 *
 * Client for interacting with WasenderAPI to manage WhatsApp sessions
 * and send messages.
 *
 * API Base URL: https://api.wasender.com
 *
 * @see https://wasenderapi.com/api-docs
 */       


import { createHmac } from 'crypto';

// WASENDER API uses base URL without /v1
const WASENDER_API_URL = process.env.WASENDER_API_URL || 'https://api.wasender.com';
const WASENDER_API_KEY = process.env.WASENDER_API_KEY || '';

const WHATSAPP_CONFIGURED = !!WASENDER_API_KEY;

if (process.env.NODE_ENV === 'production' && !WHATSAPP_CONFIGURED) {
  console.warn('[WhatsApp] WARNING: Missing WASENDER_API_KEY in production. WhatsApp functionality will be disabled.');
}

if (!WASENDER_API_KEY) {
  console.warn('[WhatsApp] WASENDER_API_KEY not set. WhatsApp functionality will be disabled.');
}

export function isWhatsAppConfigured(): boolean {
  return WHATSAPP_CONFIGURED;
}

export interface WasenderSession {
  id?: string;
  sessionId?: string;
  name?: string;
  status: 'disconnected' | 'connecting' | 'connected' | 'failed' | 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
  qrCode?: string;
  phoneNumber?: string;
  phone?: string;
  expiresAt?: string;
  webhook?: string;
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
  type?: 'image' | 'video' | 'document' | 'audio';
}

export interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
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
   * Get all WhatsApp sessions
   * GET /api/whatsapp-sessions
   */
  async getSessions(): Promise<WasenderSession[]> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get sessions: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Create a new WhatsApp session
   * POST /api/whatsapp-sessions
   */
  async createSession(companyId: string): Promise<WasenderSession> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        name: `pulso_${companyId}`,
        webhook: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create session: ${response.status} - ${error}`);
    }

    return response.json();
  }

  /**
   * Get WhatsApp session details
   * GET /api/whatsapp-sessions/{sessionId}
   */
  async getSession(sessionId: string): Promise<WasenderSession> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions/${sessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get QR code for session
   * GET /api/whatsapp-sessions/{sessionId}/qrcode
   */
  async getQRCode(sessionId: string): Promise<{ qrCode?: string; code?: string } | null> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions/${sessionId}/qrcode`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Failed to get QR code: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Get session status
   * GET /api/status
   */
  async getSessionStatus(sessionId: string): Promise<WasenderSession> {
    // Some endpoints use session in header or body
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions/${sessionId}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      // Fallback to sessions endpoint
      const session = await this.getSession(sessionId);
      return session;
    }

    return response.json();
  }

  /**
   * Connect a WhatsApp session (start the connection process)
   * POST /api/whatsapp-sessions/{sessionId}/connect
   */
  async connectSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions/${sessionId}/connect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to connect session: ${response.status}`);
    }
  }

  /**
   * Delete a session
   * DELETE /api/whatsapp-sessions/{sessionId}
   */
  async deleteSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete session: ${response.status}`);
    }
  }

  /**
   * Disconnect a session
   * POST /api/whatsapp-sessions/{sessionId}/disconnect
   */
  async disconnectSession(sessionId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/whatsapp-sessions/${sessionId}/disconnect`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to disconnect session: ${response.status}`);
    }
  }

  /**
   * Send a text message
   * POST /api/send-message
   */
  async sendMessage(options: SendMessageOptions): Promise<{ messageId: string; id?: string }> {
    const response = await fetch(`${this.baseUrl}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        session: options.sessionId,
        phone: options.to,
        message: options.message,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send message: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return { messageId: data.messageId || data.id || 'unknown', id: data.id };
  }

  /**
   * Send a media message (image, video, document, audio)
   * POST /api/send-message
   */
  async sendMedia(options: SendMediaOptions): Promise<{ messageId: string; id?: string }> {
    const response = await fetch(`${this.baseUrl}/api/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        session: options.sessionId,
        phone: options.to,
        type: options.type || 'image',
        mediaUrl: options.mediaUrl,
        caption: options.caption,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send media: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return { messageId: data.messageId || data.id || 'unknown', id: data.id };
  }

  /**
   * Send an image message
   */
  async sendImage(sessionId: string, to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }> {
    return this.sendMedia({ sessionId, to, mediaUrl: imageUrl, caption, type: 'image' });
  }

  /**
   * Send a document
   */
  async sendDocument(sessionId: string, to: string, documentUrl: string, caption?: string): Promise<{ messageId: string }> {
    return this.sendMedia({ sessionId, to, mediaUrl: documentUrl, caption, type: 'document' });
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
   * Check if a number is on WhatsApp
   * GET /api/on-whatsapp/{phone}
   */
  async isOnWhatsApp(phone: string): Promise<{ exists: boolean; jid?: string }> {
    const cleanPhone = phone.replace('@c.us', '').replace('@s.whatsapp.net', '');

    const response = await fetch(`${this.baseUrl}/api/on-whatsapp/${cleanPhone}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      return { exists: false };
    }

    const data = await response.json();
    return { exists: true, jid: data.jid };
  }

  /**
   * Get user info for the connected session
   * GET /api/user
   */
  async getUserInfo(): Promise<{ name?: string; phone?: string; jid?: string }> {
    const response = await fetch(`${this.baseUrl}/api/user`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.WASENDER_WEBHOOK_SECRET || '';
    const expectedSignature = createHmac('sha256', secret)
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
   * GET /api/messages/{messageId}/info
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    const response = await fetch(`${this.baseUrl}/api/messages/${messageId}/info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get message status: ${response.status}`);
    }

    const data = await response.json();
    return {
      messageId: data.messageId || messageId,
      status: data.status || 'unknown',
      timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
      error: data.error,
    };
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

// Singleton instance - lazy initialization to avoid build-time errors
let wasenderClientInstance: WasenderClient | null = null;

export function getWasenderClient(): WasenderClient {
  if (!wasenderClientInstance) {
    wasenderClientInstance = new WasenderClient();
  }
  return wasenderClientInstance;
}

// Export singleton instance (for backward compatibility)
export const wasenderClient = {
  sendMessage: (opts: SendMessageOptions) => getWasenderClient().sendMessage(opts),
  sendMedia: (opts: SendMediaOptions) => getWasenderClient().sendMedia(opts),
  createSession: (companyId: string) => getWasenderClient().createSession(companyId),
  getSessions: () => getWasenderClient().getSessions(),
  getSession: (sessionId: string) => getWasenderClient().getSession(sessionId),
  deleteSession: (sessionId: string) => getWasenderClient().deleteSession(sessionId),
  getQRCode: (sessionId: string) => getWasenderClient().getQRCode(sessionId),
  checkRateLimit: (sessionId: string) => getWasenderClient().checkRateLimit(sessionId),
  setRateLimits: (config: Partial<RateLimitConfig>) => getWasenderClient().setRateLimits(config),
  verifyWebhookSignature: (payload: string, signature: string) => getWasenderClient().verifyWebhookSignature(payload, signature),
};

/**
 * Standalone function to send WhatsApp message (for backward compatibility)
 */
export async function sendWhatsAppMessage(to: string, message: string): Promise<{ messageId: string }> {
  return getWasenderClient().sendMessage({
    sessionId: process.env.WHATSAPP_SESSION_ID || 'default',
    to,
    message,
  });
}
