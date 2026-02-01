/**
 * Trial period utilities
 * Calculates trial expiration and checks trial status
 */

export interface Tenant {
    trial_ends_at: string | null;
    subscription_status: string;
}

/**
 * Calculate trial end date
 * @param days - Number of trial days (default 14)
 * @returns Date - Trial end date
 */
export function calculateTrialEnd(days: number = 14): Date {
    const now = new Date();
    now.setDate(now.getDate() + days);
    return now;
}

/**
 * Check if trial has expired
 * @param tenant - Tenant object
 * @returns boolean - true if trial expired
 */
export function isTrialExpired(tenant: Tenant): boolean {
    if (!tenant.trial_ends_at) return false; // No trial = paid customer

    const trialEnd = new Date(tenant.trial_ends_at);
    return trialEnd < new Date();
}

/**
 * Get remaining trial days
 * @param tenant - Tenant object
 * @returns number - Days remaining (0 if expired or no trial)
 */
export function getTrialDaysRemaining(tenant: Tenant): number {
    if (!tenant.trial_ends_at) return 0;

    const trialEnd = new Date(tenant.trial_ends_at);
    const now = new Date();

    if (trialEnd < now) return 0;

    const diffTime = trialEnd.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
}

/**
 * Format trial status message
 * @param tenant - Tenant object
 * @returns string - Human-readable trial status
 */
export function getTrialStatusMessage(tenant: Tenant): string {
    const daysRemaining = getTrialDaysRemaining(tenant);

    if (!tenant.trial_ends_at) {
        return 'Active subscription';
    }

    if (daysRemaining === 0) {
        return 'Trial expired';
    }

    if (daysRemaining === 1) {
        return 'Trial expires tomorrow';
    }

    return `${daysRemaining} days remaining in trial`;
}
