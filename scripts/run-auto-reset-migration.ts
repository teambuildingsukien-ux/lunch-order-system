import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        console.log('🚀 Running auto-reset settings migration...');

        const migrationPath = path.join(__dirname, 'migrations', 'add_auto_reset_settings.sql');
        const sql = fs.readFileSync(migrationPath, 'utf-8');

        // Split by semicolons and execute each statement
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        for (const statement of statements) {
            const { error } = await supabase.rpc('exec_sql', { sql_query: statement });

            if (error) {
                console.error('❌ Migration error:', error);
                throw error;
            }
        }

        console.log('✅ Migration completed successfully!');
        console.log('📊 Verifying settings...');

        // Verify the settings were created
        const { data, error: verifyError } = await supabase
            .from('system_settings')
            .select('*')
            .in('key', ['auto_reset_enabled', 'auto_reset_time', 'auto_reset_last_run']);

        if (verifyError) {
            console.error('❌ Verification error:', verifyError);
        } else {
            console.log('✅ Settings created:', data);
        }

    } catch (error) {
        console.error('❌ Fatal error:', error);
        process.exit(1);
    }
}

runMigration();
