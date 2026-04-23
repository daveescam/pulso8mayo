/**
 * WhatsApp Notification Test Script
 * 
 * Usage: 
 *   pnpm tsx scripts/test-whatsapp.ts
 * 
 * Prerequisites:
 * - .env.local configured with WASENDER_API_KEY
 * - Active WhatsApp session
 * - Test user phone number
 */

import { wasenderClient } from '../lib/whatsapp/wasender-client';
import { whatsappNotificationDispatcher } from '../lib/whatsapp/notification-dispatcher';
import { notificationQueue } from '../lib/whatsapp/notification-queue';
import { sessionManager } from '../lib/whatsapp/session-manager';
import { db } from '../lib/db';
import { users, whatsappSessions, notificationPreferences } from '../lib/db/schema';
import { eq } from 'drizzle-orm';

// Configuration
const TEST_PHONE = process.env.TEST_PHONE || '+5215512345678'; // Replace with test number
const TEST_USER_ID = process.env.TEST_USER_ID; // Replace with test user ID
const COMPANY_ID = process.env.TEST_COMPANY_ID; // Replace with test company ID

async function runTests() {
    console.log('🧪 Starting WhatsApp Notification Tests\n');
    console.log('=========================================\n');

    const results = {
        passed: 0,
        failed: 0,
        skipped: 0,
    };

    // Test 1: Check API Configuration
    console.log('📋 Test 1: Checking API Configuration...');
    try {
        if (!process.env.WASENDER_API_KEY) {
            console.log('❌ WASENDER_API_KEY not configured\n');
            results.skipped++;
        } else {
            console.log('✅ WASENDER_API_KEY configured\n');
            results.passed++;
        }
    } catch (error) {
        console.log('❌ Configuration check failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Test 2: Get or Create Session
    console.log('📋 Test 2: Getting WhatsApp Session...');
    try {
        if (!COMPANY_ID) {
            console.log('❌ TEST_COMPANY_ID not configured, skipping session test\n');
            results.skipped++;
        } else {
            const session = await sessionManager.getActiveSession(COMPANY_ID);
            if (session && session.status === 'CONNECTED') {
                console.log('✅ Active session found:', session.sessionId, '\n');
                results.passed++;
            } else {
                console.log('⚠️ No active session found. Please create one via /api/whatsapp/session\n');
                results.skipped++;
            }
        }
    } catch (error) {
        console.log('❌ Session check failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Test 3: Send Simple Message
    console.log('📋 Test 3: Sending Simple Message...');
    try {
        if (!COMPANY_ID) {
            console.log('❌ Skipped (no COMPANY_ID)\n');
            results.skipped++;
        } else {
            const session = await sessionManager.getActiveSession(COMPANY_ID);
            if (!session) {
                console.log('❌ Skipped (no active session)\n');
                results.skipped++;
            } else {
                const result = await wasenderClient.sendMessage({
                    sessionId: session.sessionId,
                    to: TEST_PHONE,
                    message: '🧪 *Test Message*\n\nThis is a test message from Pulso WhatsApp Notification System.\n\nTimestamp: ' + new Date().toISOString(),
                });

                console.log('✅ Message sent successfully!');
                console.log('   Message ID:', result.messageId, '\n');
                results.passed++;
            }
        }
    } catch (error) {
        console.log('❌ Message send failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Test 4: Send Workflow Assignment
    console.log('📋 Test 4: Sending Workflow Assignment...');
    try {
        if (!TEST_USER_ID) {
            console.log('❌ TEST_USER_ID not configured, skipping\n');
            results.skipped++;
        } else {
            const assignment = {
                instance: { workflowTemplateId: 'Test Workflow - Checklist Apertura' },
                dueDate: new Date(Date.now() + 86400000), // 24 hours
            };

            const success = await whatsappNotificationDispatcher.sendWorkflowAssignment(
                TEST_USER_ID,
                assignment
            );

            if (success) {
                console.log('✅ Workflow assignment sent successfully!\n');
                results.passed++;
            } else {
                console.log('⚠️ Workflow assignment returned false (check logs)\n');
                results.failed++;
            }
        }
    } catch (error) {
        console.log('❌ Workflow assignment failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Test 5: Queue Notification
    console.log('📋 Test 5: Queueing Notification via QStash...');
    try {
        if (!process.env.QSTASH_TOKEN) {
            console.log('⚠️ QSTASH_TOKEN not configured, will use immediate fallback\n');
        }

        if (!TEST_USER_ID) {
            console.log('❌ TEST_USER_ID not configured, skipping\n');
            results.skipped++;
        } else {
            const user = await db.query.users.findFirst({
                where: eq(users.id, TEST_USER_ID),
            });

            if (!user?.phone) {
                console.log('❌ User phone not found, skipping\n');
                results.skipped++;
            } else {
                const notificationId = await notificationQueue.queue({
                    type: 'whatsapp',
                    recipientId: TEST_USER_ID,
                    recipientAddress: user.phone,
                    template: '📋 *Tarea de Prueba*\n\n{{workflowName}}\n\nEste es un mensaje de prueba.',
                    payload: { workflowName: 'Limpieza General' },
                    priority: 'normal',
                    maxRetries: 3,
                });

                console.log('✅ Notification queued!');
                console.log('   Notification ID:', notificationId, '\n');
                results.passed++;
            }
        }
    } catch (error) {
        console.log('❌ Queue notification failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Test 6: Rate Limiting Check
    console.log('📋 Test 6: Testing Rate Limiting...');
    try {
        if (!COMPANY_ID) {
            console.log('❌ Skipped (no COMPANY_ID)\n');
            results.skipped++;
        } else {
            const session = await sessionManager.getActiveSession(COMPANY_ID);
            if (!session) {
                console.log('❌ Skipped (no active session)\n');
                results.skipped++;
            } else {
                const rateLimit = wasenderClient.checkRateLimit(session.sessionId);
                console.log('✅ Rate limit check:');
                console.log('   Allowed:', rateLimit.allowed);
                if (rateLimit.retryAfter) {
                    console.log('   Retry After:', rateLimit.retryAfter, 'seconds\n');
                } else {
                    console.log('   Can send messages now\n');
                }
                results.passed++;
            }
        }
    } catch (error) {
        console.log('❌ Rate limit check failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Test 7: Get User Preferences
    console.log('📋 Test 7: Getting User Notification Preferences...');
    try {
        if (!TEST_USER_ID) {
            console.log('❌ TEST_USER_ID not configured, skipping\n');
            results.skipped++;
        } else {
            const prefs = await db.query.notificationPreferences.findFirst({
                where: eq(notificationPreferences.userId, TEST_USER_ID),
            });

            if (prefs) {
                console.log('✅ User preferences found:');
                console.log('   WhatsApp Enabled:', prefs.whatsappEnabled);
                console.log('   Email Enabled:', prefs.emailEnabled);
                console.log('   In-App Enabled:', prefs.inAppEnabled);
                console.log('   Workflow Assignments:', prefs.workflowAssignments);
                console.log('   Workflow Due Soon:', prefs.workflowDueSoon);
                console.log('   Workflow Overdue:', prefs.workflowOverdue);
                console.log('   Incidents:', prefs.incidents, '\n');
            } else {
                console.log('⚠️ No preferences found, using defaults (all enabled)\n');
            }
            results.passed++;
        }
    } catch (error) {
        console.log('❌ Preferences check failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Test 8: Delivery Stats
    console.log('📋 Test 8: Getting Delivery Statistics...');
    try {
        const stats = await whatsappNotificationDispatcher.getDeliveryStats(
            new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            new Date()
        );

        console.log('✅ Delivery Statistics (Last 24h):');
        console.log('   Total Sent:', stats.totalSent);
        console.log('   Delivered:', stats.delivered);
        console.log('   Read:', stats.read);
        console.log('   Failed:', stats.failed);
        console.log('   Delivery Rate:', stats.deliveryRate.toFixed(2) + '%');
        console.log('   Read Rate:', stats.readRate.toFixed(2) + '%\n');
        results.passed++;
    } catch (error) {
        console.log('❌ Stats retrieval failed:', (error as Error).message, '\n');
        results.failed++;
    }

    // Summary
    console.log('=========================================');
    console.log('📊 Test Summary');
    console.log('=========================================');
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`⚠️  Skipped: ${results.skipped}`);
    console.log('=========================================\n');

    if (results.failed > 0) {
        console.log('⚠️  Some tests failed. Check the logs above for details.\n');
        process.exit(1);
    } else {
        console.log('🎉 All tests passed!\n');
        process.exit(0);
    }
}

// Run tests
runTests().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
