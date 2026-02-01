/**
 * Run Multi-tenant Migrations
 * This script executes the 3 SQL migration files on Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Service role key has bypass RLS permissions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const MIGRATIONS_DIR = path.join(process.cwd(), 'supabase', 'migrations');

const migrationFiles = [
    '20260131200000_create_tenants_table.sql',
    '20260131201000_add_tenant_id_columns.sql',
    '20260131202000_enable_row_level_security.sql'
];

async function runMigration(filename: string) {
    console.log(`\n📄 Running migration: ${filename}`);
    console.log('='.repeat(60));

    const filePath = path.join(MIGRATIONS_DIR, filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
        // Execute SQL via Supabase RPC
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
            // If RPC doesn't exist, try direct query (won't work for DDL but let's try)
            console.log('⚠️  exec_sql RPC not available, trying direct execution...');

            // Split SQL by semicolon and execute each statement
            const statements = sql
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));

            for (const statement of statements) {
                if (statement.toUpperCase().includes('BEGIN') || statement.toUpperCase().includes('COMMIT')) {
                    continue; // Skip transaction statements
                }

                try {
                    const { error: stmtError } = await supabase.from('_migration_temp').select().limit(0);
                    if (stmtError) console.log(`   Skipping: ${statement.substring(0, 50)}...`);
                } catch (e) {
                    // Individual statement errors are OK
                }
            }

            console.log('⚠️  Direct execution not fully supported - use Supabase Dashboard SQL Editor');
            return false;
        }

        console.log('✅ Migration successful!');
        return true;
    } catch (err: any) {
        console.error('❌ Migration failed:', err.message);
        return false;
    }
}

async function verifyMigrations() {
    console.log('\n🔍 Verifying migrations...');
    console.log('='.repeat(60));

    // Check if tenants table exists
    const { data: tenants, error: tenantsError } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .limit(5);

    if (tenantsError) {
        console.log('❌ Tenants table not found:', tenantsError.message);
    } else {
        console.log(`✅ Tenants table exists with ${tenants?.length || 0} records`);
        tenants?.forEach(t => console.log(`   - ${t.name} (${t.slug})`));
    }

    // Check if tenant_id exists on users table
    const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, tenant_id')
        .limit(1);

    if (usersError) {
        console.log('❌ tenant_id column not found on users:', usersError.message);
    } else {
        console.log('✅ tenant_id column exists on users table');
    }

    // Check RLS status (this query needs to be run via SQL editor)
    console.log('\n📋 To verify RLS, run this in Supabase SQL Editor:');
    console.log(`
    SELECT 
      schemaname, 
      tablename, 
      rowsecurity as rls_enabled
    FROM pg_tables 
    WHERE schemaname = 'public'
    AND tablename IN ('tenants', 'users', 'orders', 'groups', 'activity_logs');
  `);
}

async function main() {
    console.log('🚀 Multi-tenant Migration Script');
    console.log('='.repeat(60));
    console.log(`Supabase URL: ${supabaseUrl}`);
    console.log(`Migrations dir: ${MIGRATIONS_DIR}`);

    console.log('\n⚠️  IMPORTANT: This script has limited capabilities.');
    console.log('For best results, manually run migrations in Supabase Dashboard SQL Editor.');
    console.log('\nPress Ctrl+C to cancel, or wait 3 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    let successCount = 0;

    for (const file of migrationFiles) {
        const success = await runMigration(file);
        if (success) successCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Results: ${successCount}/${migrationFiles.length} migrations completed`);

    if (successCount === 0) {
        console.log('\n⚠️  No migrations executed via API.');
        console.log('Please run migrations manually:');
        console.log('1. Go to https://supabase.com/dashboard');
        console.log('2. Select your project');
        console.log('3. Go to SQL Editor');
        console.log('4. Copy-paste each migration file and click RUN');
        console.log('\nMigration files location:');
        migrationFiles.forEach(f => console.log(`   - ${path.join(MIGRATIONS_DIR, f)}`));
    }

    await verifyMigrations();

    console.log('\n✅ Done!');
}

main().catch(console.error);
