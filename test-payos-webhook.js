/**
 * PayOS Webhook Test Script
 * 
 * This script simulates a PayOS webhook call to test subscription activation
 * 
 * Usage:
 *   node test-payos-webhook.js [orderCode]
 * 
 * If no orderCode provided, it will use a test order code
 */

const https = require('https');
const crypto = require('crypto');

// PayOS webhook configuration
const WEBHOOK_URL = process.env.PAYOS_WEBHOOK_URL || 'http://localhost:3000/api/billing/payos-webhook';
const CHECKSUM_KEY = process.env.PAYOS_CHECKSUM_KEY || '';

// Get order code from command line or use test value
const orderCode = process.argv[2] || '123456789';

/**
 * Generate PayOS webhook signature
 * Based on PayOS documentation
 */
function generateSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const signStr = sortedKeys
        .map(key => `${key}=${data[key]}`)
        .join('&');

    return crypto
        .createHmac('sha256', CHECKSUM_KEY)
        .update(signStr)
        .digest('hex');
}

/**
 * Create mock PayOS webhook payload
 */
function createMockPayload(orderCode) {
    const paymentData = {
        orderCode: parseInt(orderCode),
        amount: 200000,
        description: 'Goi Basic',
        accountNumber: '0123456789',
        reference: `ORDER_${orderCode}`,
        transactionDateTime: new Date().toISOString(),
        currency: 'VND',
        paymentLinkId: 'mock-payment-link-id',
        code: '00', // Success code
        desc: 'Thành công',
        counterAccountBankId: '',
        counterAccountBankName: '',
        counterAccountName: '',
        counterAccountNumber: '',
        virtualAccountName: '',
        virtualAccountNumber: '',
    };

    // Generate signature
    const signature = generateSignature(paymentData);

    return {
        code: '00',
        desc: 'Thành công',
        data: paymentData,
        signature,
    };
}

/**
 * Send webhook request
 */
async function sendWebhook(payload) {
    const url = new URL(WEBHOOK_URL);
    const isHttps = url.protocol === 'https:';
    const client = isHttps ? https : require('http');

    const body = JSON.stringify(payload);

    const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
        },
    };

    return new Promise((resolve, reject) => {
        const req = client.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    body: data,
                    headers: res.headers,
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(body);
        req.end();
    });
}

/**
 * Main test function
 */
async function testWebhook() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   PayOS Webhook Test Script          ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log('📋 Test Configuration:');
    console.log(`   Webhook URL: ${WEBHOOK_URL}`);
    console.log(`   Order Code: ${orderCode}`);
    console.log(`   Checksum Key: ${CHECKSUM_KEY ? '✓ Set' : '✗ Not set'}\n`);

    if (!CHECKSUM_KEY) {
        console.error('❌ Error: PAYOS_CHECKSUM_KEY not set');
        console.log('   Set it in .env.local or pass as environment variable\n');
        process.exit(1);
    }

    try {
        // Create mock payload
        const payload = createMockPayload(orderCode);

        console.log('📦 Mock Payload:');
        console.log(JSON.stringify(payload, null, 2));
        console.log('');

        // Send webhook
        console.log('🚀 Sending webhook...\n');
        const response = await sendWebhook(payload);

        console.log('📬 Response:');
        console.log(`   Status: ${response.statusCode}`);
        console.log(`   Body: ${response.body}\n`);

        if (response.statusCode === 200) {
            console.log('✅ Webhook test PASSED');
            console.log('   Check your database to verify:');
            console.log('   1. payment_transactions.status = "completed"');
            console.log('   2. tenants.subscription_status = "active"');
            console.log('   3. tenants.current_period_end updated (+30 days)\n');
        } else {
            console.log('❌ Webhook test FAILED');
            console.log(`   Expected 200, got ${response.statusCode}\n`);
            process.exit(1);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Run test
testWebhook();
