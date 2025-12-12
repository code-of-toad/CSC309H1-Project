import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import './ChangePasswordForm.css';

function ChangePasswordForm() {
    const api = useApi();

    const [oldPw, setOldPw] = useState('');
    const [newPw, setNewPw] = useState('');
    const [confirmPw, setConfirmPw] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Basic client-side validation
        if (newPw !== confirmPw) {
            setError("New passwords do not match.");
            return;
        }

        try {
            setLoading(true);

            await api('/users/me/password', {
                method: 'PATCH',
                body: {
                    old: oldPw,
                    new: newPw,
                },
            });

            setSuccess("Password updated successfully.");
            setOldPw('');
            setNewPw('');
            setConfirmPw('');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="pw-form" onSubmit={handleSubmit}>
            <div className="pw-row">
                <label>Current Password</label>
                <input
                    type="password"
                    value={oldPw}
                    onChange={(e) => setOldPw(e.target.value)}
                    required
                />
            </div>

            <div className="pw-row">
                <label>New Password</label>
                <input
                    type="password"
                    value={newPw}
                    onChange={(e) => setNewPw(e.target.value)}
                    required
                />
            </div>

            <div className="pw-row">
                <label>Confirm New Password</label>
                <input
                    type="password"
                    value={confirmPw}
                    onChange={(e) => setConfirmPw(e.target.value)}
                    required
                />
            </div>

            <button className="pw-submit" type="submit" disabled={loading}>
                {loading ? "Updating…" : "Update Password"}
            </button>

            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}
        </form>
    );
}

export default ChangePasswordForm;
