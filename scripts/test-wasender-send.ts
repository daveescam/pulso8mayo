/**
 * Test sending WhatsApp message via WASENDER API
 * From: 528183031981 (connected session)
 * To: 528128924435 (test recipient)
 */

import { config } from 'dotenv';
config();

const API_KEY = process.env.WASENDER_API_KEY || '';
const API_URL = 'https://api.wasender.com';

// Config
const SENDER_PHONE = '528183031981'; // Connected session
const TEST_RECIPIENT = '528128924435@c.us'; // Test recipient

async function testSendMessage() {
  console.log('🧪 Testing WASENDER API - Send Message\n');
  console.log('=====================================\n');
  console.log(`From: ${SENDER_PHONE} (connected session)`);
  console.log(`To: ${TEST_RECIPIENT.replace('@c.us', '')}`);
  console.log(`API Key: ${API_KEY.substring(0, 15)}...\n`);

  // Step 1: Get sessions to find the connected one
  console.log('1️⃣  Getting sessions...');
  try {
    const sessionsRes = await fetch(`${API_URL}/api/whatsapp-sessions`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });

    if (!sessionsRes.ok) {
      console.error(`   ❌ Failed to get sessions: ${sessionsRes.status}`);
      const errorText = await sessionsRes.text();
      console.error(`   Error: ${errorText}`);
      return;
    }

    const sessions = await sessionsRes.json();
    console.log(`   ✅ Found ${sessions.length} session(s)`);

    // Find session connected to 528183031981
    const session = sessions.find((s: any) =>
      s.phone?.includes(SENDER_PHONE) ||
      s.phoneNumber?.includes(SENDER_PHONE) ||
      s.status === 'connected'
    );

    if (!session) {
      console.log('\n   ❌ No connected session found for', SENDER_PHONE);
      console.log('   Available sessions:', sessions.map((s: any) => ({
        id: s.id,
        status: s.status,
        phone: s.phone || s.phoneNumber
      })));
      return;
    }

    const sessionId = session.id || session._id || session.sessionId;
    console.log(`   ✅ Using session: ${sessionId}`);
    console.log(`      Status: ${session.status}`);
    console.log(`      Phone: ${session.phone || session.phoneNumber || 'N/A'}`);

    // Step 2: Send test message
    console.log('\n2️⃣  Sending test message...');

    const messageBody = {
      session: sessionId,
      phone: TEST_RECIPIENT,
      message: '🧪 *Test de Pulso HORECA*\n\n' +
        '¡Hola! Este es un mensaje de prueba desde el sistema Pulso HORECA.\n\n' +
        '✅ La integración con WASENDER API está funcionando correctamente.\n\n' +
        '📅 Fecha: ' + new Date().toLocaleString('es-MX') + '\n' +
        '📱 Remitente: ' + SENDER_PHONE + '\n' +
        '🎯 Destinatario: ' + TEST_RECIPIENT.replace('@c.us', ''),
    };

    console.log('   Payload:', JSON.stringify(messageBody, null, 2));

    const sendRes = await fetch(`${API_URL}/api/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messageBody),
    });

    const responseText = await sendRes.text();
    console.log(`   Response status: ${sendRes.status}`);

    if (sendRes.ok) {
      let data;
      try {
        data = JSON.parse(responseText);
      } catch {
        data = responseText;
      }
      console.log('   ✅ Message sent successfully!');
      console.log('   Response:', JSON.stringify(data, null, 2));
      console.log(`\n   📱 Check WhatsApp on: ${TEST_RECIPIENT.replace('@c.us', '')}`);
    } else {
      console.log('   ❌ Failed to send message');
      console.log('   Response:', responseText);
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }

  console.log('\n=====================================');
  console.log('✅ Test completed');
}

testSendMessage();
