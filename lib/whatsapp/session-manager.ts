/**
 * WhatsApp Session Manager
 * 
 * Manages WhatsApp sessions for companies, including creation, status tracking,
 * and database persistence.
 */

import { db } from '@/lib/db';
import { whatsappSessions } from '@/lib/db/schema';
import { wasenderClient, type WasenderSession } from './wasender-client';
import { eq, and } from 'drizzle-orm';

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
}

export class SessionManager {
    /**
     * Create a new WhatsApp session for a company
     */
    async createSession(companyId: string, userId: string): Promise<SessionInfo> {
        // Check if company already has an active session
        const existing = await this.getActiveSession(companyId);
        if (existing) {
            throw new Error('Company already has an active WhatsApp session');
        }

        try {
            // Create session via WasenderAPI
            const wasenderSession = await wasenderClient.createSession(companyId);

            // Store in database
            const [session] = await db.insert(whatsappSessions).values({
                companyId,
                sessionId: wasenderSession.sessionId,
                status: wasenderSession.status.toUpperCase() as any,
                qrCode: wasenderSession.qrCode || null,
                qrCodeExpiresAt: wasenderSession.expiresAt ? new Date(wasenderSession.expiresAt) : null,
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
     * Get active session for a company
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
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<SessionInfo | null> {
        const session = await db.query.whatsappSessions.findFirst({
            where: eq(whatsappSessions.sessionId, sessionId),
        });

        return session ? this.mapToSessionInfo(session) : null;
    }

    /**
     * Update session status
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
            updates.qrCode = null; // Clear QR code once connected
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
     * Refresh QR code for a session
     */
    async refreshQRCode(sessionId: string): Promise<string | null> {
        try {
            const qrCode = await wasenderClient.getQRCode(sessionId);

            if (qrCode) {
                await db.update(whatsappSessions)
                    .set({
                        qrCode,
                        qrCodeExpiresAt: new Date(Date.now() + 60000), // 1 minute expiry
                        updatedAt: new Date(),
                    })
                    .where(eq(whatsappSessions.sessionId, sessionId));
            }

            return qrCode;
        } catch (error) {
            console.error('[SessionManager] Failed to refresh QR code:', error);
            return null;
        }
    }

    /**
     * Delete a session
     */
    async deleteSession(sessionId: string): Promise<void> {
        try {
            // Delete from WasenderAPI
            await wasenderClient.deleteSession(sessionId);

            // Mark as inactive in database
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
     * Update last activity timestamp
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
     * Record an error for a session
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

        // If too many errors, mark as failed
        if ((session.errorCount || 0) >= 5) {
            await this.updateSessionStatus(sessionId, 'FAILED');
        }
    }

    /**
     * Get session by company ID
     */
    async getSessionByCompany(companyId: string): Promise<SessionInfo | null> {
        return this.getActiveSession(companyId);
    }

    /**
     * Map database record to SessionInfo
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
