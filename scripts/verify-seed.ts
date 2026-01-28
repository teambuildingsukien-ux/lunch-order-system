import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('🔍 Verifying seed data...');

    // Users
    const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log(`- Users count: ${userCount}`);

    // Meal Groups (try multiple names)
    const { data: groups1, error: e1 } = await supabase.from('meal_groups').select('name');
    if (e1) console.error('Error meal_groups:', e1.message);
    else console.log(`- meal_groups found: ${groups1?.length}`);

    const { data: groups2, error: e2 } = await supabase.from('groups').select('name');
    if (e2) console.error('Error groups:', e2.message);
    else console.log(`- groups found: ${groups2?.length}`);


    // Orders
    const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    console.log(`- Orders count: ${orderCount}`);
}

verify().catch(console.error);
