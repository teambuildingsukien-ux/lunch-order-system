import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/groups/[id]/members
 * Get all members of a group
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id } = await params;

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get current user's tenant_id for filtering
        const { data: currentProfile } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        if (!currentProfile?.tenant_id) {
            return NextResponse.json({ error: 'Tenant not found' }, { status: 403 });
        }

        // Use admin client but with tenant filtering
        const adminClient = createAdminClient();
        const { data, error } = await adminClient
            .from('users')
            .select('id, full_name, email, employee_code, department, avatar_url')
            .eq('group_id', id)
            .eq('tenant_id', currentProfile.tenant_id) // ✅ TENANT ISOLATION
            .order('full_name', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('GET /api/admin/groups/[id]/members error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/groups/[id]/members
 * Add employee to group
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: groupId } = await params;

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { user_id } = body;

        if (!user_id) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Use admin client to bypass RLS
        const adminClient = createAdminClient();

        // Check if user is already in a group
        const { data: existingUser } = await adminClient
            .from('users')
            .select('group_id, full_name')
            .eq('id', user_id)
            .single();

        if (existingUser?.group_id) {
            return NextResponse.json(
                { error: `Nhân viên "${existingUser.full_name}" đã thuộc nhóm khác` },
                { status: 400 }
            );
        }

        // Add user to group
        const { error } = await adminClient
            .from('users')
            .update({ group_id: groupId })
            .eq('id', user_id);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('POST /api/admin/groups/[id]/members error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
