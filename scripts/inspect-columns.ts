
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectColumns() {
    console.log('🔍 Inspecting Users table columns...');

    // Using service role, we can select from 'users' and check properties of first row if sys view fails
    const { data: userRow, error: userError } = await supabase.from('users').select('*').limit(1);

    if (userRow && userRow.length > 0) {
        console.log('✅ Users Sample Row Keys:', Object.keys(userRow[0]));
    } else if (userError) {
        console.error('❌ Error reading Users table:', userError.message);
    } else {
        console.log('ℹ️ Users table empty, cannot inspect columns easily without permissions to pg_catalog');
    }

    console.log('\n🔍 Inspecting Groups table columns...');
    const { data: groupRow, error: groupError } = await supabase.from('groups').select('*').limit(1);

    if (groupRow && groupRow.length > 0) {
        console.log('✅ Groups Sample Row Keys:', Object.keys(groupRow[0]));
    } else if (groupError) {
        console.error('❌ Error reading Groups table:', groupError.message);
    } else {
        console.log('ℹ️ Groups table empty');
    }
}

inspectColumns();
