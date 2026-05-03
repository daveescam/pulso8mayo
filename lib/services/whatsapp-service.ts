import { getWhatsAppClient } from '@/lib/whatsapp/client-factory';
import { sessionManager } from '@/lib/whatsapp/session-manager';

export class WhatsAppService {
  static async sendMessage(phone: string, message: string): Promise<boolean> {
    try {
      const client = await getWhatsAppClient();
      const session = await sessionManager.getActiveSession(
        process.env.DEFAULT_COMPANY_ID || 'default'
      );

      if (!session) {
        console.error('[WhatsAppService] No active session found');
        return false;
      }

      await client.sendMessage({
        sessionId: session.sessionId,
        to: phone,
        message,
      });

      return true;
    } catch (error) {
      console.error('[WhatsAppService] Failed to send message:', error);
      return false;
    }
  }

  static async createSession(sessionId: string, webhookUrl?: string): Promise<boolean> {
    try {
      const client = await getWhatsAppClient();
      await client.createSession(sessionId);
      return true;
    } catch (error) {
      console.error('[WhatsAppService] Failed to create session:', error);
      return false;
    }
  }
}
