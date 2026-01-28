import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('🔍 Inspecting Schema...');

    // Warning: service_role key still respects RLS unless you explicit use bypass RLS or superuser privileges,
    // but usually service_role bypasses RLS.
    // However, selecting from information_schema depends on permissions.
    // But we can try simple select on tables to see if they error "relation does not exist".

    // Check meal_groups specifically
    const { error: errMeal } = await supabase.from('meal_groups').select('*').limit(1);
    if (errMeal) {
        console.log(`❌ Table 'meal_groups' Error: ${errMeal.message} (Code: ${errMeal.code})`);
    } else {
        console.log(`✅ Table 'meal_groups' is accessible.`);
    }

    // Check user_meal_groups specifically
    const { error: errUserMeal } = await supabase.from('user_meal_groups').select('*').limit(1);
    if (errUserMeal) {
        console.log(`❌ Table 'user_meal_groups' Error: ${errUserMeal.message} (Code: ${errUserMeal.code})`);
    } else {
        console.log(`✅ Table 'user_meal_groups' is accessible.`);
    }

    const tables = ['users', 'groups', 'meal_groups', 'shifts', 'user_meal_groups'];

    for (const table of tables) {
        const { error, count } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table '${table}': Error - ${error.message}`);
        } else {
            console.log(`✅ Table '${table}': Exists (Rows: ${count})`);
        }
    }
}

inspectSchema().catch(console.error);
