
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
        // 1. Check if requester is authorized (must be logged in)
        // In a real app, strict Role Based Access Control (RBAC) should be here.
        // For now, we trust the UI middleware protection, but adding a basic check.
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse body
        const body = await req.json();
        const { email, password, fullName, role, employeeCode, department, shift, mealGroupId, isCustomDepartment, isCustomShift, isCustomMealGroup, customValues } = body;

        // 3. Initialize Admin Client
        const supabaseAdmin = createAdminClient();

        // 4. Create Auth User (Auto-confirmed)
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true, // AUTO CONFIRM EMAIL
            user_metadata: {
                full_name: fullName,
                role: role,
                employee_code: employeeCode
            }
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
        }

        const userId = authData.user.id;

        // 5. Create Database Records (Departments/Shifts/Groups if custom)
        // Note: Ideally transactions should be used, but Supabase doesn't support valid cross-resource transactions easily via JS client yet.
        // We will proceed step-by-step.

        let finalDepartment = department;
        if (department === 'custom' && customValues?.department) {
            const { error: deptError } = await supabaseAdmin
                .from('departments')
                .insert({ name: customValues.department })
                .single();
            // Ignore duplicate error
            finalDepartment = customValues.department;
        }

        let finalShiftId: string | null = null;
        let finalShiftName = shift;

        // Handle Shift
        if (shift === 'custom' && customValues?.shift) {
            // Check exist
            const { data: existingShift } = await supabaseAdmin
                .from('shifts')
                .select('id, name')
                .ilike('name', customValues.shift)
                .single();

            if (existingShift) {
                finalShiftId = existingShift.id;
                finalShiftName = existingShift.name;
            } else {
                const { data: createdShift, error: shiftError } = await supabaseAdmin
                    .from('shifts')
                    .insert({
                        name: customValues.shift,
                        start_time: customValues.shiftStartTime,
                        end_time: customValues.shiftEndTime
                    })
                    .select('id, name')
                    .single();
                if (shiftError) throw shiftError;
                if (createdShift) {
                    finalShiftId = createdShift.id;
                    finalShiftName = createdShift.name;
                }
            }
        } else if (shift) {
            // UI now sends shift ID, fetch the shift details
            const { data: selectedShift } = await supabaseAdmin
                .from('shifts')
                .select('id, name')
                .eq('id', shift)
                .single();

            if (selectedShift) {
                finalShiftId = selectedShift.id;
                finalShiftName = selectedShift.name;
            }
        }

        let finalGroupId = mealGroupId;
        // Handle Group
        if (mealGroupId === 'custom' && customValues?.mealGroupName) {
            const { data: newGroup, error: groupError } = await supabaseAdmin
                .from('groups')
                .insert({
                    name: customValues.mealGroupName,
                    table_area: customValues.mealGroupTableArea,
                    department: finalDepartment,
                    shift_id: finalShiftId // Might be null if standard shift selected without resolving ID
                })
                .select('id')
                .single();

            if (groupError) throw groupError;
            finalGroupId = newGroup.id;
        }

        // 6. Insert into public.users
        const { error: upsertError } = await supabaseAdmin
            .from('users')
            .upsert({
                id: userId,
                email: email,
                full_name: fullName,
                role: role,
                employee_code: employeeCode,
                shift: finalShiftName,
                department: finalDepartment,
                group_id: (finalGroupId === 'custom' || !finalGroupId) ? null : finalGroupId,
                is_active: true
            });

        if (upsertError) {
            // Cleanup auth user if profile creation fails?
            // await supabaseAdmin.auth.admin.deleteUser(userId);
            return NextResponse.json({ error: upsertError.message }, { status: 400 });
        }

        // 7. Log Activity
        await supabaseAdmin.from('activity_logs').insert({
            action: 'CREATE_USER',
            performed_by: user.id,
            target_type: 'user',
            target_id: userId,
            details: {
                email: email,
                role: role,
                created_via: 'admin_api'
            }
        });

        return NextResponse.json({ success: true, userId: userId });

    } catch (error: any) {
        console.error('API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
