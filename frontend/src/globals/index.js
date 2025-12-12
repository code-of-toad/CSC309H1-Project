// Use VITE_BACKEND_URL (Railway) or VITE_BASE_URL (local dev), with fallback to localhost for dev
export const BASE_URL = 
    import.meta.env.VITE_BACKEND_URL || 
    import.meta.env.VITE_BASE_URL || 
    (import.meta.env.DEV ? 'http://localhost:8000' : '');
export const ROLE_RANK = {
    regular: 1,
    cashier: 2,
    manager: 3,
    superuser: 4,
};

export function hasClearance(userRole, minimumRole) {
    return ROLE_RANK[userRole] >= ROLE_RANK[minimumRole];
}

export function formatDate(timestamp) {
    if (!timestamp) return '—';
    const d = new Date(timestamp);

    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',  // Jan, Feb, Mar, ...
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',  // 24-hour style (professional dashboard standard)
        hour12: false,
    });
}
