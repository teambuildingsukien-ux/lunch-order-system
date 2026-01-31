import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * DELETE /api/admin/groups/[id]/members/[userId]
 * Remove employee from group
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> }
) {
    try {
        const supabase = await createClient();
        const { id: groupId, userId } = await params;

        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use admin client to bypass RLS
        const adminClient = createAdminClient();

        // Remove user from group (set group_id to null)
        const { error } = await adminClient
            .from('users')
            .update({ group_id: null })
            .eq('id', userId)
            .eq('group_id', groupId); // Double check user is in this group

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('DELETE /api/admin/groups/[id]/members/[userId] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
