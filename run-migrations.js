const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        console.log('✅ Connected to Supabase');

        const migrations = [
            '20260121000001_create_users.sql',
            '20260121000002_create_orders.sql',
            '20260121000003_create_notification_logs.sql',
            '20260121000004_create_import_logs.sql',
            '20260121000005_create_triggers.sql',
        ];

        for (const migration of migrations) {
            console.log(`\n🔄 Running: ${migration}`);
            const sql = fs.readFileSync(
                path.join(__dirname, 'supabase', 'migrations', migration),
                'utf8'
            );

            const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

            if (error) {
                console.error(`❌ Error in ${migration}:`, error.message);
                // Try direct SQL execution via REST API
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
                            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
                        },
                        body: JSON.stringify({ query: sql })
                    }
                );

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }

            console.log(`✅ Done: ${migration}`);
        }

        // Run seed
        console.log('\n🔄 Running seed data...');
        const seedSql = fs.readFileSync(
            path.join(__dirname, 'supabase', 'seed', 'seed.sql'),
            'utf8'
        );
        await supabase.rpc('exec_sql', { sql_query: seedSql });
        console.log('✅ Seed data inserted');

        console.log('\n🎉 All migrations completed!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n⚠️ Manual migration required via Supabase Dashboard SQL Editor');
    }
}

runMigrations();
