/**
 * Test script for WASENDER API integration
 * Run with: npx tsx scripts/test-wasender-api.ts
 */

import { config } from 'dotenv';
config();

interface WasenderTestResult {
  test: string;
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

async function testWasenderAPI() {
  console.log('🧪 Testing WASENDER API Integration\n');
  console.log('=====================================\n');

  const results: WasenderTestResult[] = [];

  // Check environment variables
  console.log('📋 Step 1: Checking environment variables...');
  const apiKey = process.env.WASENDER_API_KEY;
  // According to WASENDER docs, base URL should be https://api.wasender.com (no /v1)
  const apiUrl = 'https://api.wasender.com';

  if (!apiKey) {
    results.push({
      test: 'Environment Variables',
      success: false,
      message: 'WASENDER_API_KEY is not set',
    });
    console.log('❌ WASENDER_API_KEY not found in .env\n');
    return results;
  }

  console.log(`✅ API Key found: ${apiKey.substring(0, 10)}...`);
  console.log(`✅ API URL: ${apiUrl}\n`);

  results.push({
    test: 'Environment Variables',
    success: true,
    message: 'API credentials configured',
  });

  // Test 1: Get all sessions
  console.log('📋 Step 2: Testing GET /api/whatsapp-sessions...');
  try {
    const response = await fetch(`${apiUrl}/api/whatsapp-sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Successfully retrieved sessions');
      console.log(`   Found ${data.length || 0} session(s)\n`);
      results.push({
        test: 'Get Sessions',
        success: true,
        message: `Retrieved ${data.length || 0} session(s)`,
        data,
      });
    } else {
      const error = await response.text();
      console.log(`❌ Failed to get sessions: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error}\n`);
      results.push({
        test: 'Get Sessions',
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        error,
      });
    }
  } catch (error) {
    console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    console.log(`   This might be a network connectivity issue or invalid API URL\n`);
    results.push({
      test: 'Get Sessions',
      success: false,
      message: 'Request failed - check network connectivity',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Test 2: Create a test session
  console.log('📋 Step 3: Testing POST /api/whatsapp-sessions (Create Session)...');
  let testSessionId: string | null = null;
  try {
    const sessionName = `test_session_${Date.now()}`;
    const response = await fetch(`${apiUrl}/api/whatsapp-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: sessionName,
        webhook: `${process.env.NEXT_PUBLIC_APP_URL || 'https://pulsomx.netlify.app'}/api/whatsapp/webhook`,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      testSessionId = data.id || data.sessionId || data._id;
      console.log('✅ Successfully created session');
      console.log(`   Session ID: ${testSessionId}`);
      console.log(`   Status: ${data.status}\n`);
      results.push({
        test: 'Create Session',
        success: true,
        message: `Session created: ${testSessionId}`,
        data,
      });
    } else {
      const error = await response.text();
      console.log(`❌ Failed to create session: ${response.status} ${response.statusText}`);
      console.log(`   Error: ${error}\n`);
      results.push({
        test: 'Create Session',
        success: false,
        message: `HTTP ${response.status}: ${response.statusText}`,
        error,
      });
    }
  } catch (error) {
    console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
    results.push({
      test: 'Create Session',
      success: false,
      message: 'Request failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }

  // Test 3: Get session QR code (if session was created)
  if (testSessionId) {
    console.log(`📋 Step 4: Testing GET /api/whatsapp-sessions/{sessionId}/qrcode...`);
    try {
      const response = await fetch(`${apiUrl}/api/whatsapp-sessions/${testSessionId}/qrcode`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully retrieved QR code');
        console.log(`   QR Code available: ${!!data.qrCode || !!data.code}\n`);
        results.push({
          test: 'Get QR Code',
          success: true,
          message: 'QR code retrieved successfully',
          data,
        });
      } else {
        const error = await response.text();
        console.log(`⚠️  Could not get QR code (this is normal if session is already connected): ${response.status}`);
        console.log(`   Response: ${error}\n`);
        results.push({
          test: 'Get QR Code',
          success: false,
          message: `HTTP ${response.status}: Session may already be connected or still initializing`,
          error,
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      results.push({
        test: 'Get QR Code',
        success: false,
        message: 'Request failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Test 4: Send test message (will fail without connected session, but tests the endpoint)
    console.log(`📋 Step 5: Testing POST /api/send-message...`);
    try {
      // Test with a dummy number - this will likely fail but verifies the endpoint works
      const response = await fetch(`${apiUrl}/api/send-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          session: testSessionId,
          phone: '5215512345678@c.us', // Mexican number format
          message: 'Test message from Pulso HORECA',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Successfully sent message');
        console.log(`   Message ID: ${data.messageId || data.id}\n`);
        results.push({
          test: 'Send Message',
          success: true,
          message: 'Message sent successfully',
          data,
        });
      } else {
        const error = await response.text();
        console.log(`⚠️  Could not send message (expected if session not connected): ${response.status}`);
        console.log(`   Response: ${error}\n`);
        results.push({
          test: 'Send Message',
          success: false,
          message: `HTTP ${response.status}: Session may not be connected yet`,
          error,
        });
      }
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      results.push({
        test: 'Send Message',
        success: false,
        message: 'Request failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Clean up: Delete test session
    console.log(`📋 Step 6: Cleaning up - DELETE /api/whatsapp-sessions/{sessionId}...`);
    try {
      const response = await fetch(`${apiUrl}/api/whatsapp-sessions/${testSessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      if (response.ok || response.status === 404) {
        console.log('✅ Test session cleaned up\n');
        results.push({
          test: 'Delete Session',
          success: true,
          message: 'Session deleted successfully',
        });
      } else {
        console.log(`⚠️  Could not delete session: ${response.status}\n`);
        results.push({
          test: 'Delete Session',
          success: false,
          message: `HTTP ${response.status}`,
        });
      }
    } catch (error) {
      console.log(`⚠️  Error cleaning up: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      results.push({
        test: 'Delete Session',
        success: false,
        message: 'Cleanup failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Print summary
  console.log('=====================================\n');
  console.log('📊 TEST SUMMARY\n');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  results.forEach((result, index) => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${result.test}`);
    console.log(`   ${result.message}`);
    if (result.error) {
      console.log(`   Error: ${result.error.substring(0, 100)}${result.error.length > 100 ? '...' : ''}`);
    }
    console.log('');
  });

  console.log(`\nResults: ${passed} passed, ${failed} failed out of ${results.length} tests`);

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Common issues:');
    console.log('   - Session not yet connected (scan QR code first)');
    console.log('   - Invalid API key');
    console.log('   - Rate limiting');
    console.log('   - Network connectivity issues');
    console.log('   - API URL format (use https://api.wasender.com, not https://api.wasender.com/v1)');
  }

  return results;
}

// Run tests
testWasenderAPI()
  .then(() => {
    console.log('\n✨ Test completed\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed with error:', error);
    process.exit(1);
  });
