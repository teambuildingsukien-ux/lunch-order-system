import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/admin/groups/[id]
 * Update group details
 */
export async function PUT(
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

        const body = await req.json();
        const { name, shift_id, table_area, department } = body;

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

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (shift_id !== undefined) updateData.shift_id = shift_id;
        if (table_area !== undefined) updateData.table_area = table_area;
        if (department !== undefined) updateData.department = department;

        const { data, error } = await supabase
            .from('groups')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                shift:shifts (*)
            `)
            .single();

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('PUT /api/admin/groups/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * DELETE /api/admin/groups/[id]
 * Delete group (warning if has members)
 */
export async function DELETE(
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

        // Check if group has members
        const { count } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', id);

        if (count && count > 0) {
            // Set all members' group_id to null before deleting
            await supabase
                .from('users')
                .update({ group_id: null })
                .eq('group_id', id);
        }

        const { error } = await supabase
            .from('groups')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ success: true, removedMembers: count || 0 });
    } catch (error: any) {
        console.error('DELETE /api/admin/groups/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
