/**
 * WhatsApp Client Factory
 * 
 * Feature flag para migración gradual de WasenderAPI a WAHA NOWEB
 * 
 * Uso:
 * - Establecer USE_WAHA=true en .env para usar WAHA
 * - Sin la variable o USE_WAHA=false usa WasenderAPI (legacy)
 * 
 * Esto permite:
 * 1. Migración gradual
 * 2. Rollback instantáneo si hay problemas
 * 3. Testing A/B comparando ambos motores
 */

import type { WasenderSession, SendMessageOptions, SendMediaOptions, RateLimitConfig } from './wasender-client';
import type { WAHASession } from './waha-client';

// Tipo unificado para ambos clientes
export type WhatsAppSession = WasenderSession | WAHASession;

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

// Cache de clientes
let wasenderClientInstance: WhatsAppClient | null = null;
let wahaClientInstance: WhatsAppClient | null = null;

/**
 * Verificar si WAHA está habilitado
 */
export function isWAHAEnabled(): boolean {
  return process.env.USE_WAHA === 'true';
}

/**
 * Obtener cliente de WhatsApp según feature flag
 * @returns Cliente activo (Wasender o WAHA)
 */
export async function getWhatsAppClient(): Promise<WhatsAppClient> {
  if (isWAHAEnabled()) {
    return getWAHAClient();
  }
  return getWasenderClient();
}

/**
 * Obtener cliente WasenderAPI (Legacy)
 */
export async function getWasenderClient(): Promise<WhatsAppClient> {
  if (!wasenderClientInstance) {
    const { getWasenderClient: getWasender, WasenderClient } = await import('./wasender-client');
    wasenderClientInstance = getWasender();
  }
  return wasenderClientInstance;
}

/**
 * Obtener cliente WAHA NOWEB
 */
export async function getWAHAClient(): Promise<WhatsAppClient> {
  if (!wahaClientInstance) {
    const { getWAHAClient: getWAHA, WAHAClient } = await import('./waha-client');
    wahaClientInstance = getWAHA();
  }
  return wahaClientInstance;
}

/**
 * Resetear caché de clientes
 * Útil para tests o cambios en runtime
 */
export function resetClients(): void {
  wasenderClientInstance = null;
  wahaClientInstance = null;
}

/**
 * Cambiar cliente en runtime
 * @param useWAHA - true para WAHA, false para Wasender
 */
export function setClientMode(useWAHA: boolean): void {
  process.env.USE_WAHA = useWAHA ? 'true' : 'false';
  resetClients();
}

/**
 * Obtener información de ambos clientes
 * Útil para debugging y monitoreo
 */
export function getClientInfo(): {
  active: 'wasender' | 'waha';
  wasenderConfigured: boolean;
  wahaConfigured: boolean;
  wasenderUrl: string | undefined;
  wahaUrl: string | undefined;
} {
  return {
    active: isWAHAEnabled() ? 'waha' : 'wasender',
    wasenderConfigured: !!process.env.WASENDER_API_KEY,
    wahaConfigured: !!process.env.WAHA_API_URL,
    wasenderUrl: process.env.WASENDER_API_URL,
    wahaUrl: process.env.WAHA_API_URL,
  };
}

/**
 * Cliente estático para backward compatibility
 * 
 * Este objeto exporta los métodos más comunes para uso directo
 * sin necesidad de llamar async getWhatsAppClient()
 * 
 * Ejemplo:
 * import { whatsappClient } from '@/lib/whatsapp/client-factory';
 * await whatsappClient.sendMessage({ sessionId, to, message });
 */
export const whatsappClient = {
  sendMessage: async (opts: SendMessageOptions) => {
    const client = await getWhatsAppClient();
    return client.sendMessage(opts);
  },
  sendMedia: async (opts: SendMediaOptions) => {
    const client = await getWhatsAppClient();
    return client.sendMedia(opts);
  },
  sendImage: async (sessionId: string, to: string, imageUrl: string, caption?: string) => {
    const client = await getWhatsAppClient();
    return client.sendImage(sessionId, to, imageUrl, caption);
  },
  sendDocument: async (sessionId: string, to: string, documentUrl: string, caption?: string) => {
    const client = await getWhatsAppClient();
    return client.sendDocument(sessionId, to, documentUrl, caption);
  },
  sendWorkflowAssignment: async (
    sessionId: string,
    phone: string,
    workflowName: string,
    link: string,
    type?: 'ASSIGNED' | 'REMINDER'
  ) => {
    const client = await getWhatsAppClient();
    return client.sendWorkflowAssignment(sessionId, phone, workflowName, link, type);
  },
  createSession: async (companyId: string) => {
    const client = await getWhatsAppClient();
    return client.createSession(companyId);
  },
  getSessions: async () => {
    const client = await getWhatsAppClient();
    return client.getSessions();
  },
  getSession: async (sessionId: string) => {
    const client = await getWhatsAppClient();
    return client.getSession(sessionId);
  },
  deleteSession: async (sessionId: string) => {
    const client = await getWhatsAppClient();
    return client.deleteSession(sessionId);
  },
  getQRCode: async (sessionId: string) => {
    const client = await getWhatsAppClient();
    return client.getQRCode(sessionId);
  },
  checkRateLimit: async (sessionId: string) => {
    const client = await getWhatsAppClient();
    return client.checkRateLimit(sessionId);
  },
  setRateLimits: async (config: Partial<RateLimitConfig>) => {
    const client = await getWhatsAppClient();
    return client.setRateLimits(config);
  },
  verifyWebhookSignature: async (payload: string, signature: string) => {
    const client = await getWhatsAppClient();
    return client.verifyWebhookSignature(payload, signature);
  },
  sendBulkMessages: async (sessionId: string, messages: Array<{ to: string; message: string }>) => {
    const client = await getWhatsAppClient();
    return client.sendBulkMessages(sessionId, messages);
  },
  getChatHistory: async (params: { sessionId: string; chatId: string; limit?: number; cursor?: string }) => {
    const client = await getWhatsAppClient();
    return client.getChatHistory(params);
  },
  getChats: async (sessionId: string) => {
    const client = await getWhatsAppClient();
    return client.getChats(sessionId);
  },
};
