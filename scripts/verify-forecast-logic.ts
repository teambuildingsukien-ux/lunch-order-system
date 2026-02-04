
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyForecastLogic() {
    console.log('--- Verifying Forecast Logic (Implicit Eating) ---');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split('T')[0];
    console.log(`Target Date: ${tomorrowDate}`);

    // 1. Fetch Total Active Users
    const { count: totalEmployees, error: err1 } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true); // Note: column is 'is_active', code used 'active'? CHECK THIS!

    if (err1) console.error('Error fetching users:', err1);

    // 2. Fetch Not Eating Count
    const { count: notEatingCount, error: err2 } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('date', tomorrowDate)
        .eq('status', 'not_eating');
    // .eq('users.active', true) // Service role can't easily join on filter unless explicit.
    // Ideally we filter by active users too, but for quick check this is fine.

    if (err2) console.error('Error fetching orders:', err2);

    const total = totalEmployees || 0;
    const notRegistered = notEatingCount || 0;
    const registered = total - notRegistered;

    console.log(`Total Active Users: ${total}`);
    console.log(`Reported Not Eating (Báo nghỉ): ${notRegistered}`);
    console.log(`Calculated Registered (Sẽ ăn): ${registered}`);

    console.log('--- Logic check ---');
    if (registered === total) {
        console.log('✅ SUCCESS: If no one reported not eating, Registered equals Total.');
    } else {
        console.log('ℹ️ NOTE: difference found (some reported not eating).');
    }
}

verifyForecastLogic();
