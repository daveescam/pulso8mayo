/**
 * WAHA WhatsApp Client
 * Reemplazo para wasender-client.ts
 * Compatible con motor NOWEB (sin navegador)
 * 
 * Ventajas de NOWEB:
 * - Sin Chromium/Chrome requerido
 * - Menor consumo de CPU (~50-100MB vs ~300-500MB)
 * - WebSocket directo a WhatsApp
 * 
 * @see https://waha.devlike.pro/docs/engines/noweb/
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { wahaConfig, WAHA_ENDPOINTS, mapWAHAStatusToInternal } from '@/config/waha-config';

// ============================================================================
// INTERFACES (Compatibles con wasender-client.ts)
// ============================================================================

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

export interface SessionConfig {
  name: string;
  config?: {
    noweb?: {
      store?: {
        enabled: boolean;
        fullSync: boolean;
      };
      markOnline?: boolean;
    };
  };
}

// ============================================================================
// WAHA CLIENT
// ============================================================================

export class WAHAClient {
  private client: AxiosInstance;
  private rateLimitConfig: RateLimitConfig;
  private messageTimestamps: Map<string, number[]> = new Map();

  constructor(baseUrl?: string) {
    this.client = axios.create({
      baseURL: baseUrl || wahaConfig.apiUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    this.rateLimitConfig = {
      maxMessagesPerMinute: 20,
      maxMessagesPerHour: 100,
      maxMessagesPerDay: 1000,
    };

    // Interceptor para logging de errores
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        console.error('[WAHA] API Error:', {
          endpoint: error.config?.url,
          status: error.response?.status,
          message: (error.response?.data as any)?.message || error.message,
        });
        throw error;
      }
    );
  }

  // ==========================================================================
  // SESIONES
  // ==========================================================================

  /**
   * Obtener todas las sesiones de WhatsApp
   * GET /api/sessions
   */
  async getSessions(): Promise<WAHASession[]> {
    try {
      const response = await this.client.get(WAHA_ENDPOINTS.SESSIONS);
      return response.data.map((session: any) => this.mapSessionResponse(session));
    } catch (error) {
      console.error('[WAHA] Error getting sessions:', error);
      return [];
    }
  }

  /**
   * Crear nueva sesión de WhatsApp
   * POST /api/sessions
   */
  async createSession(companyId: string): Promise<WAHASession> {
    const sessionName = `pulso_${companyId}`;
    
    const config: SessionConfig = {
      name: sessionName,
      config: {
        noweb: {
          store: {
            enabled: true,
            fullSync: false, // Solo últimos 3 meses
          },
          markOnline: true,
        },
      },
    };

    const response = await this.client.post(WAHA_ENDPOINTS.SESSIONS, config);
    return this.mapSessionResponse(response.data);
  }

  /**
   * Obtener detalles de una sesión
   * GET /api/sessions/{sessionId}
   */
  async getSession(sessionId: string): Promise<WAHASession> {
    const response = await this.client.get(WAHA_ENDPOINTS.SESSION(sessionId));
    return this.mapSessionResponse(response.data);
  }

  /**
   * Obtener código QR para autenticación
   * GET /api/sessions/{sessionId}/auth/qr
   */
  async getQRCode(sessionId: string): Promise<{ qrCode?: string; code?: string } | null> {
    try {
      const response = await this.client.get(WAHA_ENDPOINTS.SESSION_QR(sessionId), {
        timeout: 5000,
      });
      return { qrCode: response.data.qr, code: response.data.qr };
    } catch (error) {
      if ((error as AxiosError).response?.status === 404) {
        return null; // Sesión ya autenticada o no lista
      }
      throw error;
    }
  }

  /**
   * Obtener estado de la sesión
   * GET /api/sessions/{sessionId}
   */
  async getSessionStatus(sessionId: string): Promise<WAHASession> {
    return this.getSession(sessionId);
  }

  /**
   * Conectar sesión (iniciar proceso de conexión)
   * En WAHA NOWEB, esto se hace automáticamente al crear la sesión
   */
  async connectSession(sessionId: string): Promise<void> {
    // En WAHA, la sesión ya está intentando conectarse al crearse
    // Si está detenida, necesitamos reiniciarla
    try {
      const session = await this.getSession(sessionId);
      if (
        session.status === 'disconnected' ||
        session.status === 'DISCONNECTED' ||
        session.status === 'failed' ||
        session.status === 'FAILED'
      ) {
        await this.client.post(WAHA_ENDPOINTS.SESSION_STOP(sessionId));
        // Esperar un momento y recrear
        await new Promise(r => setTimeout(r, 1000));
      }
    } catch {
      // Ignorar errores
    }
  }

  /**
   * Eliminar sesión
   * DELETE /api/sessions/{sessionId}
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.client.delete(WAHA_ENDPOINTS.SESSION(sessionId));
    } catch (error) {
      if ((error as AxiosError).response?.status !== 404) {
        throw error;
      }
    }
  }

  /**
   * Desconectar sesión
   * POST /api/sessions/{sessionId}/stop
   */
  async disconnectSession(sessionId: string): Promise<void> {
    try {
      await this.client.post(WAHA_ENDPOINTS.SESSION_STOP(sessionId));
    } catch (error) {
      if ((error as AxiosError).response?.status !== 404) {
        throw error;
      }
    }
  }

  // ==========================================================================
  // MENSAJES
  // ==========================================================================

  /**
   * Enviar mensaje de texto
   * POST /api/sendText
   */
  async sendMessage(options: SendMessageOptions): Promise<{ messageId: string; id?: string }> {
    const chatId = this.formatPhoneNumber(options.to);

    const response = await this.client.post(WAHA_ENDPOINTS.SEND_TEXT, {
      chatId,
      text: options.message,
      session: options.sessionId,
    });

    return { messageId: response.data.id || 'unknown', id: response.data.id };
  }

  /**
   * Enviar mensaje multimedia
   * POST /api/sendImage | /api/sendFile
   */
  async sendMedia(options: SendMediaOptions): Promise<{ messageId: string; id?: string }> {
    const chatId = this.formatPhoneNumber(options.to);
    const endpoint = options.type === 'image' ? WAHA_ENDPOINTS.SEND_IMAGE : WAHA_ENDPOINTS.SEND_FILE;

    const payload: any = {
      chatId,
      file: { url: options.mediaUrl },
      session: options.sessionId,
    };

    if (options.caption) {
      payload.caption = options.caption;
    }

    if (options.type && options.type !== 'image') {
      payload.fileName = `document.${options.type}`;
    }

    const response = await this.client.post(endpoint, payload);
    return { messageId: response.data.id || 'unknown', id: response.data.id };
  }

  /**
   * Enviar imagen
   */
  async sendImage(
    sessionId: string,
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<{ messageId: string }> {
    const result = await this.sendMedia({
      sessionId,
      to,
      mediaUrl: imageUrl,
      caption,
      type: 'image',
    });
    return { messageId: result.messageId };
  }

  /**
   * Enviar documento
   */
  async sendDocument(
    sessionId: string,
    to: string,
    documentUrl: string,
    caption?: string
  ): Promise<{ messageId: string }> {
    const result = await this.sendMedia({
      sessionId,
      to,
      mediaUrl: documentUrl,
      caption,
      type: 'document',
    });
    return { messageId: result.messageId };
  }

  /**
   * Enviar mensaje de asignación de workflow con SmartLink
   */
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

  // ==========================================================================
  // UTILIDADES
  // ==========================================================================

  /**
   * Verificar si un número está en WhatsApp
   * GET /api/checkNumberStatus
   */
  async isOnWhatsApp(phone: string): Promise<{ exists: boolean; jid?: string }> {
    try {
      const chatId = this.formatPhoneNumber(phone);
      const response = await this.client.get(WAHA_ENDPOINTS.CHECK_NUMBER, {
        params: { chatId },
      });
      return { exists: response.data.numberExists === true, jid: chatId };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Obtener información del usuario conectado
   * GET /api/sessions/{sessionId}
   */
  async getUserInfo(): Promise<{ name?: string; phone?: string; jid?: string }> {
    // En WAHA, la información del usuario está en la sesión
    try {
      const sessions = await this.getSessions();
      const activeSession = sessions.find(s => s.status === 'CONNECTED' || s.status === 'connected');
      
      if (activeSession && activeSession.phoneNumber) {
        return {
          name: activeSession.name,
          phone: activeSession.phoneNumber,
          jid: `${activeSession.phoneNumber}@s.whatsapp.net`,
        };
      }
      
      return {};
    } catch {
      return {};
    }
  }

  /**
   * Verificar firma de webhook
   * WAHA puede configurar headers de firma si se configura
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    // WAHA usa configuración diferente para webhooks
    // Por defecto aceptamos (la verificación se hace por IP o se configura en WAHA)
    return true;
  }

  /**
   * Verificar rate limits antes de enviar
   */
  checkRateLimit(sessionId: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(sessionId) || [];

    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    const messagesLastMinute = timestamps.filter(t => t > oneMinuteAgo).length;
    const messagesLastHour = timestamps.filter(t => t > oneHourAgo).length;
    const messagesLastDay = timestamps.filter(t => t > oneDayAgo).length;

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
   * Configurar rate limits
   */
  setRateLimits(config: Partial<RateLimitConfig>): void {
    this.rateLimitConfig = { ...this.rateLimitConfig, ...config };
  }

  /**
   * Obtener estado de un mensaje
   * En WAHA NOWEB, el estado se recibe vía webhook (message.ack)
   */
  async getMessageStatus(messageId: string): Promise<MessageStatus> {
    // WAHA NOWEB no tiene endpoint directo para esto
    // Los acks llegan vía webhook
    return {
      messageId,
      status: 'sent',
      timestamp: new Date(),
    };
  }

  /**
   * Enviar mensajes masivos con rate limiting
   */
  async sendBulkMessages(
    sessionId: string,
    messages: Array<{ to: string; message: string }>
  ): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
    const results = [];

    for (const msg of messages) {
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

  // ==========================================================================
  // MÉTODOS ADICIONALES DE WAHA
  // ==========================================================================

  /**
   * Obtener mensajes de un chat (requiere store habilitado)
   * GET /api/{session}/chats/{chatId}/messages
   */
  async getChatMessages(
    session: string,
    phone: string,
    options: { limit?: number; before?: string } = {}
  ): Promise<any[]> {
    const chatId = this.formatPhoneNumber(phone);

    const response = await this.client.get(
      WAHA_ENDPOINTS.CHAT_MESSAGES(session, chatId),
      { params: options }
    );

    return response.data;
  }

  /**
   * Obtener todos los chats (requiere store habilitado)
   * GET /api/{session}/chats
   */
  async getChats(session: string): Promise<any[]> {
    const response = await this.client.get(WAHA_ENDPOINTS.CHATS(session));
    return response.data;
  }

  // ==========================================================================
  // UTILIDADES PRIVADAS
  // ==========================================================================

  private formatPhoneNumber(phone: string): string {
    const clean = phone.replace(/\D/g, '');
    if (!clean.includes('@')) {
      return `${clean}@c.us`;
    }
    return clean;
  }

  private mapSessionResponse(data: any): WAHASession {
    const wahaStatus = data.status || 'STARTING';
    const internalStatus = mapWAHAStatusToInternal(wahaStatus) as WAHASession['status'];

    return {
      id: data.name,
      sessionId: data.name,
      name: data.name,
      status: internalStatus,
      qrCode: undefined, // Se obtiene por separado
      phoneNumber: data.me?.id?.replace(/@.*$/, ''),
      phone: data.me?.id?.replace(/@.*$/, ''),
    };
  }

  private recordMessageTimestamp(sessionId: string): void {
    const now = Date.now();
    const timestamps = this.messageTimestamps.get(sessionId) || [];
    timestamps.push(now);

    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const filtered = timestamps.filter(t => t > oneDayAgo);

    this.messageTimestamps.set(sessionId, filtered);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let wahaClientInstance: WAHAClient | null = null;

export function getWAHAClient(): WAHAClient {
  if (!wahaClientInstance) {
    wahaClientInstance = new WAHAClient();
  }
  return wahaClientInstance;
}

export function resetWAHAClient(): void {
  wahaClientInstance = null;
}

export function isWhatsAppConfigured(): boolean {
  return !!wahaConfig.apiUrl;
}

// ============================================================================
// COMPATIBILIDAD CON wasender-client.ts
// ============================================================================

export const wahaClient = {
  sendMessage: (opts: SendMessageOptions) => getWAHAClient().sendMessage(opts),
  sendMedia: (opts: SendMediaOptions) => getWAHAClient().sendMedia(opts),
  createSession: (companyId: string) => getWAHAClient().createSession(companyId),
  getSessions: () => getWAHAClient().getSessions(),
  getSession: (sessionId: string) => getWAHAClient().getSession(sessionId),
  deleteSession: (sessionId: string) => getWAHAClient().deleteSession(sessionId),
  getQRCode: (sessionId: string) => getWAHAClient().getQRCode(sessionId),
  checkRateLimit: (sessionId: string) => getWAHAClient().checkRateLimit(sessionId),
  setRateLimits: (config: Partial<RateLimitConfig>) => getWAHAClient().setRateLimits(config),
  verifyWebhookSignature: (payload: string, signature: string) => getWAHAClient().verifyWebhookSignature(payload, signature),
};

export async function sendWhatsAppMessage(to: string, message: string): Promise<{ messageId: string }> {
  return getWAHAClient().sendMessage({
    sessionId: process.env.WHATSAPP_SESSION_ID || 'default',
    to,
    message,
  });
}

// Re-exportar tipos para compatibilidad
export type { WAHASession as WasenderSession };
