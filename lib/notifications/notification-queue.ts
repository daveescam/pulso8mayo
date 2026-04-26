import { Client as QStashClient, resend } from "@upstash/qstash";
import { NotificationPayload, NotificationEventType } from "@/lib/services/notification-dispatcher";
import { NotificationRouter } from "./notification-router";

export interface QueueNotificationPayload extends NotificationPayload {
    id: string;
    createdAt: number;
    attempts: number;
    maxAttempts: number;
    nextAttemptAt?: number;
}

export interface QueueStatus {
    queued: number;
    processing: number;
    failed: number;
    completed: number;
}

export class NotificationQueue {
    private static client: QStashClient | null = null;

    private static getClient(): QStashClient | null {
        if (!this.client) {
            const apiKey = process.env.QSTASH_API_KEY || process.env.QSTASH_TOKEN;
            if (!apiKey) {
                console.warn("QStash API key not configured - notifications will be queued in memory");
                return null;
            }
            this.client = new QStashClient({
                token: apiKey
            });
        }
        return this.client;
    }

    // In-memory queue fallback
    private static memoryQueue: QueueNotificationPayload[] = [];
    private static processingSet = new Set<string>();
    private static failedQueue: QueueNotificationPayload[] = [];
    private static completedQueue: QueueNotificationPayload[] = [];

    /**
     * Enqueue notification for async processing
     */
    static async enqueue(payload: NotificationPayload): Promise<string> {
        const notificationId = this.generateId();
        const queuePayload: QueueNotificationPayload = {
            ...payload,
            id: notificationId,
            createdAt: Date.now(),
            attempts: 0,
            maxAttempts: 5
        };

        const client = this.getClient();

        if (client) {
            // Use QStash for queueing
            try {
                await client.publish({
                    url: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/notifications/process`,
                    body: JSON.stringify(queuePayload),
                    headers: {
                        "Content-Type": "application/json"
                    },
                    retries: 3
                });

                console.log(`[QStash] Notification ${notificationId} queued`);
                return notificationId;
            } catch (error) {
                console.error("[QStash] Error queuing notification, falling back to memory queue:", error);
                // Fallback to memory queue
            }
        }

        // Fallback to in-memory queue
        this.memoryQueue.push(queuePayload);
        console.log(`[Memory] Notification ${notificationId} queued`);
        return notificationId;
    }

    /**
     * Enqueue multiple notifications
     */
    static async enqueueBatch(payloads: NotificationPayload[]): Promise<string[]> {
        const ids = await Promise.all(
            payloads.map(payload => this.enqueue(payload))
        );
        return ids;
    }

    /**
     * Process next notification from queue
     */
    static async processNext(): Promise<QueueNotificationPayload | null> {
        // Check memory queue
        const next = this.memoryQueue.shift();
        if (next) {
            this.processingSet.add(next.id);
            return next;
        }

        return null;
    }

    /**
     * Mark notification as completed
     */
    static async complete(notificationId: string): Promise<void> {
        this.processingSet.delete(notificationId);

        const completed = this.memoryQueue.find(n => n.id === notificationId);
        if (completed) {
            this.completedQueue.push(completed);
        }
    }

    /**
     * Mark notification as failed and schedule retry
     */
    static async fail(notificationId: string, error: Error): Promise<void> {
        this.processingSet.delete(notificationId);

        const failed = this.memoryQueue.find(n => n.id === notificationId);
        if (failed) {
            failed.attempts += 1;

            if (failed.attempts >= failed.maxAttempts) {
                // Max attempts reached, move to failed queue
                this.failedQueue.push(failed);
                console.error(`[Queue] Notification ${notificationId} failed permanently:`, error.message);
            } else {
                // Schedule retry with exponential backoff
                const delayMs = Math.min(1000 * Math.pow(2, failed.attempts), 30000);
                failed.nextAttemptAt = Date.now() + delayMs;
                this.memoryQueue.push(failed);
                console.log(`[Queue] Notification ${notificationId} scheduled for retry (attempt ${failed.attempts}/${failed.maxAttempts})`);
            }
        }
    }

    /**
     * Retry failed notifications
     */
    static async retryFailed(): Promise<number> {
        const retryable = this.failedQueue.filter(n => n.attempts < n.maxAttempts);
        
        for (const notification of retryable) {
            notification.attempts = 0; // Reset attempts
            notification.nextAttemptAt = undefined;
            this.memoryQueue.push(notification);
        }

        this.failedQueue = this.failedQueue.filter(n => n.attempts >= n.maxAttempts);
        
        return retryable.length;
    }

    /**
     * Get queue status
     */
    static async getStatus(): Promise<QueueStatus> {
        return {
            queued: this.memoryQueue.length,
            processing: this.processingSet.size,
            failed: this.failedQueue.length,
            completed: this.completedQueue.length
        };
    }

    /**
     * Clear completed notifications from memory
     */
    static async clearCompleted(): Promise<void> {
        this.completedQueue = [];
        console.log("[Queue] Completed notifications cleared");
    }

    /**
     * Get failed notifications
     */
    static async getFailed(): Promise<QueueNotificationPayload[]> {
        return this.failedQueue;
    }

    /**
     * Process notification with routing
     * This is called by the /api/notifications/process endpoint
     */
    static async processNotification(payload: QueueNotificationPayload): Promise<void> {
        try {
            // Route notification
            await NotificationRouter.sendWithRouting(payload);
            
            // Mark as completed
            await this.complete(payload.id);
            
            console.log(`[Queue] Notification ${payload.id} processed successfully`);
        } catch (error) {
            // Mark as failed and schedule retry
            await this.fail(payload.id, error as Error);
            throw error;
        }
    }

    /**
     * Generate unique notification ID
     */
    private static generateId(): string {
        return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Start queue processor (for background processing)
     * Call this once on server startup
     */
    static startProcessor(): void {
        console.log("[Queue] Starting background processor...");
        
        setInterval(async () => {
            // Process notifications that are ready
            const readyNotifications = this.memoryQueue.filter(
                n => !n.nextAttemptAt || n.nextAttemptAt <= Date.now()
            );

            for (const notification of readyNotifications) {
                // Remove from queue
                const index = this.memoryQueue.indexOf(notification);
                if (index > -1) {
                    this.memoryQueue.splice(index, 1);
                }

                // Process
                try {
                    await this.processNotification(notification);
                } catch (error) {
                    console.error("[Queue] Error processing notification:", error);
                }
            }
        }, 1000); // Check every second
    }
}

// Auto-start processor on module load (in server environment)
if (typeof window === "undefined") {
    NotificationQueue.startProcessor();
}
