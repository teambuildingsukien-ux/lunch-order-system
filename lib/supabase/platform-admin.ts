import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Platform Owner Authentication Helpers
 * 
 * These utilities manage authentication and authorization for platform owners
 * (super admins who can manage multiple tenants).
 */

export interface PlatformOwner {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    permissions: Record<string, any>;
    created_at: string;
    updated_at: string;
    last_login_at?: string;
}

/**
 * Check if the current user is a platform owner
 * 
 * @returns Promise<boolean> - True if user is an active platform owner
 * 
 * @example
 * ```typescript
 * const isOwner = await isPlatformOwner();
 * if (isOwner) {
 *   // Show platform admin UI
 * }
 * ```
 */
export async function isPlatformOwner(): Promise<boolean> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return false;
        }

        const { data, error } = await supabase
            .from('platform_owners')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        return !!data && !error;
    } catch (error) {
        console.error('[Platform Auth] Error checking platform owner:', error);
        return false;
    }
}

/**
 * Get platform owner info for the current user
 * 
 * @returns Promise<PlatformOwner | null> - Platform owner data or null
 * 
 * @example
 * ```typescript
 * const owner = await getPlatformOwnerInfo();
 * if (owner) {
 *   console.log(`Platform admin: ${owner.full_name}`);
 * }
 * ```
 */
export async function getPlatformOwnerInfo(): Promise<PlatformOwner | null> {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return null;
        }

        const { data, error } = await supabase
            .from('platform_owners')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (error || !data) {
            return null;
        }

        // Update last login timestamp
        await supabase
            .from('platform_owners')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', data.id);

        return data as PlatformOwner;
    } catch (error) {
        console.error('[Platform Auth] Error getting platform owner info:', error);
        return null;
    }
}

/**
 * Require platform owner access - throws error if not authorized
 * Use this in API routes to protect platform-only endpoints
 * 
 * @throws Error if user is not a platform owner
 * @returns Promise<PlatformOwner> - Platform owner data
 * 
 * @example
 * ```typescript
 * export async function GET(request: NextRequest) {
 *   try {
 *     const owner = await requirePlatformOwner();
 *     // Continue with platform admin logic
 *   } catch (error) {
 *     return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
 *   }
 * }
 * ```
 */
export async function requirePlatformOwner(): Promise<PlatformOwner> {
    const ownerInfo = await getPlatformOwnerInfo();

    if (!ownerInfo) {
        throw new Error('Platform owner access required');
    }

    return ownerInfo;
}

/**
 * Create platform audit log entry
 * 
 * Logs all platform owner actions for compliance and debugging.
 * Uses admin client to bypass RLS.
 * 
 * @param action - Action type (e.g., 'create_tenant', 'update_pricing')
 * @param targetTenantId - Optional tenant ID affected by action
 * @param details - Optional action details (JSONB)
 * @param ipAddress - Optional client IP address
 * @param userAgent - Optional client user agent
 * 
 * @returns Promise<string | null> - Log ID or null on failure
 * 
 * @example
 * ```typescript
 * await logPlatformAction(
 *   'update_branding',
 *   tenantId,
 *   { logo_url: 'new-logo.png', primary_color: '#FF6600' },
 *   request.headers.get('x-forwarded-for') || '',
 *   request.headers.get('user-agent') || ''
 * );
 * ```
 */
export async function logPlatformAction(
    action: string,
    targetTenantId?: string,
    details?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
): Promise<string | null> {
    try {
        const supabase = createAdminClient();

        // Get current platform owner
        const userSupabase = await createClient();
        const { data: { user } } = await userSupabase.auth.getUser();

        if (!user) {
            console.error('[Platform Audit] No authenticated user');
            return null;
        }

        // Get platform owner ID
        const { data: ownerData } = await supabase
            .from('platform_owners')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (!ownerData) {
            console.error('[Platform Audit] User is not a platform owner');
            return null;
        }

        // Insert audit log
        const { data, error } = await supabase
            .from('platform_audit_logs')
            .insert({
                platform_owner_id: ownerData.id,
                action,
                target_tenant_id: targetTenantId || null,
                details: details || {},
                ip_address: ipAddress || null,
                user_agent: userAgent || null
            })
            .select('id')
            .single();

        if (error) {
            console.error('[Platform Audit] Error creating log:', error);
            return null;
        }

        return data.id;
    } catch (error) {
        console.error('[Platform Audit] Unexpected error:', error);
        return null;
    }
}

/**
 * Get IP address from Next.js request headers
 * 
 * @param headers - Request headers
 * @returns string - Client IP address
 */
export function getClientIp(headers: Headers): string {
    return headers.get('x-forwarded-for')?.split(',')[0].trim()
        || headers.get('x-real-ip')
        || 'unknown';
}

/**
 * Get user agent from request headers
 * 
 * @param headers - Request headers
 * @returns string - Client user agent
 */
export function getClientUserAgent(headers: Headers): string {
    return headers.get('user-agent') || 'unknown';
}
