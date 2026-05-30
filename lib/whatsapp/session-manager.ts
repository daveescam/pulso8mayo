import { db } from '@/lib/db';
import { whatsappSessions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

const DEFAULT_SESSION_ID = 'default';

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

function createDefaultSession(companyId?: string): SessionInfo {
  return {
    id: DEFAULT_SESSION_ID,
    companyId: companyId || 'default',
    sessionId: DEFAULT_SESSION_ID,
    phoneNumber: null,
    status: 'CONNECTED',
    qrCode: null,
    qrCodeExpiresAt: null,
    connectedAt: new Date(),
    lastActivityAt: new Date(),
    isActive: true,
    errorCount: 0,
  };
}

export class SessionManager {
  async createSession(_companyId: string, _userId: string): Promise<SessionInfo> {
    return createDefaultSession(_companyId);
  }

  async getActiveSession(companyId: string): Promise<SessionInfo | null> {
    return createDefaultSession(companyId);
  }

  async getSession(sessionId: string): Promise<SessionInfo | null> {
    return createDefaultSession();
  }

  async updateSessionStatus(
    _sessionId: string,
    _status: 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'FAILED',
    _phoneNumber?: string
  ): Promise<void> {
    // no-op: WHAPI channel status is managed externally
  }

  async refreshQRCode(_sessionId: string): Promise<string | null> {
    return null;
  }

  async deleteSession(sessionId: string): Promise<void> {
    await db.update(whatsappSessions)
      .set({
        isActive: false,
        status: 'DISCONNECTED',
        disconnectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(whatsappSessions.sessionId, sessionId));
  }

  async updateActivity(_sessionId: string): Promise<void> {
    // no-op: activity tracking handled by WHAPI
  }

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
  }

  async getSessionByCompany(companyId: string): Promise<SessionInfo | null> {
    return createDefaultSession(companyId);
  }

  async syncAllSessions(): Promise<void> {
    // no-op: WHAPI channels are managed externally
  }
}

export const sessionManager = new SessionManager();
