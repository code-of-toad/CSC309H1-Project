import { useState } from 'react';
import { api } from '../services/api';
import './PasswordResetRequest.css';

function PasswordResetRequest() {
    const [utorid, setUtorid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            await api('/auth/resets', {
                method: 'POST',
                body: { utorid },
            });

            setSuccess('A password reset link has been sent to your email.');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-page">
            <div className="reset-card">
                <h1 className="reset-title">Password Reset</h1>

                <form className="reset-form" onSubmit={handleSubmit}>
                    <input
                        type="text"
                        id="utorid"
                        placeholder="Enter your UTORid"
                        value={utorid}
                        onChange={(e) => setUtorid(e.target.value)}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Requesting…' : 'Request Reset'}
                    </button>

                    {error && <p className="error-msg">{error}</p>}
                    {success && <p className="success-msg">{success}</p>}
                </form>
            </div>
        </div>
    );
}

export default PasswordResetRequest;
