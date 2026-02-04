
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createPlatformOwner() {
    const email = 'tthanconghaibiin@gmail.com';
    const password = 'Congdanh@79';

    console.log(`Creating user ${email}...`);

    // 1. Create Auth User
    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            full_name: 'Platform Super Admin'
        }
    });

    if (createError) {
        console.error('Error creating user:', createError);
        return;
    }

    console.log(`Auth user created: ${authUser.user.id}`);

    // 2. Ensure user exists in public.users (triggers should handle this, but let's wait a bit or verify)
    // We can force insert if needed, but trigger is better.
    // Let's verify.
    let publicUser = null;
    let attempts = 0;
    while (!publicUser && attempts < 5) {
        const { data } = await supabase.from('users').select('id').eq('id', authUser.user.id).single();
        if (data) {
            publicUser = data;
        } else {
            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }
    }

    if (!publicUser) {
        console.log('Public user trigger might be slow, inserting manually to be safe...');
        const { error: insertError } = await supabase.from('users').upsert({
            id: authUser.user.id,
            email: email,
            full_name: 'Platform Super Admin',
            role: 'platform_owner', // Or whatever role is appropriate, but platform_owners table is key
            is_active: true
        });
        if (insertError) console.error('Error inserting public user:', insertError);
    }

    // 3. Add to platform_owners
    console.log('Adding to platform_owners...');
    const { error: ownerError } = await supabase.from('platform_owners').insert({
        user_id: authUser.user.id,
        role: 'super_admin' // Assuming a role column exists or default is fine
    });

    if (ownerError) {
        // Check if table exists or column issues
        if (ownerError.code === '42P01') { // undefined_table
            console.error('Table platform_owners does not exist?!');
        } else {
            console.error('Error adding to platform_owners:', ownerError);
            // Fallback: try without role if it fails
        }
    } else {
        console.log('Successfully added to platform_owners.');
    }

    console.log('Done!');
}

createPlatformOwner();
