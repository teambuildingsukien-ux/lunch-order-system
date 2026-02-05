import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * PUT /api/admin/employees/[id]
 * Update employee information (admin/manager only)
 * 
 * IMPORTANT: Next.js 15 Breaking Change
 * params is now a Promise and must be awaited
 */
export async function PUT(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    // Next.js 15: Await params first
    const params = await context.params;

    console.log('[DEBUG] 🔵 PUT /api/admin/employees/[id] called');
    console.log('[DEBUG] Params object:', params);
    console.log('[DEBUG] Employee ID:', params.id);

    try {
        const supabase = await createClient();

        // Get current user
        const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
        console.log('[DEBUG] Current user:', currentUser?.id);
        console.log('[DEBUG] Auth error:', authError);

        if (authError || !currentUser) {
            console.error('[DEBUG] ❌ Authentication failed');
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Get current user's profile with role and tenant_id
        const { data: currentProfile, error: profileError } = await supabase
            .from('users')
            .select('role, tenant_id')
            .eq('id', currentUser.id)
            .single();

        if (profileError || !currentProfile) {
            console.error('[UPDATE_EMPLOYEE] Profile fetch error:', profileError);
            return NextResponse.json(
                { error: 'User profile not found' },
                { status: 404 }
            );
        }

        // Check if user is admin or manager
        const role = currentProfile.role?.toLowerCase();
        if (role !== 'admin' && role !== 'manager') {
            return NextResponse.json(
                { error: 'Insufficient permissions. Admin or Manager role required.' },
                { status: 403 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            full_name,
            role: newRole,
            employee_code,
            shift,
            department,
            group_id
        } = body;

        // Validate required fields
        if (!full_name?.trim()) {
            return NextResponse.json(
                { error: 'Full name is required' },
                { status: 400 }
            );
        }

        if (!newRole) {
            return NextResponse.json(
                { error: 'Role is required' },
                { status: 400 }
            );
        }

        // Validate role value
        const validRoles = ['employee', 'manager', 'admin', 'kitchen'];
        if (!validRoles.includes(newRole.toLowerCase())) {
            return NextResponse.json(
                { error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
                { status: 400 }
            );
        }

        // Get employee to verify they're in the same tenant
        console.log('[DEBUG] 🔍 Fetching employee with ID:', params.id);
        console.log('[DEBUG] Query: SELECT * FROM users WHERE id =', params.id);

        const { data: employee, error: employeeError } = await supabase
            .from('users')
            .select('id, tenant_id, email, full_name, role')
            .eq('id', params.id)
            .single();

        console.log('[DEBUG] Employee query result:', employee);
        console.log('[DEBUG] Employee query error:', employeeError);

        if (employeeError || !employee) {
            console.error('[DEBUG] ❌ Employee NOT FOUND:', {
                params_id: params.id,
                error: employeeError,
                errorCode: employeeError?.code,
                errorMessage: employeeError?.message
            });
            return NextResponse.json(
                { error: 'Employee not found' },
                { status: 404 }
            );
        }

        console.log('[DEBUG] ✅ Employee found:', employee.id);

        // Verify same tenant
        if (employee.tenant_id !== currentProfile.tenant_id) {
            console.warn('[UPDATE_EMPLOYEE] Cross-tenant update attempt:', {
                admin: currentUser.id,
                employee: params.id,
                adminTenant: currentProfile.tenant_id,
                employeeTenant: employee.tenant_id
            });
            return NextResponse.json(
                { error: 'Cannot update employees from other tenants' },
                { status: 403 }
            );
        }

        // Prepare update data
        const updateData: any = {
            full_name: full_name.trim(),
            role: newRole.toLowerCase(), // Normalize to lowercase
            updated_at: new Date().toISOString()
        };

        // Optional fields
        if (employee_code !== undefined) updateData.employee_code = employee_code?.trim() || null;
        if (shift !== undefined) updateData.shift = shift?.trim() || null;
        if (department !== undefined) updateData.department = department?.trim() || null;
        if (group_id !== undefined) updateData.group_id = group_id || null;

        console.log('[UPDATE_EMPLOYEE] Updating employee:', {
            id: params.id,
            changes: updateData,
            performedBy: currentUser.id
        });

        // Update employee
        const { data: updatedEmployee, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('id', params.id)
            .eq('tenant_id', currentProfile.tenant_id) // Double-check tenant isolation
            .select()
            .single();

        if (updateError) {
            console.error('[UPDATE_EMPLOYEE] Update error:', updateError);
            return NextResponse.json(
                { error: `Failed to update employee: ${updateError.message}` },
                { status: 500 }
            );
        }

        // Log activity
        const { error: logError } = await supabase
            .from('activity_logs')
            .insert({
                tenant_id: currentProfile.tenant_id,
                action: 'UPDATE_USER',
                performed_by: currentUser.id,
                target_type: 'user',
                target_id: params.id,
                details: {
                    before: {
                        full_name: employee.full_name,
                        role: employee.role
                    },
                    after: {
                        full_name: updateData.full_name,
                        role: updateData.role,
                        employee_code: updateData.employee_code,
                        department: updateData.department,
                        shift: updateData.shift,
                        group_id: updateData.group_id
                    }
                }
            });

        if (logError) {
            console.error('[UPDATE_EMPLOYEE] Activity log error:', logError);
            // Don't fail the request if logging fails
        }

        console.log('[UPDATE_EMPLOYEE] ✅ Employee updated successfully:', params.id);

        return NextResponse.json({
            success: true,
            employee: updatedEmployee
        });

    } catch (error: any) {
        console.error('[UPDATE_EMPLOYEE] Unexpected error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
