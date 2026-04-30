/**
 * WAHA History Service
 * 
 * Servicio para acceder al historial de mensajes y chats
 * Requiere que WHATSAPP_STORE_ENABLED=true en WAHA
 * 
 * Documentación: https://waha.devlike.pro/docs/engines/noweb/store/
 */

import { getWAHAClient } from './waha-client';

export interface Message {
  id: string;
  timestamp: Date;
  from: string;
  to?: string;
  body: string;
  type: string;
  fromMe: boolean;
  hasMedia: boolean;
  mediaUrl?: string;
  caption?: string;
  ack?: number;
}

export interface Chat {
  id: string;
  name: string;
  phone: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageTime?: Date;
  isGroup: boolean;
}

export interface ChatHistoryOptions {
  limit?: number;
  before?: string; // ID del mensaje para paginación
}

/**
 * Obtener historial de mensajes de un chat
 * 
 * @param session - Nombre de la sesión
 * @param phone - Número de teléfono (sin @c.us)
 * @param options - Opciones de paginación
 * @returns Array de mensajes
 */
export async function getMessageHistory(
  session: string,
  phone: string,
  options: ChatHistoryOptions = {}
): Promise<Message[]> {
  const client = getWAHAClient();

  try {
    const messages = await client.getChatMessages(session, phone, {
      limit: options.limit || 50,
      before: options.before,
    });

    return messages.map((msg: any) => ({
      id: msg.id,
      timestamp: new Date(msg.timestamp * 1000),
      from: msg.from?.replace(/@.*$/, '') || '',
      to: msg.to?.replace(/@.*$/, ''),
      body: msg.body || '',
      type: msg.type || 'chat',
      fromMe: msg.fromMe || false,
      hasMedia: msg.hasMedia || false,
      mediaUrl: msg.mediaUrl,
      caption: msg.caption,
      ack: msg.ack,
    }));
  } catch (error) {
    console.error('[WAHA History] Error fetching messages:', error);
    return [];
  }
}

/**
 * Obtener lista de todos los chats
 * 
 * @param session - Nombre de la sesión
 * @returns Array de chats
 */
export async function getAllChats(session: string): Promise<Chat[]> {
  const client = getWAHAClient();

  try {
    const chats = await client.getChats(session);

    return chats.map((chat: any) => ({
      id: chat.id,
      name: chat.name || chat.id.replace(/@.*$/, ''),
      phone: chat.id.replace(/@.*$/, ''),
      unreadCount: chat.unreadCount || 0,
      lastMessage: chat.lastMessage?.body,
      lastMessageTime: chat.lastMessage?.timestamp 
        ? new Date(chat.lastMessage.timestamp * 1000) 
        : undefined,
      isGroup: chat.id.includes('@g.us'),
    }));
  } catch (error) {
    console.error('[WAHA History] Error fetching chats:', error);
    return [];
  }
}

/**
 * Buscar mensajes por contenido
 * 
 * @param session - Nombre de la sesión
 * @param query - Texto a buscar
 * @param options - Opciones de búsqueda
 * @returns Array de mensajes coincidentes
 */
export async function searchMessages(
  session: string,
  query: string,
  options: { limit?: number; phone?: string } = {}
): Promise<Message[]> {
  try {
    let messages: Message[] = [];

    if (options.phone) {
      // Buscar en un chat específico
      messages = await getMessageHistory(session, options.phone, { limit: 500 });
    } else {
      // Buscar en todos los chats (limitado a los últimos 10)
      const chats = await getAllChats(session);
      const limitedChats = chats.slice(0, 10);
      
      for (const chat of limitedChats) {
        const chatMessages = await getMessageHistory(session, chat.phone, { limit: 100 });
        messages.push(...chatMessages);
      }
    }

    // Filtrar por query
    const searchLower = query.toLowerCase();
    const filtered = messages.filter(msg => 
      msg.body.toLowerCase().includes(searchLower)
    );

    return filtered.slice(0, options.limit || 50);
  } catch (error) {
    console.error('[WAHA History] Error searching messages:', error);
    return [];
  }
}

/**
 * Obtener mensajes no leídos
 * 
 * @param session - Nombre de la sesión
 * @returns Array de mensajes no leídos
 */
export async function getUnreadMessages(session: string): Promise<Message[]> {
  try {
    const chats = await getAllChats(session);
    const unreadChats = chats.filter(c => c.unreadCount > 0);

    const messages: Message[] = [];
    for (const chat of unreadChats) {
      const chatMessages = await getMessageHistory(session, chat.phone, { limit: chat.unreadCount });
      messages.push(...chatMessages.filter(m => !m.fromMe));
    }

    return messages;
  } catch (error) {
    console.error('[WAHA History] Error fetching unread messages:', error);
    return [];
  }
}

/**
 * Marcar chat como leído
 * Nota: Esta funcionalidad requiere implementación adicional en WAHA
 * 
 * @param session - Nombre de la sesión
 * @param phone - Número de teléfono
 */
export async function markChatAsRead(
  session: string,
  phone: string
): Promise<boolean> {
  // WAHA no expone endpoint directo para esto
  // Se puede implementar enviando un ack o read receipt
  console.log('[WAHA History] markChatAsRead not implemented in WAHA API');
  return false;
}

/**
 * Exportar historial de chat
 * 
 * @param session - Nombre de la sesión
 * @param phone - Número de teléfono
 * @param format - Formato de exportación ('json' | 'csv')
 * @returns Datos exportados
 */
export async function exportChatHistory(
  session: string,
  phone: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const messages = await getMessageHistory(session, phone, { limit: 1000 });

  if (format === 'json') {
    return JSON.stringify(messages, null, 2);
  }

  // Formato CSV simple
  const headers = ['timestamp', 'from', 'to', 'type', 'body'];
  const rows = messages.map(m => [
    m.timestamp.toISOString(),
    m.from,
    m.to || '',
    m.type,
    `"${m.body.replace(/"/g, '""')}"`, // Escapar comillas
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

/**
 * Obtener estadísticas de chat
 * 
 * @param session - Nombre de la sesión
 * @param phone - Número de teléfono
 * @returns Estadísticas del chat
 */
export async function getChatStats(
  session: string,
  phone: string
): Promise<{
  totalMessages: number;
  messagesByType: Record<string, number>;
  messagesBySender: Record<string, number>;
  firstMessage: Date | null;
  lastMessage: Date | null;
}> {
  const messages = await getMessageHistory(session, phone, { limit: 1000 });

  const stats = {
    totalMessages: messages.length,
    messagesByType: {} as Record<string, number>,
    messagesBySender: {} as Record<string, number>,
    firstMessage: null as Date | null,
    lastMessage: null as Date | null,
  };

  if (messages.length === 0) {
    return stats;
  }

  // Ordenar por timestamp
  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  stats.firstMessage = sorted[0].timestamp;
  stats.lastMessage = sorted[sorted.length - 1].timestamp;

  // Contar por tipo
  for (const msg of messages) {
    stats.messagesByType[msg.type] = (stats.messagesByType[msg.type] || 0) + 1;
    stats.messagesBySender[msg.from] = (stats.messagesBySender[msg.from] || 0) + 1;
  }

  return stats;
}
