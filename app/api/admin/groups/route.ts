import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/groups
 * List all groups with shift details and member count
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

        // Fetch groups with shift relation
        const { data: groups, error } = await adminClient
            .from('groups')
            .select(`
                *,
                shift:shifts (*)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Get member counts for each group
        const groupsWithCounts = await Promise.all(
            (groups || []).map(async (group) => {
                const { count } = await adminClient
                    .from('users')
                    .select('*', { count: 'exact', head: true })
                    .eq('group_id', group.id);

                return {
                    ...group,
                    member_count: count || 0
                };
            })
        );

        return NextResponse.json({ data: groupsWithCounts });
    } catch (error: any) {
        console.error('GET /api/admin/groups error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/groups
 * Create new group
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, shift_id, table_area, department } = body;

        // Validation
        if (!name) {
            return NextResponse.json({ error: 'Group name is required' }, { status: 400 });
        }

        // Check shift exists if provided
        if (shift_id) {
            const { data: shift } = await supabase
                .from('shifts')
                .select('id')
                .eq('id', shift_id)
                .single();

            if (!shift) {
                return NextResponse.json({ error: 'Shift not found' }, { status: 400 });
            }
        }

        const { data, error } = await supabase
            .from('groups')
            .insert({
                name,
                shift_id: shift_id || null,
                table_area: table_area || null,
                department: department || null
            })
            .select(`
                *,
                shift:shifts (*)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/admin/groups error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
