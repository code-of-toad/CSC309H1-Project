import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

/**
 * Custom hook that returns a function for making authenticated API requests.
 * 
 * Automatically:
 * - Attaches the JWT token from AuthContext
 * - Logs the user out if backend returns 401 or 403
 * - Forwards all options to the lower-level `api` helper
 * 
 * This keeps API calls clean inside components:
 * 
 * USAGE:
 * ------
 * const api = useApi();
 * const data = await api('/endpoint', { method: 'POST', body: {...} }); 
 */
export function useApi() {
    // Get the current JWT and logout function from AuthContext
    const { token, logout } = useAuth();

    /**
     * `useCallback` memoizes the function so it is re-created only when
     * `token` or `logout` changes. This prevents unnecessary re-renders in
     * components that depend on this hook.
     */
    const authFetch = useCallback(
        async (path, options = {}) => {
            try {
                // Call the underlying API helper and pass the JWT token.
                // `api()` handles JSON, errors, headers, base URL, etc.
                const data = await api(path, {
                    ...options,
                    token,
                });
                return data;
            } catch (err) {
                // Auto-logout if server reports 401
                if (err.status === 401) {
                    logout();
                }
                // Re-throw the error so the calling component can handle it.
                throw err;
            }
        },
        [token, logout],  // Dependencies for memoization
    );

    // Return the wrapped fetch function to components
    return authFetch;
}

/**
 * EXAMPLE USAGE:
 * --------------
 * import { useApi } from '../hooks/useApi';
 * 
 * function SomeComponent() {
 *     const api = useApi();
 * 
 *     const loadStuff = async () => {
 *         try {
 *             const data = await api('/some/protected/endpoint', {
 *                 method: 'GET',
 *             });
 *             console.log(data);
 *         } catch (err) {
 *             console.error(err.message);
 *         }
 *     };
 * 
 *     // ...
 * }
 */
