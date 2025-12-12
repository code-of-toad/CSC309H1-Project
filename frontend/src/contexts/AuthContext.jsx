import { createContext, useContext, useState, useEffect } from 'react';

// Create a React Context object for global authentication state
const AuthContext = createContext();

// Convenience hook so components can easily access auth state
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // JWT token returned from backend on login
    const [token, setToken] = useState(null);

    // Timestamp (number) when token expires
    const [expiresAt, setExpiresAt] = useState(null);

    // User's display name
    const [name, setName] = useState(null);

    // User's role (regular, cashier, manager, superuser)
    const [role, setRole] = useState(null);

    // User's points
    const [points, setPoints] = useState(null);

    // Reference to a timer that will auto-logout the user when token expires
    const [logoutTimer, setLogoutTimer] = useState(null);

    // ---add comment---
    const [initializing, setInitializing] = useState(true);

    // ---------------------------------------------------------
    // Restore authentication state from localStorage on refresh
    // ---------------------------------------------------------
    useEffect(() => {
        const savedToken = localStorage.getItem('token');
        const savedExpires = localStorage.getItem('expiresAt');
        const savedName = localStorage.getItem('name');
        const savedRole = localStorage.getItem('role');
        const savedPoints = localStorage.getItem('points');

        // Restore name/role immediately
        if (savedRole) setRole(savedRole);
        if (savedName) setName(savedName);
        if (savedPoints) setPoints(savedPoints);

        // Restore token only if it's NOT expired
        if (savedToken && savedExpires) {
            const now = Date.now();
            if (now < Number(savedExpires)) {
                setToken(savedToken);
                setExpiresAt(Number(savedExpires));
            } else {
                // Token expired -> Clear everything
                clearAuth();
            }
        }

        setInitializing(false);
    }, []);

    // -------------------------------------------
    // Auto-logout user when token expiration hits
    // -------------------------------------------
    useEffect(() => {
        // If missing token or expiration timestamp, do nothing
        if (!token || !expiresAt) return;

        // Calculate remaning time until logout
        const remaining = expiresAt - Date.now();

        // If already expired, clear immediately
        if (remaining <= 0) {
            clearAuth();
            return;
        }

        // Schedule auto-logout
        const timer = setTimeout(clearAuth, remaining);
        setLogoutTimer(timer);

        // Clean-up old timer whenever token/expiresAt changes
        return () => clearTimeout(timer);
    }, [token, expiresAt]);

    // -----------------------------------------------------------
    // Clear all authentication state (used for logout/expiration)
    // -----------------------------------------------------------
    const clearAuth = () => {
        setToken(null);
        setExpiresAt(null);
        setName(null);
        setRole(null);
        setPoints(null);
        // Remove persisted auth values from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('expiresAt');
        localStorage.removeItem('name');
        localStorage.removeItem('role');
        localStorage.removeItem('points');
    };

    // -----------------------------------------------------------
    // Handle login: Store token, name, role, expiration
    // -----------------------------------------------------------
    const login = (data) => {
        setToken(data.token);
        setExpiresAt(data.expiresAt);
        setName(data.name);
        setRole(data.role);
        setPoints(data.points);
        // Persist values for page refreshes
        localStorage.setItem('token', data.token);
        localStorage.setItem('expiresAt', data.expiresAt);
        localStorage.setItem('name', data.name);
        localStorage.setItem('role', data.role);
        localStorage.setItem('points', data.points);
    };

    // Logout is simply clearing all stored auth state
    const logout = () => {
        clearAuth();
    };

    // Boolean indicating whether user is currently logged in
    const isAuthenticated = !!token;

    // Values exposed to all components through React Context
    const value = {
        token,
        expiresAt,
        name,
        role,
        points,
        isAuthenticated,
        initializing,
        login,
        logout,
    };

    return (
        // Provide auth values and functions to the entire app
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
