/**
 * Test WASENDER API with correct endpoints
 * Uses session already connected
 */

import { config } from 'dotenv';
config();

// Config from .env and user
const API_KEY = process.env.WASENDER_API_KEY || '';
const API_URL = 'https://api.wasender.com'; // WASENDER base URL (no /v1)

// Your connected WhatsApp number
const CONNECTED_PHONE = '528183031981@c.us'; // Connected session phone
const TEST_RECIPIENT = '528183031981@c.us'; // Send test to same number

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_URL}${endpoint}`;
  console.log(`  → ${options.method || 'GET'} ${endpoint}`);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        ...options.headers,
      },
    });

    const text = await response.text();
    let data: T | null = null;

    try {
      data = JSON.parse(text) as T;
    } catch {
      data = text as unknown as T;
    }

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${text || response.statusText}`,
      };
    }

    return { success: true, data: data || undefined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function testWasenderReal() {
  console.log('🧪 Testing WASENDER API with Correct Endpoints\n');
  console.log('===========================================\n');

  // Test 1: Get all sessions
  console.log('1️⃣  GET /api/whatsapp-sessions');
  const sessionsResult = await makeRequest<any[]>('/api/whatsapp-sessions');

  if (sessionsResult.success) {
    const sessions = sessionsResult.data || [];
    console.log(`   ✅ Found ${sessions.length} session(s)`);

    if (sessions.length > 0) {
      sessions.forEach((session: any, i: number) => {
        console.log(`\n   Session ${i + 1}:`);
        console.log(`     ID: ${session.id || session.sessionId}`);
        console.log(`     Name: ${session.name}`);
        console.log(`     Status: ${session.status}`);
        console.log(`     Phone: ${session.phone || session.phoneNumber || 'N/A'}`);
      });

      const activeSession = sessions.find((s: any) => s.status === 'connected' || s.status === 'CONNECTED');

      if (activeSession) {
        const sessionId = activeSession.id || activeSession.sessionId;
        console.log(`\n   ✅ Using connected session: ${sessionId}`);

        // Test 2: Send a test message
        console.log('\n2️⃣  POST /api/send-message');
        console.log(`   Sending test message to: ${TEST_RECIPIENT}`);

        const testMessage = '🧪 Test from Pulso HORECA\n\n' +
          '¡Hola! Este es un mensaje de prueba desde el sistema Pulso HORECA usando WASENDER API.\n\n' +
          '✅ La integración está funcionando correctamente.\n\n' +
          '_Fecha: ' + new Date().toLocaleString('es-MX') + '_';

        const messageResult = await makeRequest<any>('/api/send-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session: sessionId,
            phone: TEST_RECIPIENT,
            message: testMessage,
          }),
        });

        if (messageResult.success) {
          console.log('   ✅ Message sent successfully!');
          console.log(`   Message ID: ${messageResult.data?.messageId || messageResult.data?.id || 'N/A'}`);
          console.log(`\n   📱 Check your WhatsApp at: ${TEST_RECIPIENT.replace('@c.us', '')}`);
        } else {
          console.log(`   ❌ Failed: ${messageResult.error}`);
        }

        // Test 3: Check if number is on WhatsApp
        console.log('\n3️⃣  GET /api/on-whatsapp/{phone}');
        const phoneToCheck = TEST_RECIPIENT.replace('@c.us', '');
        const onWhatsAppResult = await makeRequest<any>(`/api/on-whatsapp/${phoneToCheck}`);

        if (onWhatsAppResult.success) {
          console.log(`   ✅ Number ${phoneToCheck} is on WhatsApp`);
          console.log(`   JID: ${onWhatsAppResult.data?.jid || 'N/A'}`);
        } else {
          console.log(`   ⚠️  Check result: ${onWhatsAppResult.error}`);
        }

        // Test 4: Get user info
        console.log('\n4️⃣  GET /api/user');
        const userResult = await makeRequest<any>('/api/user');

        if (userResult.success) {
          console.log('   ✅ User info retrieved:');
          console.log(`     Name: ${userResult.data?.name || 'N/A'}`);
          console.log(`     Phone: ${userResult.data?.phone || 'N/A'}`);
          console.log(`     JID: ${userResult.data?.jid || 'N/A'}`);
        } else {
          console.log(`   ⚠️  User info: ${userResult.error}`);
        }
      } else {
        console.log('\n   ⚠️  No connected session found. Please connect a session first.');
      }
    } else {
      console.log('   ⚠️  No sessions found. Create a session first.');
    }
  } else {
    console.log(`   ❌ Failed: ${sessionsResult.error}`);
  }

  console.log('\n===========================================');
  console.log('✅ Test completed!');
}

// Run the test
testWasenderReal().catch(console.error);
