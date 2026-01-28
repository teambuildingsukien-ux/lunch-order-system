
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
    console.log('🔍 Inspecting Shifts table columns...');
    const { data: shiftRow, error: shiftError } = await supabase.from('shifts').select('*').limit(1);

    if (shiftRow && shiftRow.length > 0) {
        console.log('✅ Shifts Sample Row Keys:', Object.keys(shiftRow[0]));
        console.log('✅ Value:', shiftRow[0]);
    } else if (shiftError) {
        console.error('❌ Error reading Shifts table:', shiftError.message);
    } else {
        console.log('ℹ️ Shifts table empty');
    }

    console.log('🔍 Checking distinct departments from users table...');
    const { data: depts, error: deptError } = await supabase.from('users').select('department');
    if (deptError) {
        console.error('❌ Error reading departments:', deptError.message);
    } else {
        const unique = [...new Set(depts.map(d => d.department))].filter(Boolean);
        console.log(`✅ Unique departments found (${unique.length}):`, unique);
    }
}

inspectSchema().catch(console.error);
