const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://dlekahcgkzfrjyzczxyl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZWthaGNna3pmcmp5emN6eHlsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODk3MjI2NCwiZXhwIjoyMDg0NTQ4MjY0fQ.3Z79U1tIlHj7311D1bUPm2LW4vryQfZqMvNH5Y7Qn2Q';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    console.log('🔍 Checking admin/hr users in LOCAL database...\n');

    const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role, created_at')
        .in('role', ['admin', 'hr'])
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('❌ Error:', error);
        return;
    }

    if (!data || data.length === 0) {
        console.log('⚠️  No admin/hr users found!');
        return;
    }

    console.log(`✅ Found ${data.length} admin/hr users:\n`);
    data.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.full_name}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Created: ${new Date(user.created_at).toLocaleString('vi-VN')}`);
        console.log('');
    });
}

checkUsers();
