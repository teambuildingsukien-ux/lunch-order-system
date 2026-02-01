/**
 * Simple PayOS Webhook Test (No Signature)
 * For local development testing only
 * 
 * Usage: node test-webhook-simple.js [orderCode]
 */

const http = require('http');

const orderCode = process.argv[2] || '1331816047';
const WEBHOOK_URL = 'http://localhost:3000/api/billing/payos-webhook';

// Create mock PayOS webhook payload (without signature verification)
const payload = {
    code: '00', // Success code
    desc: 'Thành công',
    data: {
        orderCode: parseInt(orderCode),
        amount: 200000,
        description: 'Goi Basic',
        accountNumber: '0123456789',
        reference: `ORDER_${orderCode}`,
        transactionDateTime: new Date().toISOString(),
        currency: 'VND',
        paymentLinkId: 'test-payment-link-id',
        counterAccountBankId: 'MB',
        counterAccountBankName: 'MB Bank',
        counterAccountName: 'NGUYEN VAN A',
        counterAccountNumber: '9999999999',
        virtualAccountName: 'APP COM NGON',
        virtualAccountNumber: '',
    },
    signature: 'test-signature-skip-verification', // Dummy signature for testing
};

console.log('╔════════════════════════════════════════╗');
console.log('║   Simple PayOS Webhook Test          ║');
console.log('╚════════════════════════════════════════╝\n');

console.log('📋 Configuration:');
console.log(`   Webhook URL: ${WEBHOOK_URL}`);
console.log(`   Order Code: ${orderCode}\n`);

console.log('📦 Payload:');
console.log(JSON.stringify(payload, null, 2));
console.log('');

const body = JSON.stringify(payload);
const url = new URL(WEBHOOK_URL);

const options = {
    hostname: url.hostname,
    port: url.port || 3000,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
    },
};

console.log('🚀 Sending webhook request...\n');

const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('📬 Response:');
        console.log(`   Status: ${res.statusCode}`);
        console.log(`   Body: ${data}\n`);

        if (res.statusCode === 200) {
            console.log('✅ Webhook request sent successfully');
            console.log('\n📊 Check logs above for:');
            console.log('   - [PAYOS] Received webhook');
            console.log('   - Transaction status update');
            console.log('   - Subscription activation');
        } else if (res.statusCode === 401) {
            console.log('⚠️  Signature verification failed (expected in this test)');
            console.log('   To skip verification, modify webhook route.ts temporarily');
        } else {
            console.log('❌ Unexpected response');
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. npm run dev is running');
    console.log('   2. Server is accessible at http://localhost:3000');
    process.exit(1);
});

req.write(body);
req.end();
