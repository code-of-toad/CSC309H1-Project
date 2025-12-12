// BASE_URL should be set via VITE_BASE_URL environment variable
// In development: http://localhost:8000
// In production (Railway): your Railway backend URL (e.g., https://your-backend.railway.app)
export const BASE_URL = import.meta.env.VITE_BASE_URL;

// Runtime checks for misconfiguration
if (import.meta.env.PROD) {
    if (!BASE_URL) {
        console.error('❌ VITE_BASE_URL is not set! API requests will fail.');
        console.error('   Set VITE_BASE_URL in Railway to your backend URL (e.g., https://your-backend.railway.app)');
    } else if (BASE_URL.includes('localhost')) {
        console.error('❌ VITE_BASE_URL is set to localhost in production!');
        console.error(`   Current value: ${BASE_URL}`);
        console.error('   Set VITE_BASE_URL in Railway to your backend URL (e.g., https://your-backend.railway.app)');
        console.error('   Note: You must rebuild/redeploy after setting the variable.');
    } else {
        console.log('✅ BASE_URL configured:', BASE_URL);
    }
}
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
