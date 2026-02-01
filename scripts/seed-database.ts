import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Helper function to get date in YYYY-MM-DD format
function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
}

// Helper function to get date N days ago
function daysAgo(days: number): string {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return formatDate(date);
}

const STANDARD_SHIFTS = ['Ca sáng', 'Ca chiều']; // Simple shift names, user can edit later

async function seedDatabase() {
    console.log('🌱 Starting database seeding (Using Standard Tables)...\n');

    try {
        // 1. Create/Ensure Groups exist (Using 'groups' table)
        console.log('🏢 Creating groups...');
        const groups = await createGroups();
        console.log(`   ✅ Created/Found ${groups.length} groups\n`);

        // 2. Create Admin User
        console.log('👤 Creating admin user...');
        await createAdmin();
        console.log('   ✅ Created admin\n');

        // 3. Create Kitchen User
        console.log('🧑‍🍳 Creating kitchen user...');
        await createKitchen();
        console.log('   ✅ Created kitchen user\n');

        // 4. Create Employee Users
        console.log('👥 Creating employee users and assigning groups...');
        // We pass groups here to assign them during creation
        await createEmployees(groups);

        // 5. Generate Orders
        console.log('📝 Generating orders...');
        const { data: allEmployees } = await supabase.from('users').select('id').eq('role', 'employee');
        if (allEmployees && allEmployees.length > 0) {
            await generateOrders(allEmployees);
            console.log(`   ✅ Generated orders\n`);
        }

        console.log('✨ Database seeding (Standard) completed successfully!\n');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
}

async function createGroups() {
    const groupsData = [
        { name: 'Team Alpha (IT)' },
        { name: 'Team Beta (Marketing)' },
        { name: 'Team Gamma (Sales)' },
        { name: 'Team Delta (Production)' },
        { name: 'Khách VIP' },
        { name: 'Thực tập sinh' }
    ];

    const createdGroups = [];

    for (const group of groupsData) {
        // Check if group exists
        const { data: existing } = await supabase
            .from('groups')
            .select('*')
            .eq('name', group.name)
            .single();

        if (existing) {
            createdGroups.push(existing);
        } else {
            const { data: created, error } = await supabase
                .from('groups')
                .insert(group)
                .select()
                .single();

            if (error) {
                console.error(`Error creating group ${group.name}:`, error.message);
                continue;
            }
            createdGroups.push(created);
            console.log(`   ✓ Created group "${group.name}"`);
        }
    }

    return createdGroups;
}

async function createAdmin() {
    // ... (Same as before, simplified)
    const adminData = {
        email: 'admin@company.vn',
        full_name: 'Admin Manager',
        role: 'admin',
        department: 'hr',
        employee_code: 'ADM01',
        shift: 'Ca hành chính'
    };

    // Auth creation logic omitted for brevity in thought, but included in code...
    // Actually full code:
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: adminData.email,
        password: 'admin123',
        email_confirm: true,
        user_metadata: {
            full_name: adminData.full_name,
            role: adminData.role,
            employee_code: adminData.employee_code
        }
    });

    let userId;

    if (authError) {
        if (authError.message.includes('already registered') || authError.code === 'email_exists') {
            const { data: user } = await supabase.from('users').select('id').eq('email', adminData.email).single();
            userId = user?.id;
        } else {
            console.error('Auth error creating admin:', authError);
            throw authError;
        }
    } else {
        userId = authUser?.user?.id;
    }

    if (userId) {
        await supabase.from('users').upsert({
            id: userId,
            ...adminData
        });
    }
}

async function createKitchen() {
    const kitchenData = {
        email: 'kitchen@company.vn',
        full_name: 'Chị Huệ',
        role: 'kitchen',
        department: 'production',
        employee_code: 'KIT01',
        shift: 'Ca sáng'
    };

    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: kitchenData.email,
        password: 'kitchen123',
        email_confirm: true,
        user_metadata: { full_name: kitchenData.full_name, role: kitchenData.role }
    });

    let userId;
    if (authError) {
        if (authError.message.includes('already registered') || authError.code === 'email_exists') {
            const { data: user } = await supabase.from('users').select('id').eq('email', kitchenData.email).single();
            userId = user?.id;
        } else {
            throw authError;
        }
    } else {
        userId = authUser?.user?.id;
    }

    if (userId) {
        await supabase.from('users').upsert({ id: userId, ...kitchenData });
    }
}

async function createEmployees(groups: any[]) {
    const employeesData = [
        { email: 'nguyen.van.an@company.vn', full_name: 'Nguyễn Văn An', role: 'employee', department: 'it', employee_code: 'NV001' },
        { email: 'tran.thi.binh@company.vn', full_name: 'Trần Thị Bình', role: 'employee', department: 'it', employee_code: 'NV002' },
        { email: 'hoang.van.em@company.vn', full_name: 'Hoàng Văn Em', role: 'employee', department: 'marketing', employee_code: 'NV005' },
        { email: 'tran.van.hung@company.vn', full_name: 'Trần Văn Hùng', role: 'employee', department: 'accounting', employee_code: 'NV008' },
        { email: 'le.thi.kieu@company.vn', full_name: 'Lê Thị Kiều', role: 'employee', department: 'sales', employee_code: 'NV010' }
    ];

    for (const [index, employee] of employeesData.entries()) {
        const shift = STANDARD_SHIFTS[index % STANDARD_SHIFTS.length];

        // Assign group based on logic
        let groupId = null;
        if (employee.department === 'it') groupId = groups.find(g => g.name.includes('Alpha'))?.id;
        else if (employee.department === 'marketing') groupId = groups.find(g => g.name.includes('Beta'))?.id;
        else if (employee.department === 'sales') groupId = groups.find(g => g.name.includes('Gamma'))?.id;
        else groupId = groups[groups.length - 1]?.id;

        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: employee.email,
            password: 'employee123',
            email_confirm: true,
            user_metadata: { full_name: employee.full_name, role: employee.role }
        });

        let userId;

        if (authError) {
            if (authError.message.includes('already registered') || authError.code === 'email_exists') {
                const { data: user } = await supabase.from('users').select('id').eq('email', employee.email).single();
                userId = user?.id;
            } else {
                console.error(`Error creating auth for ${employee.email}:`, authError.message);
                continue;
            }
        } else {
            userId = authUser?.user?.id;
        }

        if (userId) {
            await supabase.from('users').upsert({
                id: userId,
                ...employee,
                shift: shift,
                group_id: groupId, // Directly assigning group_id
                is_active: true
            });
            console.log(`   ✓ Processed ${employee.full_name}`);
        }
    }
}

async function generateOrders(employees: any[]) {
    const orders = [];
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const orderDate = daysAgo(dayOffset);
        for (const employee of employees) {
            const isEating = Math.random() > 0.2;
            orders.push({
                user_id: employee.id,
                date: orderDate,
                status: isEating ? 'eating' : 'not_eating',
                locked: false
            });
        }
    }

    const { error } = await supabase.from('orders').upsert(orders, { onConflict: 'tenant_id,user_id,date' });
    if (error) console.error('Order generation partial error (might be duplicates):', error.message);
}

seedDatabase();
