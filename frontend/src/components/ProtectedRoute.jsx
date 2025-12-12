import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children }) {
    // Access authentication state from the AuthContext
    const { isAuthenticated, expiresAt, initializing } = useAuth();

    // Wait until AuthContext finishes loading localStorage
    if (initializing) return <p>Loading...</p>;

    // Determine whether the current token has expired
    // `expiresAt` is a timestamp number. So, compare it to the current time.
    const expired = expiresAt && Date.now() > expiresAt;

    // If user is NOT logged in OR their token is expired, redirect them back
    // to the login page.
    // `replace` prevents this failed route from being added to the browser history
    if (!isAuthenticated || expired) {
        return <Navigate to='/login' replace />;
    }

    // If authenticated and token is valid -> Render the protected page
    return children;
}

export default ProtectedRoute;
