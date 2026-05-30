import { whapiConfig, WHAPI_BASE_URL } from '@/config/whapi-config';

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
  before?: string;
}

function formatChatId(phone: string): string {
  const clean = phone.replace(/\D/g, '');
  if (clean.includes('@')) return clean;
  return `${clean}@s.whatsapp.net`;
}

function mapWhapiMessage(msg: any): Message {
  return {
    id: msg.id,
    timestamp: new Date(msg.timestamp * 1000),
    from: (msg.from || msg.chat_id || '').replace(/@.*$/, ''),
    to: msg.chat_id?.replace(/@.*$/, ''),
    body: msg.text?.body || msg.caption || '',
    type: msg.type || 'text',
    fromMe: msg.from_me || false,
    hasMedia: !!msg.media,
    mediaUrl: msg.media,
    caption: msg.caption,
  };
}

export async function getMessageHistory(
  _session: string,
  phone: string,
  options: ChatHistoryOptions = {}
): Promise<Message[]> {
  if (!whapiConfig.apiToken) return [];

  try {
    const chatId = formatChatId(phone);
    const params = new URLSearchParams({ count: String(options.limit || 50) });
    const url = `${WHAPI_BASE_URL}/messages?chat_id=${encodeURIComponent(chatId)}&${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${whapiConfig.apiToken}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.messages || []).map(mapWhapiMessage);
  } catch (error) {
    console.error('[Whapi History] Error fetching messages:', error);
    return [];
  }
}

export async function getAllChats(_session: string): Promise<Chat[]> {
  if (!whapiConfig.apiToken) return [];

  try {
    const url = `${WHAPI_BASE_URL}/chats`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${whapiConfig.apiToken}`,
      },
    });

    if (!response.ok) return [];

    const data = await response.json();
    return (data.chats || []).map((chat: any) => ({
      id: chat.id,
      name: chat.name || chat.id.replace(/@.*$/, ''),
      phone: chat.id.replace(/@.*$/, ''),
      unreadCount: chat.unread || 0,
      lastMessage: chat.last_message?.body,
      lastMessageTime: chat.last_message?.timestamp
        ? new Date(chat.last_message.timestamp * 1000)
        : undefined,
      isGroup: chat.id.includes('@g.us'),
    }));
  } catch (error) {
    console.error('[Whapi History] Error fetching chats:', error);
    return [];
  }
}

export async function searchMessages(
  session: string,
  query: string,
  options: { limit?: number; phone?: string } = {}
): Promise<Message[]> {
  try {
    let messages: Message[] = [];

    if (options.phone) {
      messages = await getMessageHistory(session, options.phone, { limit: 500 });
    } else {
      const chats = await getAllChats(session);
      const limitedChats = chats.slice(0, 10);

      for (const chat of limitedChats) {
        const chatMessages = await getMessageHistory(session, chat.phone, { limit: 100 });
        messages.push(...chatMessages);
      }
    }

    const searchLower = query.toLowerCase();
    const filtered = messages.filter(msg =>
      msg.body.toLowerCase().includes(searchLower)
    );

    return filtered.slice(0, options.limit || 50);
  } catch (error) {
    console.error('[Whapi History] Error searching messages:', error);
    return [];
  }
}

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
    console.error('[Whapi History] Error fetching unread messages:', error);
    return [];
  }
}

export async function markChatAsRead(
  _session: string,
  _phone: string
): Promise<boolean> {
  return false;
}

export async function exportChatHistory(
  session: string,
  phone: string,
  format: 'json' | 'csv' = 'json'
): Promise<string> {
  const messages = await getMessageHistory(session, phone, { limit: 1000 });

  if (format === 'json') {
    return JSON.stringify(messages, null, 2);
  }

  const headers = ['timestamp', 'from', 'to', 'type', 'body'];
  const rows = messages.map(m => [
    m.timestamp.toISOString(),
    m.from,
    m.to || '',
    m.type,
    `"${m.body.replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}

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

  if (messages.length === 0) return stats;

  const sorted = [...messages].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  stats.firstMessage = sorted[0].timestamp;
  stats.lastMessage = sorted[sorted.length - 1].timestamp;

  for (const msg of messages) {
    stats.messagesByType[msg.type] = (stats.messagesByType[msg.type] || 0) + 1;
    stats.messagesBySender[msg.from] = (stats.messagesBySender[msg.from] || 0) + 1;
  }

  return stats;
}
