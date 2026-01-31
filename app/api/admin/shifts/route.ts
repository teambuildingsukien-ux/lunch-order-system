import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/admin/shifts
 * List all shifts ordered by start_time
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
            .from('shifts')
            .select('*')
            .order('start_time', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('GET /api/admin/shifts error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

/**
 * POST /api/admin/shifts
 * Create new shift
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
        const { name, start_time, end_time } = body;

        // Validation
        if (!name || !start_time || !end_time) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (start_time >= end_time) {
            return NextResponse.json({ error: 'Start time must be before end time' }, { status: 400 });
        }

        // Check duplicate name
        const { data: existing } = await supabase
            .from('shifts')
            .select('id')
            .eq('name', name)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Shift name already exists' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('shifts')
            .insert({ name, start_time, end_time })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data }, { status: 201 });
    } catch (error: any) {
        console.error('POST /api/admin/shifts error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
