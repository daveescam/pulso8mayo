import { whapiConfig, WHAPI_BASE_URL } from '@/config/whapi-config';

export class WhapiNotConfiguredError extends Error {
  constructor() {
    super('WHAPI_API_TOKEN not configured');
    this.name = 'WhapiNotConfiguredError';
  }
}

function assertConfigured(): void {
  if (!whapiConfig.apiToken) {
    throw new WhapiNotConfiguredError();
  }
}

export interface WAHASession {
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

function formatChatId(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.includes('@')) return clean;
  return `${clean}@s.whatsapp.net`;
}

async function whapiFetch(path: string, options: RequestInit = {}): Promise<any> {
  assertConfigured();
  const url = `${WHAPI_BASE_URL}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${whapiConfig.apiToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    console.error('[WhapiClient] API Error:', {
      endpoint: path,
      status: response.status,
      body: errorBody,
    });
    throw new Error(`WHAPI request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export class WhapiClient {
  async sendMessage(options: SendMessageOptions): Promise<{ messageId: string; id?: string }> {
    const to = formatChatId(options.to);
    const data = await whapiFetch('/messages/text', {
      method: 'POST',
      body: JSON.stringify({ to, body: options.message }),
    });
    return { messageId: data.id || 'unknown', id: data.id };
  }

  async sendMedia(options: SendMediaOptions): Promise<{ messageId: string; id?: string }> {
    const to = formatChatId(options.to);

    const endpointMap: Record<string, string> = {
      image: '/messages/image',
      video: '/messages/video',
      document: '/messages/document',
      audio: '/messages/audio',
    };

    const endpoint = endpointMap[options.type || 'image'] || '/messages/image';
    const body: Record<string, any> = { to, media: options.mediaUrl };
    if (options.caption) body.caption = options.caption;

    const data = await whapiFetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return { messageId: data.id || 'unknown', id: data.id };
  }

  async sendImage(sessionId: string, to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }> {
    return this.sendMedia({ sessionId, to, mediaUrl: imageUrl, caption, type: 'image' });
  }

  async sendDocument(sessionId: string, to: string, documentUrl: string, caption?: string): Promise<{ messageId: string }> {
    return this.sendMedia({ sessionId, to, mediaUrl: documentUrl, caption, type: 'document' });
  }

  async sendWorkflowAssignment(
    sessionId: string,
    phone: string,
    workflowName: string,
    link: string,
    type: 'ASSIGNED' | 'REMINDER' = 'ASSIGNED'
  ): Promise<{ messageId: string }> {
    let message = '';
    if (type === 'ASSIGNED') {
      message = `📋 *Nueva Tarea Asignada*\n\nSe te ha asignado el workflow: *${workflowName}*.\n\nPor favor complétalo aquí:\n${link}`;
    } else {
      message = `⏰ *Recordatorio*\n\nTienes pendiente el workflow: *${workflowName}*.\n\nAccede aquí:\n${link}`;
    }
    return this.sendMessage({ sessionId, to: phone, message });
  }

  async createSession(_companyId: string): Promise<WAHASession> {
    return { status: 'CONNECTED' as const };
  }

  async getSessions(): Promise<WAHASession[]> {
    return [{ status: 'CONNECTED' as const }];
  }

  async getSession(_sessionId: string): Promise<WAHASession> {
    return { status: 'CONNECTED' as const };
  }

  async getSessionStatus(_sessionId: string): Promise<WAHASession> {
    return { status: 'CONNECTED' as const };
  }

  async deleteSession(_sessionId: string): Promise<void> {
    // no-op: WHAPI channels are managed externally
  }

  async disconnectSession(_sessionId: string): Promise<void> {
    // no-op: WHAPI channels are managed externally
  }

  async getQRCode(_sessionId: string): Promise<{ qrCode?: string; code?: string } | null> {
    return null;
  }

  async isOnWhatsApp(phone: string): Promise<{ exists: boolean; jid?: string }> {
    try {
      const to = formatChatId(phone);
      const data = await whapiFetch(`/contacts/${encodeURIComponent(to)}`);
      return { exists: !!data.id, jid: data.id };
    } catch {
      return { exists: false };
    }
  }

  checkRateLimit(_sessionId: string): { allowed: boolean; retryAfter?: number } {
    return { allowed: true };
  }

  setRateLimits(_config: Partial<RateLimitConfig>): void {
    // no-op: WHAPI manages rate limits server-side
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    return true;
  }

  async sendBulkMessages(
    sessionId: string,
    messages: Array<{ to: string; message: string }>
  ): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
    const results = [];
    for (const msg of messages) {
      try {
        const result = await this.sendMessage({ sessionId, to: msg.to, message: msg.message });
        results.push({ to: msg.to, success: true, messageId: result.messageId });
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

  async getChatHistory(params: { sessionId: string; chatId: string; limit?: number; cursor?: string }): Promise<{ messages: any[]; hasMore: boolean; cursor?: string }> {
    try {
      const chatId = formatChatId(params.chatId);
      const queryParams = new URLSearchParams({ count: String(params.limit || 50) });
      if (params.cursor) queryParams.set('offset', params.cursor);

      const data = await whapiFetch(`/messages?chat_id=${encodeURIComponent(chatId)}&${queryParams.toString()}`);
      return {
        messages: data.messages || [],
        hasMore: (data.messages?.length || 0) >= (params.limit || 50),
        cursor: params.cursor,
      };
    } catch (error) {
      console.error('[WhapiClient] Error fetching chat history:', error);
      return { messages: [], hasMore: false };
    }
  }

  async getChats(_sessionId: string): Promise<any[]> {
    try {
      const data = await whapiFetch('/chats');
      return data.chats || [];
    } catch (error) {
      console.error('[WhapiClient] Error fetching chats:', error);
      return [];
    }
  }
}

let whapiClientInstance: WhapiClient | null = null;

export function getWhapiClient(): WhapiClient {
  if (!whapiClientInstance) {
    whapiClientInstance = new WhapiClient();
  }
  return whapiClientInstance;
}

export function resetWhapiClient(): void {
  whapiClientInstance = null;
}

export function isWhatsAppConfigured(): boolean {
  return !!process.env.WHAPI_API_TOKEN;
}
