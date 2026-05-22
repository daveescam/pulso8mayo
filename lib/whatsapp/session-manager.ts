/**
 * WhatsApp Session Manager
 * 
 * Maneja sesiones de WhatsApp para empresas, incluyendo creación,
 * seguimiento de estado y persistencia en base de datos.
 * Usa WAHA (WhatsApp HTTP API) con motor NOWEB.
 */

import { db } from '@/lib/db';
import { whatsappSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Tipos compatibles entre ambos clientes
export interface SessionInfo {
  id: string;
  companyId: string;
  sessionId: string;
  phoneNumber: string | null;
  status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED';
  qrCode: string | null;
  qrCodeExpiresAt: Date | null;
  connectedAt: Date | null;
  lastActivityAt: Date | null;
  isActive: boolean;
  errorCount: number;
}

/**
 * Cliente WhatsApp - WAHA (NOWEB)
 */
async function getWhatsAppClient() {
  const { getWAHAClient } = await import('./waha-client');
  return { client: getWAHAClient() };
}

export class SessionManager {
  /**
   * Crear nueva sesión de WhatsApp para una empresa
   */
  async createSession(companyId: string, userId: string): Promise<SessionInfo> {
    // Verificar si la empresa ya tiene una sesión activa
    const existing = await this.getActiveSession(companyId);
    if (existing) {
      throw new Error('Company already has an active WhatsApp session');
    }

    try {
      const { client } = await getWhatsAppClient();
      
      // Crear sesión vía API
      const apiSession = await client.createSession(companyId);

      // Guardar en base de datos
      const [session] = await db.insert(whatsappSessions).values({
        companyId,
        sessionId: apiSession.sessionId || apiSession.id || '',
        status: (apiSession.status?.toUpperCase() || 'DISCONNECTED') as any,
        qrCode: apiSession.qrCode || null,
        qrCodeExpiresAt: apiSession.expiresAt ? new Date(apiSession.expiresAt) : null,
        webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/whatsapp/webhook`,
        isActive: true,
        createdBy: userId,
      }).returning();

      return this.mapToSessionInfo(session);
    } catch (error) {
      console.error('[SessionManager] Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Obtener sesión activa de una empresa
   */
  async getActiveSession(companyId: string): Promise<SessionInfo | null> {
    const session = await db.query.whatsappSessions.findFirst({
      where: and(
        eq(whatsappSessions.companyId, companyId),
        eq(whatsappSessions.isActive, true)
      ),
    });

    return session ? this.mapToSessionInfo(session) : null;
  }

  /**
   * Obtener sesión por ID
   */
  async getSession(sessionId: string): Promise<SessionInfo | null> {
    const session = await db.query.whatsappSessions.findFirst({
      where: eq(whatsappSessions.sessionId, sessionId),
    });

    return session ? this.mapToSessionInfo(session) : null;
  }

  /**
   * Actualizar estado de sesión
   */
  async updateSessionStatus(
    sessionId: string,
    status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED',
    phoneNumber?: string
  ): Promise<void> {
    const updates: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'CONNECTED') {
      updates.connectedAt = new Date();
      updates.lastActivityAt = new Date();
      updates.qrCode = null;
      updates.qrCodeExpiresAt = null;
    }

    if (status === 'DISCONNECTED' || status === 'FAILED') {
      updates.disconnectedAt = new Date();
    }

    if (phoneNumber) {
      updates.phoneNumber = phoneNumber;
    }

    await db.update(whatsappSessions)
      .set(updates)
      .where(eq(whatsappSessions.sessionId, sessionId));
  }

  /**
   * Refrescar código QR para una sesión
   */
  async refreshQRCode(sessionId: string): Promise<string | null> {
    try {
      const { client } = await getWhatsAppClient();
      const qrCodeData = await client.getQRCode(sessionId);

      const qrCode = qrCodeData?.qrCode || qrCodeData?.code;
      
      if (qrCode) {
        await db.update(whatsappSessions)
          .set({
            qrCode,
            qrCodeExpiresAt: new Date(Date.now() + 60000),
            updatedAt: new Date(),
          })
          .where(eq(whatsappSessions.sessionId, sessionId));
      }

      return qrCode || null;
    } catch (error) {
      console.error('[SessionManager] Failed to refresh QR code:', error);
      return null;
    }
  }

  /**
   * Eliminar una sesión
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      const { client } = await getWhatsAppClient();
      
      // Eliminar de la API
      await client.deleteSession(sessionId);

      // Marcar como inactiva en base de datos
      await db.update(whatsappSessions)
        .set({
          isActive: false,
          status: 'DISCONNECTED',
          disconnectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(whatsappSessions.sessionId, sessionId));
    } catch (error) {
      console.error('[SessionManager] Failed to delete session:', error);
      throw error;
    }
  }

  /**
   * Actualizar timestamp de última actividad
   */
  async updateActivity(sessionId: string): Promise<void> {
    await db.update(whatsappSessions)
      .set({
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappSessions.sessionId, sessionId));
  }

  /**
   * Registrar un error para una sesión
   */
  async recordError(sessionId: string, error: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (!session) return;

    await db.update(whatsappSessions)
      .set({
        lastError: error,
        errorCount: (session.errorCount || 0) + 1,
        updatedAt: new Date(),
      })
      .where(eq(whatsappSessions.sessionId, sessionId));

    // Si hay demasiados errores, marcar como fallida
    if ((session.errorCount || 0) >= 5) {
      await this.updateSessionStatus(sessionId, 'FAILED');
    }
  }

  /**
   * Obtener sesión por ID de empresa
   */
  async getSessionByCompany(companyId: string): Promise<SessionInfo | null> {
    return this.getActiveSession(companyId);
  }

  /**
   * Sincronizar estado de todas las sesiones con la API
   * Útil para mantener estados actualizados
   */
  async syncAllSessions(): Promise<void> {
    try {
      const { client } = await getWhatsAppClient();
      const apiSessions = await client.getSessions();

      for (const apiSession of apiSessions) {
        const sessionId = apiSession.sessionId || apiSession.id;
        if (!sessionId) continue;

        const dbSession = await this.getSession(sessionId);
        if (dbSession) {
          // Actualizar estado si cambió
          const newStatus = (apiSession.status?.toUpperCase() || 'DISCONNECTED') as any;
          if (dbSession.status !== newStatus) {
            await this.updateSessionStatus(
              sessionId,
              newStatus,
              apiSession.phoneNumber || apiSession.phone
            );
          }
        }
      }
    } catch (error) {
      console.error('[SessionManager] Failed to sync sessions:', error);
    }
  }

  /**
   * Mapear registro de base de datos a SessionInfo
   */
  private mapToSessionInfo(session: any): SessionInfo {
    return {
      id: session.id,
      companyId: session.companyId,
      sessionId: session.sessionId,
      phoneNumber: session.phoneNumber,
      status: session.status,
      qrCode: session.qrCode,
      qrCodeExpiresAt: session.qrCodeExpiresAt,
      connectedAt: session.connectedAt,
      lastActivityAt: session.lastActivityAt,
      isActive: session.isActive,
      errorCount: session.errorCount,
    };
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
