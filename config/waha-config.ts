/**
 * Configuración de WAHA (WhatsApp HTTP API)
 * Motor NOWEB: Sin necesidad de navegador (Chromium)
 * Ventajas: Menor consumo de CPU (~50-100MB vs ~300-500MB) y memoria
 */

import { z } from 'zod';

// Esquema de validación para variables de entorno WAHA
const wahaEnvSchema = z.object({
  WAHA_API_URL: z.string().url().default('http://localhost:3001'),
  WAHA_WEBHOOK_SECRET: z.string().optional(),
  WAHA_DEFAULT_ENGINE: z.enum(['NOWEB', 'WEBJS', 'WPP', 'GOWS', 'VENOM']).default('NOWEB'),
  WAHA_SESSION_STORAGE: z.enum(['sqlite', 'mongodb']).default('sqlite'),
  WAHA_WEBHOOK_URL: z.string().url().optional(),
  WAHA_MONGODB_URI: z.string().url().optional(),
});

// Tipos derivados del esquema
export type WAHAEngine = 'NOWEB' | 'WEBJS' | 'WPP' | 'GOWS' | 'VENOM';
export type WAHASessionStorage = 'sqlite' | 'mongodb';

// Configuración validada de WAHA
export interface WAHAConfig {
  apiUrl: string;
  webhookSecret?: string;
  defaultEngine: WAHAEngine;
  sessionStorage: WAHASessionStorage;
  webhookUrl?: string;
  mongodbUri?: string;
}

// Valores por defecto
const defaultConfig: WAHAConfig = {
  apiUrl: 'http://localhost:3001',
  defaultEngine: 'NOWEB',
  sessionStorage: 'sqlite',
};

/**
 * Obtiene la configuración de WAHA desde variables de entorno
 */
export function getWAHAConfig(): WAHAConfig {
  const env = {
    WAHA_API_URL: process.env.WAHA_API_URL,
    WAHA_WEBHOOK_SECRET: process.env.WAHA_WEBHOOK_SECRET,
    WAHA_DEFAULT_ENGINE: process.env.WAHA_DEFAULT_ENGINE as WAHAEngine,
    WAHA_SESSION_STORAGE: process.env.WAHA_SESSION_STORAGE as WAHASessionStorage,
    WAHA_WEBHOOK_URL: process.env.WAHA_WEBHOOK_URL,
    WAHA_MONGODB_URI: process.env.WAHA_MONGODB_URI,
  };

  try {
    const validated = wahaEnvSchema.parse(env);
    
    return {
      apiUrl: validated.WAHA_API_URL,
      webhookSecret: validated.WAHA_WEBHOOK_SECRET,
      defaultEngine: validated.WAHA_DEFAULT_ENGINE,
      sessionStorage: validated.WAHA_SESSION_STORAGE,
      webhookUrl: validated.WAHA_WEBHOOK_URL,
      mongodbUri: validated.WAHA_MONGODB_URI,
    };
  } catch (error) {
    console.warn('[WAHA Config] Error validando configuración, usando valores por defecto:', error);
    return defaultConfig;
  }
}

/**
 * Configuración del motor NOWEB
 * Documentación: https://waha.devlike.pro/docs/engines/noweb/
 */
export interface NOWEBConfig {
  store: {
    enabled: boolean;  // Guardar mensajes/contactos en base de datos
    fullSync: boolean; // Sincronizar todo el historial vs últimos 3 meses
  };
  markOnline: boolean; // Mostrar "en línea" en WhatsApp
}

/**
 * Obtiene configuración recomendada para NOWEB
 */
export function getNOWEBConfig(): NOWEBConfig {
  return {
    store: {
      enabled: true,
      fullSync: false, // Solo últimos 3 meses para mejor rendimiento
    },
    markOnline: true,
  };
}

/**
 * Endpoints de la API WAHA
 */
export const WAHA_ENDPOINTS = {
  // Health check
  PING: '/api/ping',
  
  // Mensajes
  SEND_TEXT: '/api/sendText',
  SEND_IMAGE: '/api/sendImage',
  SEND_FILE: '/api/sendFile',
  SEND_VOICE: '/api/sendVoice',
  
  // Sesiones
  SESSIONS: '/api/sessions',
  SESSION: (id: string) => `/api/sessions/${id}`,
  SESSION_QR: (id: string) => `/api/sessions/${id}/auth/qr`,
  SESSION_STOP: (id: string) => `/api/sessions/${id}/stop`,
  
  // Chats y mensajes (requiere store habilitado)
  CHATS: (session: string) => `/api/${session}/chats`,
  CHAT_MESSAGES: (session: string, chatId: string) => 
    `/api/${session}/chats/${encodeURIComponent(chatId)}/messages`,
  
  // Utilidades
  CHECK_NUMBER: '/api/checkNumberStatus',
  
  // Webhook
  WEBHOOK: '/api/webhook',
} as const;

/**
 * Estados de sesión en WAHA NOWEB
 */
export const WAHA_SESSION_STATUS = {
  STARTING: 'STARTING',
  SCAN_QR: 'SCAN_QR',
  WORKING: 'WORKING',
  FAILED: 'FAILED',
  STOPPED: 'STOPPED',
} as const;

export type WAHASessionStatus = typeof WAHA_SESSION_STATUS[keyof typeof WAHA_SESSION_STATUS];

/**
 * Mapeo de estados WAHA a estados internos
 */
export function mapWAHAStatusToInternal(wahaStatus: string): string {
  const statusMap: Record<string, string> = {
    'STARTING': 'DISCONNECTED',
    'SCAN_QR': 'CONNECTING',
    'WORKING': 'CONNECTED',
    'FAILED': 'FAILED',
    'STOPPED': 'DISCONNECTED',
  };
  
  return statusMap[wahaStatus] || wahaStatus;
}

/**
 * Mapeo de estados internos a estados WAHA
 */
export function mapInternalStatusToWAHA(internalStatus: string): string {
  const statusMap: Record<string, string> = {
    'DISCONNECTED': 'STOPPED',
    'CONNECTING': 'SCAN_QR',
    'CONNECTED': 'WORKING',
    'FAILED': 'FAILED',
  };
  
  return statusMap[internalStatus] || internalStatus;
}

// Exportar configuración singleton
export const wahaConfig = getWAHAConfig();
