import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, role')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('\n📊 USERS IN DATABASE:\n');
    console.table(data);

    // Check for admin user
    const adminUser = data?.find(u => u.email.includes('admin'));
    console.log('\n🔍 Admin User:', adminUser);
    console.log('Role:', adminUser?.role || 'KHÔNG CÓ ROLE!');
}

checkUsers().then(() => process.exit(0));
