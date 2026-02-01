/**
 * Check Webhook Results
 * Verify that the webhook actually updated the database
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.log('   Check .env.local for:');
    console.log('   - NEXT_PUBLIC_SUPABASE_URL');
    console.log('   - SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const orderCode = process.argv[2] || '1331816047';

async function checkWebhookResults() {
    console.log('╔════════════════════════════════════════╗');
    console.log('║   Check Webhook Database Results     ║');
    console.log('╚════════════════════════════════════════╝\n');

    console.log(`🔍 Looking for orderCode: ${orderCode}\n`);

    try {
        // Check transaction
        const { data: transactions, error: txError } = await supabase
            .from('payment_transactions')
            .select('*, tenants(*)')
            .eq('transaction_id', orderCode)
            .limit(1);

        if (txError) {
            console.error('❌ Error querying transactions:', txError.message);
            process.exit(1);
        }

        if (!transactions || transactions.length === 0) {
            console.log('❌ Transaction not found');
            console.log('   Make sure the orderCode exists in payment_transactions table');
            process.exit(1);
        }

        const transaction = transactions[0];
        const tenant = transaction.tenants;

        console.log('📋 Payment Transaction:');
        console.log(`   ID: ${transaction.id}`);
        console.log(`   Transaction ID: ${transaction.transaction_id}`);
        console.log(`   Amount: ${transaction.amount.toLocaleString()} VNĐ`);
        console.log(`   Status: ${transaction.status}`);
        console.log(`   Created: ${new Date(transaction.created_at).toLocaleString('vi-VN')}`);
        console.log(`   Processed: ${transaction.processed_at ? new Date(transaction.processed_at).toLocaleString('vi-VN') : 'N/A'}`);
        console.log('');

        console.log('🏢 Tenant Info:');
        console.log(`   ID: ${tenant.id}`);
        console.log(`   Name: ${tenant.name}`);
        console.log(`   Subscription: ${tenant.subscription_status}`);
        console.log(`   Period End: ${tenant.current_period_end ? new Date(tenant.current_period_end).toLocaleString('vi-VN') : 'N/A'}`);
        console.log(`   Last Payment: ${tenant.last_payment_date ? new Date(tenant.last_payment_date).toLocaleString('vi-VN') : 'N/A'}`);
        console.log('');

        // Verify webhook worked
        const webhookWorked = transaction.status === 'completed' && tenant.subscription_status === 'active';

        if (webhookWorked) {
            console.log('✅ WEBHOOK PROCESSED SUCCESSFULLY!');
            console.log('   ✓ Transaction marked as completed');
            console.log('   ✓ Subscription activated');
            console.log('   ✓ Period end date set (+30 days)');
        } else {
            console.log('⚠️  WEBHOOK MAY NOT HAVE PROCESSED:');
            if (transaction.status !== 'completed') {
                console.log(`   ✗ Transaction status: ${transaction.status} (expected: completed)`);
            }
            if (tenant.subscription_status !== 'active') {
                console.log(`   ✗ Subscription status: ${tenant.subscription_status} (expected: active)`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkWebhookResults();
