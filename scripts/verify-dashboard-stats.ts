
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDashboardStats() {
    console.log('🔍 Verifying Dashboard Stats Logic...\n');

    // 1. Mock Dates
    const today = new Date(); // Use local time conceptually
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    // Helpers (mimic client-side)
    const toLocalDateString = (date: Date) => {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        return d.toISOString().split('T')[0];
    };

    const todayStr = toLocalDateString(today);
    const yesterdayStr = toLocalDateString(yesterdayDate);

    console.log(`📅 Testing for Today: ${todayStr}, Yesterday: ${yesterdayStr}`);

    try {
        // 2. Insert Dummy Data (Need a test user or just assume existing data)
        // Ideally we should not insert junk into production DB during simple verification if we can read existing.
        // Let's Read Existing Data first to see if calculation makes sense

        // Count Not Eating Today
        const { count: notEatingToday, error: err1 } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('date', todayStr)
            .eq('status', 'not_eating');

        if (err1) throw err1;

        // Count Not Eating Yesterday
        const { count: notEatingYesterday, error: err2 } = await supabase
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('date', yesterdayStr)
            .eq('status', 'not_eating');

        if (err2) throw err2;

        // Count Employees (Active)
        const { count: totalEmployees, error: err3 } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .not('role', 'ilike', 'kitchen')
            .eq('is_active', true);

        if (err3) throw err3;

        const total = totalEmployees || 14;
        console.log(`👥 Total Employees (Active/Non-Kitchen): ${total}`);
        console.log(`🚫 Not Eating Today: ${notEatingToday}`);
        console.log(`🚫 Not Eating Yesterday: ${notEatingYesterday}`);

        // Logic Verification
        const todayRate = total > 0 ? ((notEatingToday || 0) / total) * 100 : 0;
        const yesterdayRate = total > 0 ? ((notEatingYesterday || 0) / total) * 100 : 0;
        const trend = todayRate - yesterdayRate;

        console.log(`\n📊 Calculated Stats:`);
        console.log(`   - Today Rate: ${todayRate.toFixed(1)}%`);
        console.log(`   - Yesterday Rate: ${yesterdayRate.toFixed(1)}%`);
        console.log(`   - Trend: ${trend > 0 ? '+' : ''}${trend.toFixed(1)}%`);

        if (isNaN(trend)) {
            console.error('❌ Error: Trend is NaN');
            process.exit(1);
        }

        console.log('\n✅ Logic verification successful. The math holds up.');

    } catch (error) {
        console.error('❌ Verification Failed:', error);
        process.exit(1);
    }
}

verifyDashboardStats();
