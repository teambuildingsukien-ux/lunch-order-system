const { createClient } = require('@supabase/supabase-js');
require('dotenv/config');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanTestUsers() {
    console.log('🧹 Cleaning test users from auth.users...');

    // Get all auth users
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('Error listing users:', error);
        return;
    }

    console.log(`Found ${users.length} auth users`);

    // Keep only admin and kitchen accounts
    const keepEmails = ['admin@company.vn', 'kitchen@company.vn'];
    const usersToDelete = users.filter(u => !keepEmails.includes(u.email));

    console.log(`Will delete ${usersToDelete.length} test users`);

    for (const user of usersToDelete) {
        console.log(`Deleting: ${user.email}`);
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
            console.error(`Failed to delete ${user.email}:`, deleteError);
        } else {
            console.log(`✅ Deleted ${user.email}`);
        }
    }

    console.log('✨ Cleanup complete!');
}

cleanTestUsers();
