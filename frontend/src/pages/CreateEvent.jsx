import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { hasClearance } from '../globals';
import './CreateEvent.css';

function CreateEvent() {
    const api = useApi();
    const { role } = useAuth();

    // Access control
    const canCreate = hasClearance(role, 'manager');

    const [form, setForm] = useState({
        name: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        capacity: '',
        points: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const update = (field, value) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const submit = async () => {
        setError(null);
        setSuccess(null);

        if (!canCreate) {
            setError('You do not have permission to create events.');
            return;
        }

        // Build payload
        const payload = {
            name: form.name,
            description: form.description,
            location: form.location,
            startTime: new Date(form.startTime).toISOString(),
            endTime: new Date(form.endTime).toISOString(),
            points: Number(form.points)
        };

        // Capacity is optional + nullable
        if (form.capacity !== '') {
            payload.capacity = Number(form.capacity);
        }

        try {
            setLoading(true);

            const res = await api('/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setSuccess(`Event "${res.name}" created successfully!`);
            setForm({
                name: '',
                description: '',
                location: '',
                startTime: '',
                endTime: '',
                capacity: '',
                points: '',
            });

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="create-event-container">
            <h1>Create New Event</h1>

            {!canCreate && (
                <p className="error-message">You do not have permission to create events.</p>
            )}

            <div className="form-box">

                <label>Name:</label>
                <input
                    type="text"
                    value={form.name}
                    onChange={e => update('name', e.target.value)}
                />

                <label>Description:</label>
                <textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                />

                <label>Location:</label>
                <input
                    type="text"
                    value={form.location}
                    onChange={e => update('location', e.target.value)}
                />

                <label>Start Time (ISO):</label>
                <input
                    type="datetime-local"
                    value={form.startTime}
                    onChange={e => update('startTime', e.target.value)}
                />

                <label>End Time (ISO):</label>
                <input
                    type="datetime-local"
                    value={form.endTime}
                    onChange={e => update('endTime', e.target.value)}
                />

                <label>Capacity (optional):</label>
                <input
                    type="number"
                    placeholder="Leave empty for unlimited"
                    value={form.capacity}
                    onChange={e => update('capacity', e.target.value)}
                />

                <label>Points:</label>
                <input
                    type="number"
                    value={form.points}
                    onChange={e => update('points', e.target.value)}
                />

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <button
                    onClick={submit}
                    disabled={loading || !canCreate}
                    className="submit-btn"
                >
                    {loading ? 'Creating…' : 'Create Event'}
                </button>
            </div>
        </div>
    );
}

export default CreateEvent;
