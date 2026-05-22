/**
 * WhatsApp Client Factory
 *
 * Usa WAHA (WhatsApp HTTP API) con motor NOWEB.
 * Singleton lazy-loading para todo el sistema de mensajería WhatsApp.
 *
 * Uso:
 * import { whatsappClient } from '@/lib/whatsapp/client-factory';
 * await whatsappClient.sendMessage({ sessionId, to, message });
 */

import type { SendMessageOptions, SendMediaOptions, RateLimitConfig } from './waha-client';
import type { WAHASession } from './waha-client';

export type WhatsAppSession = WAHASession;

export interface WhatsAppClient {
  sendMessage(options: SendMessageOptions): Promise<{ messageId: string; id?: string }>;
  sendMedia(options: SendMediaOptions): Promise<{ messageId: string; id?: string }>;
  sendImage(sessionId: string, to: string, imageUrl: string, caption?: string): Promise<{ messageId: string }>;
  sendDocument(sessionId: string, to: string, documentUrl: string, caption?: string): Promise<{ messageId: string }>;
  sendWorkflowAssignment(
    sessionId: string,
    phone: string,
    workflowName: string,
    link: string,
    type?: 'ASSIGNED' | 'REMINDER'
  ): Promise<{ messageId: string }>;
  createSession(companyId: string): Promise<WhatsAppSession>;
  getSessions(): Promise<WhatsAppSession[]>;
  getSession(sessionId: string): Promise<WhatsAppSession>;
  getSessionStatus(sessionId: string): Promise<WhatsAppSession>;
  deleteSession(sessionId: string): Promise<void>;
  disconnectSession(sessionId: string): Promise<void>;
  getQRCode(sessionId: string): Promise<{ qrCode?: string; code?: string } | null>;
  isOnWhatsApp(phone: string): Promise<{ exists: boolean; jid?: string }>;
  checkRateLimit(sessionId: string): { allowed: boolean; retryAfter?: number };
  setRateLimits(config: Partial<RateLimitConfig>): void;
  verifyWebhookSignature(payload: string, signature: string): boolean;
  sendBulkMessages(
    sessionId: string,
    messages: Array<{ to: string; message: string }>
  ): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>>;
  getChatHistory(params: { sessionId: string; chatId: string; limit?: number; cursor?: string }): Promise<{ messages: any[]; hasMore: boolean; cursor?: string }>;
  getChats(sessionId: string): Promise<any[]>;
}

let clientInstance: WhatsAppClient | null = null;

export async function getWhatsAppClient(): Promise<WhatsAppClient> {
  if (!clientInstance) {
    const { getWAHAClient } = await import('./waha-client');
    clientInstance = getWAHAClient();
  }
  return clientInstance;
}

export function resetClients(): void {
  clientInstance = null;
}

export function getClientInfo(): { active: string; wahaConfigured: boolean; wahaUrl: string | undefined } {
  return {
    active: 'waha',
    wahaConfigured: !!process.env.WAHA_API_URL,
    wahaUrl: process.env.WAHA_API_URL,
  };
}

export const whatsappClient = {
  sendMessage: async (opts: SendMessageOptions) => { const c = await getWhatsAppClient(); return c.sendMessage(opts); },
  sendMedia: async (opts: SendMediaOptions) => { const c = await getWhatsAppClient(); return c.sendMedia(opts); },
  sendImage: async (sessionId: string, to: string, imageUrl: string, caption?: string) => { const c = await getWhatsAppClient(); return c.sendImage(sessionId, to, imageUrl, caption); },
  sendDocument: async (sessionId: string, to: string, documentUrl: string, caption?: string) => { const c = await getWhatsAppClient(); return c.sendDocument(sessionId, to, documentUrl, caption); },
  sendWorkflowAssignment: async (sessionId: string, phone: string, workflowName: string, link: string, type?: 'ASSIGNED' | 'REMINDER') => { const c = await getWhatsAppClient(); return c.sendWorkflowAssignment(sessionId, phone, workflowName, link, type); },
  createSession: async (companyId: string) => { const c = await getWhatsAppClient(); return c.createSession(companyId); },
  getSessions: async () => { const c = await getWhatsAppClient(); return c.getSessions(); },
  getSession: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.getSession(sessionId); },
  deleteSession: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.deleteSession(sessionId); },
  getQRCode: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.getQRCode(sessionId); },
  checkRateLimit: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.checkRateLimit(sessionId); },
  setRateLimits: async (config: Partial<RateLimitConfig>) => { const c = await getWhatsAppClient(); return c.setRateLimits(config); },
  verifyWebhookSignature: async (payload: string, signature: string) => { const c = await getWhatsAppClient(); return c.verifyWebhookSignature(payload, signature); },
  sendBulkMessages: async (sessionId: string, messages: Array<{ to: string; message: string }>) => { const c = await getWhatsAppClient(); return c.sendBulkMessages(sessionId, messages); },
  getChatHistory: async (params: { sessionId: string; chatId: string; limit?: number; cursor?: string }) => { const c = await getWhatsAppClient(); return c.getChatHistory(params); },
  getChats: async (sessionId: string) => { const c = await getWhatsAppClient(); return c.getChats(sessionId); },
};
