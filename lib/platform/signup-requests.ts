/**
 * Platform Signup Requests Helper Functions
 * Các hàm helper để tương tác với signup requests API
 */

export interface SignupRequest {
    id: string;
    tenant_id: string;
    company_name: string;
    company_address?: string;
    company_phone?: string;
    company_website?: string;
    employee_count?: string;
    contact_name: string;
    contact_title?: string;
    contact_email: string;
    contact_phone?: string;
    status: 'pending' | 'email_verified' | 'approved' | 'rejected';
    email_verified: boolean;
    email_verified_at?: string;
    approved_by?: string;
    approved_at?: string;
    rejected_by?: string;
    rejected_at?: string;
    rejection_reason?: string;
    signup_source?: string;
    signup_notes?: string;
    created_at: string;
    updated_at: string;
    // Joined tenant data
    tenant?: {
        id: string;
        name: string;
        slug: string;
        status: string;
        is_active: boolean;
    };
}

export interface FetchSignupRequestsParams {
    status?: string;
    search?: string;
}

/**
 * Fetch tất cả signup requests với filters
 */
export async function fetchSignupRequests(
    params?: FetchSignupRequestsParams
): Promise<SignupRequest[]> {
    const searchParams = new URLSearchParams();

    if (params?.status) {
        searchParams.set('status', params.status);
    }

    if (params?.search) {
        searchParams.set('search', params.search);
    }

    const url = `/api/platform/signup-requests?${searchParams.toString()}`;
    const response = await fetch(url);

    if (!response.ok) {
        throw new Error('Failed to fetch signup requests');
    }

    const data = await response.json();
    return data.requests || [];
}

/**
 * Fetch chi tiết một signup request
 */
export async function fetchSignupRequestById(
    id: string
): Promise<SignupRequest> {
    const response = await fetch(`/api/platform/signup-requests/${id}`);

    if (!response.ok) {
        throw new Error('Failed to fetch signup request details');
    }

    const data = await response.json();
    return data.request;
}

/**
 * Approve signup request
 */
export async function approveSignupRequest(id: string): Promise<void> {
    const response = await fetch(`/api/platform/signup-requests/${id}/approve`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to approve signup request');
    }
}

/**
 * Reject signup request với lý do
 */
export async function rejectSignupRequest(
    id: string,
    reason: string
): Promise<void> {
    const response = await fetch(`/api/platform/signup-requests/${id}/reject`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to reject signup request');
    }
}

/**
 * Update sales notes cho signup request
 */
export async function updateSignupNotes(
    id: string,
    notes: string
): Promise<void> {
    const response = await fetch(`/api/platform/signup-requests/${id}/notes`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notes }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update signup notes');
    }
}

/**
 * Format employee count cho display
 */
export function formatEmployeeCount(count?: string): string {
    if (!count) return 'Không xác định';

    const mapping: Record<string, string> = {
        '1-10': '1-10 nhân viên',
        '11-50': '11-50 nhân viên',
        '51-200': '51-200 nhân viên',
        '201-500': '201-500 nhân viên',
        '500+': 'Hơn 500 nhân viên',
    };

    return mapping[count] || count;
}

/**
 * Format signup source cho display
 */
export function formatSignupSource(source?: string): string {
    if (!source) return 'Không xác định';

    const mapping: Record<string, string> = {
        website: 'Website',
        referral: 'Giới thiệu',
        sales: 'Sale team',
        other: 'Khác',
    };

    return mapping[source] || source;
}

/**
 * Format date cho display (Vietnamese format)
 */
export function formatDate(dateString?: string): string {
    if (!dateString) return '—';

    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date);
}

/**
 * Format relative time (e.g., "2 giờ trước")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return formatDate(dateString);
}
