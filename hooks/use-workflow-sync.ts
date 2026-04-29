/**
 * useWorkflowSync Hook
 *
 * React hook for real-time workflow synchronization
 * Connects to WebSocket and handles reconnection
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { authClient } from '@/lib/auth-client';

export type WorkflowEventType =
  | 'step_completed'
  | 'step_started'
  | 'evidence_uploaded'
  | 'ai_verified'
  | 'workflow_completed'
  | 'workflow_updated'
  | 'user_joined'
  | 'user_left'
  | 'connected'
  | 'disconnected';

export interface WorkflowEvent {
  type: WorkflowEventType;
  workflowInstanceId: string;
  stepId?: string;
  userId: string;
  timestamp: string;
  data?: Record<string, any>;
}

export interface WorkflowSyncState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  lastEvent: WorkflowEvent | null;
  userCount: number;
}

export interface WorkflowSyncActions {
  sendStepCompleted: (stepId: string, data?: Record<string, any>) => void;
  sendStepStarted: (stepId: string, data?: Record<string, any>) => void;
  sendEvidenceUploaded: (stepId: string, evidenceUrl: string, data?: Record<string, any>) => void;
  sendAiVerified: (stepId: string, result: 'PASS' | 'FAIL' | 'PENDING', data?: Record<string, any>) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWorkflowSync(
  workflowInstanceId: string | null
): WorkflowSyncState & WorkflowSyncActions {
  const { data: session } = authClient.useSession();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const [state, setState] = useState<WorkflowSyncState>({
    connected: false,
    connecting: false,
    error: null,
    lastEvent: null,
    userCount: 0,
  });

  // Get WebSocket URL
  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_WS_HOST || window.location.host;
    const token = session?.user?.id ? btoa(session.user.id) : ''; // Simple token generation
    return `${protocol}//${host}/ws/workflows?token=${token}&workflowId=${workflowInstanceId}`;
  }, [session, workflowInstanceId]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (!workflowInstanceId || !session?.user) {
      setState(prev => ({ ...prev, error: 'Missing workflow ID or session' }));
      return;
    }

    // Close existing connection
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const wsUrl = getWsUrl();
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('[WorkflowSync] Connected');
        reconnectAttemptsRef.current = 0;
        setState(prev => ({ ...prev, connected: true, connecting: false, error: null }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as WorkflowEvent;
          console.log('[WorkflowSync] Received event:', data.type);

          setState(prev => ({
            ...prev,
            lastEvent: data,
            userCount: data.type === 'user_joined' || data.type === 'user_left'
              ? data.data?.userCount || prev.userCount
              : prev.userCount,
          }));
        } catch (error) {
          console.error('[WorkflowSync] Failed to parse message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('[WorkflowSync] Disconnected:', event.code, event.reason);
        wsRef.current = null;
        setState(prev => ({ ...prev, connected: false, connecting: false }));

        // Auto-reconnect on unexpected close
        if (event.code !== 1000 && event.code !== 1001) {
          handleReconnect();
        }
      };

      ws.onerror = (error) => {
        console.error('[WorkflowSync] WebSocket error:', error);
        setState(prev => ({ ...prev, error: 'Connection error', connecting: false }));
      };

    } catch (error) {
      console.error('[WorkflowSync] Failed to connect:', error);
      setState(prev => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }));
    }
  }, [workflowInstanceId, session, getWsUrl]);

  // Handle reconnection with exponential backoff
  const handleReconnect = useCallback(() => {
    const maxReconnectAttempts = 5;
    const baseDelay = 1000; // 1 second

    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
      const delay = Math.min(
        baseDelay * Math.pow(2, reconnectAttemptsRef.current),
        30000 // Max 30 seconds
      );

      reconnectAttemptsRef.current++;
      console.log(`[WorkflowSync] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, delay);
    } else {
      setState(prev => ({
        ...prev,
        error: 'Max reconnection attempts reached. Please refresh the page.',
      }));
    }
  }, [connect]);

  // Disconnect manually
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }

    setState(prev => ({ ...prev, connected: false, connecting: false }));
  }, []);

  // Reconnect manually
  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    connect();
  }, [connect]);

  // Send event helpers
  const sendEvent = useCallback((type: string, data: Record<string, any>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, data }));
    } else {
      console.warn('[WorkflowSync] Cannot send event, not connected');
    }
  }, []);

  const sendStepCompleted = useCallback((stepId: string, data?: Record<string, any>) => {
    sendEvent('step_completed', { stepId, ...data });
  }, [sendEvent]);

  const sendStepStarted = useCallback((stepId: string, data?: Record<string, any>) => {
    sendEvent('step_started', { stepId, ...data });
  }, [sendEvent]);

  const sendEvidenceUploaded = useCallback((stepId: string, evidenceUrl: string, data?: Record<string, any>) => {
    sendEvent('evidence_uploaded', { stepId, evidenceUrl, ...data });
  }, [sendEvent]);

  const sendAiVerified = useCallback((stepId: string, result: 'PASS' | 'FAIL' | 'PENDING', data?: Record<string, any>) => {
    sendEvent('ai_verified', { stepId, result, ...data });
  }, [sendEvent]);

  // Connect on mount and when dependencies change
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  return {
    ...state,
    sendStepCompleted,
    sendStepStarted,
    sendEvidenceUploaded,
    sendAiVerified,
    disconnect,
    reconnect,
  };
}

export default useWorkflowSync;
