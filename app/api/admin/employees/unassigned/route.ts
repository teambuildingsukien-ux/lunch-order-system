import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/employees/unassigned
 * Get employees not assigned to any group
 */
export async function GET() {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use admin client to bypass RLS
        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('users')
            .select('id, full_name, email, employee_code, department, avatar_url, role, group_id')
            // Show ALL employees, modal will handle disabling assigned ones
            .eq('role', 'employee')
            .order('full_name', { ascending: true });

        if (error) throw error;

        console.log('[DEBUG] All employees for selection:', {
            count: data?.length || 0,
            unassigned: data?.filter(u => !u.group_id).length || 0,
            assigned: data?.filter(u => u.group_id).length || 0
        });

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('GET /api/admin/employees/unassigned error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

