import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { hasClearance, formatDate } from '../globals';
import EditableField from '../components/EditableField';
import './UserDetails.css';

function UserDetails() {
    const api = useApi();
    const { role: viewerRole } = useAuth();
    const { userId } = useParams();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isManagerPlus = hasClearance(viewerRole, 'manager');
    const isSuperuser = viewerRole === 'superuser';

    //----------------------------------------------------------------------
    // Load user details
    //----------------------------------------------------------------------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const data = await api(`/users/${userId}`, { method: 'GET' });
                setUser(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [userId]);

    //----------------------------------------------------------------------
    // Update a single field via PATCH
    //----------------------------------------------------------------------
    const updateField = async (fieldName, newValue) => {
        const payload = {};
        payload[fieldName] = newValue;

        const updated = await api(`/users/${userId}`, {
            method: 'PATCH',
            body: payload,
        });

        // Merge updated fields into user state
        setUser(prev => ({
            ...prev,
            ...updated,
        }));
    };

    //----------------------------------------------------------------------
    // Loading / Error / No user
    //----------------------------------------------------------------------
    if (loading) return <p>Loading user...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!user) return null;

    //----------------------------------------------------------------------
    // ROLE OPTIONS FOR ROLE EDIT FIELD
    //----------------------------------------------------------------------
    const roleOptions = isSuperuser
        ? ['regular', 'cashier', 'manager', 'superuser']
        : ['regular', 'cashier'];

    return (
        <div className="user-details-container">
            {/* BACK BUTTON */}
            <Link to="/users" className="back-button">
                ← Back to Users
            </Link>

            <h1>User Details</h1>

            {/* ========================================================================== */}
            {/* BASIC SECTION (Visible to all cashier+) */}
            {/* ========================================================================== */}
            <section className="details-section">
                <h2>General Info</h2>
                <p><strong>ID:</strong> {user.id}</p>
                <p><strong>UTORid:</strong> {user.utorid}</p>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Points:</strong> {user.points}</p>
                <p><strong>Verified:</strong> {user.verified ? 'Yes' : 'No'}</p>
            </section>

            {/* ========================================================================== */}
            {/* MANAGER+ FULL FIELDS WITH INLINE EDITING */}
            {/* ========================================================================== */}
            {isManagerPlus && (
                <section className="details-section">
                    <h2>Account Info (Manager+)</h2>

                    <EditableField
                        label="Email"
                        value={user.email}
                        type="text"
                        canEdit={true}
                        onSave={(newValue) => updateField('email', newValue)}
                    />

                    <EditableField
                        label="Verified"
                        value={user.verified}
                        type="boolean"
                        canEdit={true}
                        onSave={(newValue) => updateField('verified', newValue)}
                    />

                    <EditableField
                        label="Suspicious"
                        value={user.suspicious}
                        type="boolean"
                        canEdit={true}
                        onSave={(newValue) => updateField('suspicious', newValue)}
                    />

                    <EditableField
                        label="Role"
                        value={user.role}
                        type="select"
                        options={roleOptions}
                        canEdit={true}
                        onSave={(newValue) => updateField('role', newValue)}
                    />

                    <p><strong>Birthday:</strong> {user.birthday}</p>
                    <p><strong>Created At:</strong> {formatDate(user.createdAt)}</p>
                    <p><strong>Last Login:</strong> {formatDate(user.lastLogin)}</p>
                </section>
            )}

            {/* ========================================================================== */}
            {/* PROMOTIONS SECTION */}
            {/* ========================================================================== */}
            <section className="details-section">
                <h2>Available Promotions</h2>

                {user.promotions.length === 0 ? (
                    <p>No available promotions.</p>
                ) : (
                    <ul>
                        {user.promotions.map(promo => (
                            <li key={promo.id}>
                                <strong>{promo.name}</strong>
                                {promo.points !== null && (
                                    <span> — {promo.points} pts</span>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

export default UserDetails;
