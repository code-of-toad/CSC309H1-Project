// src/pages/PromotionDetails.jsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import './PromotionDetails.css';

function PromotionDetails() {
    const api = useApi();
    const navigate = useNavigate();
    const { promotionId } = useParams();
    const { role } = useAuth();

    const isManager = role === 'manager' || role === 'superuser';

    const [promo, setPromo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit Form Fields
    const [form, setForm] = useState({});
    const [message, setMessage] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api(`/promotions/${promotionId}`);
                setPromo(data);

                // initialize edit form values
                setForm({
                    name: data.name,
                    description: data.description,
                    type: data.type,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    minSpending: data.minSpending ?? '',
                    rate: data.rate ?? '',
                    points: data.points ?? ''
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [promotionId]);

    if (loading) return <p>Loading promotion...</p>;
    if (error) return <p className="error">{error}</p>;
    if (!promo) return <p>Promotion not found.</p>;

    // ----------------------------
    // FIELD UPDATE HELPER
    // ----------------------------
    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    // ----------------------------
    // SAVE CHANGES
    // ----------------------------
    const handleSave = async () => {
        setMessage(null);

        try {
            const payload = {};

            Object.entries(form).forEach(([k, v]) => {
                if (v !== '' && v !== promo[k]) {
                    payload[k] = v;
                }
            });

            const updated = await api(`/promotions/${promotionId}`, {
                method: 'PATCH',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });

            setPromo(prev => ({ ...prev, ...updated }));
            setMessage('Promotion updated successfully.');
        } catch (err) {
            setMessage(err.message);
        }
    };

    // ----------------------------
    // DELETE PROMOTION
    // ----------------------------
    const handleDelete = async () => {
        if (!window.confirm('Delete this promotion?')) return;

        try {
            await api(`/promotions/${promotionId}`, { method: 'DELETE' });
            navigate('/promotions');
        } catch (err) {
            setMessage(err.message);
        }
    };

    return (
        <div className="promo-details-container">
            <h1>Promotion #{promo.id}</h1>

            <p><strong>Name:</strong> {promo.name}</p>
            <p><strong>Description:</strong> {promo.description}</p>
            <p><strong>Type:</strong> {promo.type}</p>

            <p><strong>Start:</strong> {promo.startTime}</p>
            <p><strong>End:</strong> {promo.endTime}</p>

            <p><strong>Min Spending:</strong> {promo.minSpending ?? '—'}</p>
            <p><strong>Rate:</strong> {promo.rate ?? '—'}</p>
            <p><strong>Points:</strong> {promo.points ?? '—'}</p>

            {/* Manager-only action buttons */}
            {isManager && (
                <>
                    <h2>Edit Promotion</h2>

                    <div className="promo-edit-box">
                        <label>Name</label>
                        <input
                            value={form.name}
                            onChange={(e) => update('name', e.target.value)}
                        />

                        <label>Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => update('description', e.target.value)}
                        />

                        <label>Type</label>
                        <select
                            value={form.type}
                            onChange={(e) => update('type', e.target.value)}
                        >
                            <option value="automatic">automatic</option>
                            <option value="one-time">one-time</option>
                        </select>

                        <label>Start Time</label>
                        <input
                            type="datetime-local"
                            value={form.startTime}
                            onChange={(e) => update('startTime', e.target.value)}
                        />

                        <label>End Time</label>
                        <input
                            type="datetime-local"
                            value={form.endTime}
                            onChange={(e) => update('endTime', e.target.value)}
                        />

                        <label>Min Spending</label>
                        <input
                            type="number"
                            value={form.minSpending}
                            onChange={(e) => update('minSpending', e.target.value)}
                        />

                        <label>Rate</label>
                        <input
                            type="number"
                            step="0.01"
                            value={form.rate}
                            onChange={(e) => update('rate', e.target.value)}
                        />

                        <label>Points</label>
                        <input
                            type="number"
                            value={form.points}
                            onChange={(e) => update('points', e.target.value)}
                        />

                        <button className="save-btn" onClick={handleSave}>
                            Save Changes
                        </button>

                        {/* DELETE BUTTON: only if promo hasn't started yet */}
                        <button className="delete-btn" onClick={handleDelete}>
                            Delete Promotion
                        </button>

                        {message && (
                            <p className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
                                {message}
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

export default PromotionDetails;
