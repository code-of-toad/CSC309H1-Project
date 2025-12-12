import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate } from '../globals';
import EditableField from '../components/EditableField';
import ChangePasswordForm from '../components/ChangePasswordForm';
import './Profile.css';

function Profile() {
    const api = useApi();

    const [me, setMe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [qrToken, setQrToken] = useState(null);
    const [qrLoading, setQrLoading] = useState(false);
    const [qrError, setQrError] = useState(null);

    const loadQr = async () => {
        try {
            setQrLoading(true);
            setQrError(null);

            const data = await api('/auth/qr/user', {
                method: 'GET',
            });

            setQrToken(data.token);
        } catch (err) {
            setQrError(err.message);
        } finally {
            setQrLoading(false);
        }
    };

    // Optional: Auto-load on mount
    useEffect(() => {
        loadQr();
    }, []);

    //----------------------------------------------------
    // Load logged-in user's profile data
    //----------------------------------------------------
    useEffect(() => {
        const load = async () => {
            try {
                const data = await api('/users/me', { method: 'GET' });
                setMe(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    //----------------------------------------------------
    // Handle PATCH to update fields
    //----------------------------------------------------
    const updateField = async (fieldName, newValue) => {
        const payload = { [fieldName]: newValue };

        const updated = await api('/users/me', {
            method: 'PATCH',
            body: payload,
        });

        // Merge updated field into existing data
        setMe(prev => ({ ...prev, ...updated }));
    };

    //----------------------------------------------------
    // Loading / Error
    //----------------------------------------------------
    if (loading) return <p>Loading profile...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!me) return null;

    //----------------------------------------------------
    // Render
    //----------------------------------------------------
    return (
        <div className="profile-container">
            <h1>Your Profile</h1>

            {/* AVATAR */}
            <div className="avatar-section">
                {me.avatarUrl ? (
                    <img src={me.avatarUrl} alt="Avatar" className="profile-avatar" />
                ) : (
                    <div className="avatar-placeholder">No Avatar</div>
                )}
            </div>

            {/* GENERAL INFORMATION */}
            <section className="profile-section">
                <h2>General Info</h2>

                <EditableField
                    label="Name"
                    type="text"
                    value={me.name}
                    canEdit={true}
                    onSave={(val) => updateField('name', val)}
                />

                <EditableField
                    label="Email"
                    type="text"
                    value={me.email}
                    canEdit={true}
                    onSave={(val) => updateField('email', val)}
                />

                <EditableField
                    label="Birthday"
                    type="date"
                    value={me.birthday ? me.birthday.split('T')[0] : ''}
                    canEdit={true}
                    onSave={(val) => updateField('birthday', val)}
                />

                {/* Role displayed but NOT editable */}
                <p><strong>Role:</strong> {me.role}</p>

                <p><strong>UTORid:</strong> {me.utorid}</p>
                <p><strong>Verified:</strong> {me.verified ? 'Yes' : 'No'}</p>
                <p><strong>Points:</strong> {me.points}</p>
                <p><strong>Created At:</strong> {formatDate(me.createdAt)}</p>
                <p><strong>Last Login:</strong> {formatDate(me.lastLogin)}</p>
            </section>

            {/* PASSWORD CHANGE */}
            <section className="profile-section">
                <h2>Change Password</h2>
                <ChangePasswordForm />
            </section>

            {/* QR CODE */}
            <section className='profile-section'>
                <h2>My QR Code</h2>
                <p className='qr-description'>
                    Show this code to a cashier or another user so they can identify your account for
                    purchases, redemptions, transfers, or adjustments.
                </p>

                {qrError && <p className='error-message'>{qrError}</p>}

                <div className='qr-wrapper'>
                    <div className='qr-block'>
                        {qrToken ? (
                            <QRCodeSVG value={qrToken} size={180} />
                        ) : (
                            !qrLoading && <p>No QR code available.</p>
                        )}
                    </div>

                    <button
                        type='button'
                        className='qr-refresh-button'
                        onClick={loadQr}
                        disabled={qrLoading}
                    >
                        {qrLoading ? 'Refreshing…' : 'Refresh QR Code'}
                    </button>
                </div>
            </section>

            {/* PROMOTIONS */}
            <section className="profile-section">
                <h2>Your Promotions</h2>
                {me.promotions.length === 0 ? (
                    <p>No active promotions.</p>
                ) : (
                    <ul>
                        {me.promotions.map((promo) => (
                            <li key={promo.id}>{promo.name}</li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default Profile;
