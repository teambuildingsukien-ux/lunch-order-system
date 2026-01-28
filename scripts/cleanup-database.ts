import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function cleanupDatabase() {
    console.log('🧹 Starting database cleanup...\n');

    try {
        // 1. Get all users
        console.log('📋 Fetching all users...');
        const { data: users, error: fetchError } = await supabase
            .from('users')
            .select('id, email, role');

        if (fetchError) throw fetchError;

        console.log(`   Found ${users?.length || 0} users in database\n`);

        // 2. Delete all orders
        console.log('🗑️  Deleting all orders...');
        const { error: ordersError } = await supabase
            .from('orders')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (ordersError) throw ordersError;
        console.log('   ✅ Deleted all orders\n');

        // 3. Delete all users from users table
        console.log('🗑️  Deleting all users from users table...');
        const { error: usersError } = await supabase
            .from('users')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (usersError) throw usersError;
        console.log('   ✅ Deleted all users from users table\n');

        // 4. Delete auth users
        if (users && users.length > 0) {
            console.log('🗑️  Deleting auth users...');
            let deletedCount = 0;

            for (const user of users) {
                try {
                    const { error: authDeleteError } = await supabase.auth.admin.deleteUser(user.id);

                    if (authDeleteError) {
                        console.error(`   ⚠️  Could not delete auth user ${user.email}:`, authDeleteError.message);
                    } else {
                        deletedCount++;
                        console.log(`   ✓ Deleted auth user: ${user.email}`);
                    }
                } catch (err) {
                    console.error(`   ⚠️  Error deleting ${user.email}:`, err);
                }
            }

            console.log(`   ✅ Deleted ${deletedCount}/${users.length} auth users\n`);
        }

        // 5. Delete all groups
        console.log('🗑️  Deleting all groups...');
        const { error: groupsError } = await supabase
            .from('groups')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (groupsError) throw groupsError;
        console.log('   ✅ Deleted all groups\n');

        // 6. Delete all shifts
        console.log('🗑️  Deleting all shifts...');
        const { error: shiftsError } = await supabase
            .from('shifts')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (shiftsError) throw shiftsError;
        console.log('   ✅ Deleted all shifts\n');

        // 7. Delete all announcements
        console.log('🗑️  Deleting all announcements...');
        const { error: announcementsError } = await supabase
            .from('announcements')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

        if (announcementsError) throw announcementsError;
        console.log('   ✅ Deleted all announcements\n');

        console.log('✨ Database cleanup completed successfully!\n');

    } catch (error) {
        console.error('❌ Error cleaning database:', error);
        process.exit(1);
    }
}

// Run cleanup
cleanupDatabase()
    .then(() => {
        console.log('🎉 Database is now clean and ready for fresh seeding!\n');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
