/**
 * Document Expiration Check Cron Job
 * 
 * Checks for documents expiring in the next 30 days
 * and sends notifications to users
 */

import { db } from '@/lib/db';
import { employeeDocuments, users, notificationPreferences } from '@/lib/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { NotificationDispatcher } from '@/lib/services/notification-dispatcher';

/**
 * Check for expiring documents and send notifications
 */
export async function checkExpiringDocuments() {
    try {
        console.log('[Document Expiration Check] Starting check...');

        const now = new Date();
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

        // Find documents expiring in next 30 days
        const expiringDocs = await db
            .select({
                id: employeeDocuments.id,
                userId: employeeDocuments.userId,
                documentName: employeeDocuments.documentName,
                documentType: employeeDocuments.documentType,
                expirationDate: employeeDocuments.expirationDate,
                userName: users.name,
                userEmail: users.email,
                userPhone: users.phone,
            })
            .from(employeeDocuments)
            .innerJoin(users, eq(employeeDocuments.userId, users.id))
            .where(
                and(
                    lte(employeeDocuments.expirationDate, thirtyDaysFromNow),
                    gte(employeeDocuments.expirationDate, now),
                    eq(employeeDocuments.status, 'VALIDATED')
                )
            );

        console.log(`[Document Expiration Check] Found ${expiringDocs.length} expiring documents`);

        // Send notifications for each expiring document
        for (const doc of expiringDocs) {
            if (!doc.expirationDate) continue;

            const daysUntilExpiration = Math.ceil(
                (doc.expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            );

            try {
                // Send notification via NotificationDispatcher
                await NotificationDispatcher.sendDocumentExpirationAlert({
                    userId: doc.userId,
                    userName: doc.userName || 'Usuario',
                    documentName: doc.documentName,
                    documentType: doc.documentType,
                    expirationDate: doc.expirationDate,
                    daysUntilExpiration,
                });

                console.log(
                    `[Document Expiration Check] Sent notification for ${doc.documentName} (User: ${doc.userId}, Days: ${daysUntilExpiration})`
                );
            } catch (error) {
                console.error(
                    `[Document Expiration Check] Error sending notification for document ${doc.id}:`,
                    error
                );
            }
        }

        // Mark expired documents
        const expiredDocs = await db
            .update(employeeDocuments)
            .set({
                status: 'EXPIRED',
                updatedAt: new Date(),
            })
            .where(
                and(
                    lte(employeeDocuments.expirationDate, now),
                    eq(employeeDocuments.status, 'VALIDATED')
                )
            );

        console.log(`[Document Expiration Check] Marked ${expiredDocs.rowCount || 0} documents as expired`);

        return {
            success: true,
            expiringCount: expiringDocs.length,
            expiredCount: expiredDocs.rowCount || 0,
        };
    } catch (error) {
        console.error('[Document Expiration Check] Error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Run the check (can be called from cron endpoint)
 */
export async function runDocumentExpirationCheck() {
    console.log('[Document Expiration Check] Running scheduled check...');
    const result = await checkExpiringDocuments();
    console.log('[Document Expiration Check] Check completed:', result);
    return result;
}
