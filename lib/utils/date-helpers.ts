export function toLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Returns YYYY-MM-DD in Vietnam Timezone (GMT+7)
 * Useful for Server-Side implementations where local time might be UTC
 */
export function getVietnamDateString(date: Date = new Date()): string {
    return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
}
