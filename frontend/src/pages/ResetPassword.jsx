import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './ResetPassword.css';

function ResetPassword() {
    const { resetToken } = useParams();
    const navigate = useNavigate();

    const [utorid, setUtorid] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const submit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (password !== confirm) {
            setError('Passwords do not match.');
            return;
        }

        try {
            setLoading(true);

            await api(`/auth/resets/${resetToken}`, {
                method: 'POST',
                body: { utorid, password },
            });

            setSuccess('Your password has been successfully reset.');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="resetpw-page">
            <div className="resetpw-card">
                <h1 className="resetpw-title">Reset Your Password</h1>

                <form onSubmit={submit} className="resetpw-form">

                    <label htmlFor="utorid">UTORid</label>
                    <input
                        id="utorid"
                        type="text"
                        value={utorid}
                        onChange={(e) => setUtorid(e.target.value)}
                        required
                    />

                    <label htmlFor="newpass">New Password</label>
                    <input
                        id="newpass"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />

                    <label htmlFor="confirm">Confirm New Password</label>
                    <input
                        id="confirm"
                        type="password"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? 'Resetting…' : 'Reset Password'}
                    </button>

                    {error && <p className="error-message">{error}</p>}
                    {success && <p className="success-message">{success}</p>}
                </form>
            </div>
        </div>
    );
}

export default ResetPassword;
