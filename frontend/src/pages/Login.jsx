import './Login.css';
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { BASE_URL } from '../globals';

function Login() {
    // Access `login()` method and authentication state from AuthContext
    const { login, isAuthenticated } = useAuth();

    // Used to programmatically navigate after successful login
    const navigate = useNavigate();

    // Form state for UTORid and password inputs
    const [utorid, setUtorid] = useState('');
    const [password, setPassword] = useState('');

    // Error message to display below the form (e.g., incorrect password)
    const [error, setError] = useState(null);

    // Used to show loading text and disable button during API call
    const [loading, setLoading] = useState(false);

    // ---------------------------------------------------------------------
    // If the user is already logged in, redirect them directly to dashbaord
    // instead of showing the login page again
    // ---------------------------------------------------------------------
    if (isAuthenticated) {
        return <Navigate to='/dashboard' replace />;
    }

    // ----------------------------------------
    // Handle form submission and login request
    // ----------------------------------------
    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);  // Clear previous error messages
        setLoading(true);

        // Send login credentials to backend
        const res = await fetch(`${BASE_URL}/auth/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ utorid, password }),
        });

        // Parse JSON response (token, expiresAt, name, role, etc.)
        const data = await res.json();
        setLoading(false);

        // If backend returned an error (401, 404, etc.)
        if (!res.ok) {
            setError(data.message || 'Login failed');
            return;
        }

        console.log('JWT: ', data.token);
        console.log('Expires at: ', data.expiresAt);

        // Save auth info into global AuthContext + localStorage
        // `expiresAt` is converted into a timestamp number for easy comparison
        login({
            token: data.token,
            expiresAt: new Date(data.expiresAt).getTime(), // Convert ISO -> number
            name: data.name,
            role: data.role,
            points: data.points,
        });

        // Redirect user to dashboard after successful login
        navigate('/dashboard');
    };

    return (
        <div className='login-page'>
            <div className='login-card'>
                <h1 className='login-title'>Gihon Loyalty</h1>

                <form onSubmit={handleLogin} className='login-form'>
                    <label htmlFor='utorid'>UTORid</label>
                    <input
                        type='text'
                        id='utorid'
                        placeholder='Enter your UTORid'
                        value={utorid}
                        onChange={e => setUtorid(e.target.value)}
                    />

                    <label htmlFor='password'>Password</label>
                    <input
                        type='password'
                        id='password'
                        placeholder='Enter your password'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />

                    <button type='submit' disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>

                    <p
                        className='forgot-link'
                        onClick={() => navigate('/forgot-password')}
                    >
                        Forgot password?
                    </p>

                    {error && <p className='error-msg'>{error}</p>}
                </form>
            </div>
        </div>
    ); 
}

export default Login;
