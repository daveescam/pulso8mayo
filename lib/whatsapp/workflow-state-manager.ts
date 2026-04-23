/**
 * WhatsApp Conversation State Manager
 *
 * Manages conversation states for workflow execution via WhatsApp
 */

import { db } from '@/lib/db';
import { eq, and, gt, isNull } from 'drizzle-orm';
import { whatsappConversationStates } from '@/lib/db/schema';

export interface ConversationState {
  id: string;
  userPhone: string;
  userId: string | null;
  workflowInstanceId: string | null;
  currentStepId: string | null;
  stepIndex: number | null;
  status: 'ACTIVE' | 'WAITING_EVIDENCE' | 'COMPLETED' | 'TIMEOUT' | 'CANCELLED';
  lastMessageAt: Date;
  expiresAt: Date | null;
  context: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export class ConversationStateManager {
  /**
   * Get active conversation state for a user
   */
  async getState(userPhone: string): Promise<ConversationState | null> {
    try {
      const state = await db.query.whatsappConversationStates.findFirst({
        where: and(
          eq(whatsappConversationStates.userPhone, userPhone),
          gt(whatsappConversationStates.expiresAt, new Date())
        ),
        orderBy: (states, { desc }) => [desc(states.createdAt)],
      });

      if (!state) {
        return null;
      }

      return this.mapToConversationState(state);
    } catch (error) {
      console.error('[ConversationStateManager] Error getting state:', error);
      return null;
    }
  }

  /**
   * Create new conversation state
   */
  async createState(
    userPhone: string,
    userId: string,
    workflowInstanceId: string
  ): Promise<ConversationState> {
    try {
      // Expire any existing active states
      await db
        .update(whatsappConversationStates)
        .set({
          status: 'TIMEOUT',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(whatsappConversationStates.userPhone, userPhone),
            eq(whatsappConversationStates.status, 'ACTIVE')
          )
        );

      // Create new state with 2-hour expiration
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours

      const [state] = await db
        .insert(whatsappConversationStates)
        .values({
          userPhone,
          userId,
          workflowInstanceId,
          status: 'ACTIVE',
          expiresAt,
          lastMessageAt: new Date(),
        })
        .returning();

      return this.mapToConversationState(state);
    } catch (error) {
      console.error('[ConversationStateManager] Error creating state:', error);
      throw error;
    }
  }

  /**
   * Update conversation state
   */
  async updateState(
    userPhone: string,
    updates: Partial<ConversationState>
  ): Promise<void> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: new Date(),
        // Refresh expiration time
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      };

      await db
        .update(whatsappConversationStates)
        .set(updateData)
        .where(eq(whatsappConversationStates.userPhone, userPhone));
    } catch (error) {
      console.error('[ConversationStateManager] Error updating state:', error);
      throw error;
    }
  }

  /**
   * Mark state as completed
   */
  async completeState(userPhone: string): Promise<void> {
    try {
      await db
        .update(whatsappConversationStates)
        .set({
          status: 'COMPLETED',
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversationStates.userPhone, userPhone));
    } catch (error) {
      console.error('[ConversationStateManager] Error completing state:', error);
      throw error;
    }
  }

  /**
   * Mark state as cancelled
   */
  async cancelState(userPhone: string): Promise<void> {
    try {
      await db
        .update(whatsappConversationStates)
        .set({
          status: 'CANCELLED',
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversationStates.userPhone, userPhone));
    } catch (error) {
      console.error('[ConversationStateManager] Error cancelling state:', error);
      throw error;
    }
  }

  /**
   * Expire state (timeout)
   */
  async expireState(userPhone: string): Promise<void> {
    try {
      await db
        .update(whatsappConversationStates)
        .set({
          status: 'TIMEOUT',
          updatedAt: new Date(),
        })
        .where(eq(whatsappConversationStates.userPhone, userPhone));
    } catch (error) {
      console.error('[ConversationStateManager] Error expiring state:', error);
      throw error;
    }
  }

  /**
   * Clean up expired states
   */
  async cleanupExpiredStates(): Promise<number> {
    try {
      const result = await db
        .update(whatsappConversationStates)
        .set({
          status: 'TIMEOUT',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(whatsappConversationStates.status, 'ACTIVE'),
            gt(new Date(), whatsappConversationStates.expiresAt)
          )
        );

      return result.rowCount || 0;
    } catch (error) {
      console.error('[ConversationStateManager] Error cleaning up expired states:', error);
      return 0;
    }
  }

  /**
   * Map database record to ConversationState interface
   */
  private mapToConversationState(record: any): ConversationState {
    return {
      id: record.id,
      userPhone: record.userPhone,
      userId: record.userId,
      workflowInstanceId: record.workflowInstanceId,
      currentStepId: record.currentStepId,
      stepIndex: record.stepIndex,
      status: record.status,
      lastMessageAt: record.lastMessageAt,
      expiresAt: record.expiresAt,
      context: record.context || {},
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

// Singleton instance
export const conversationStateManager = new ConversationStateManager();
