import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import './EventEdit.css';

function EventEdit() {
    const api = useApi();
    const navigate = useNavigate();
    const { eventId } = useParams();
    const { role, user } = useAuth();

    const [eventData, setEventData] = useState(null);

    // IMPORTANT: Separate page-level errors from update errors
    const [pageError, setPageError] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [success, setSuccess] = useState(null);

    const isManager = role === 'manager' || role === 'superuser';

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [capacity, setCapacity] = useState('');
    const [points, setPoints] = useState('');
    const [published, setPublished] = useState(false);

    const loadEvent = async () => {
        try {
            const data = await api(`/events/${eventId}`, { method: 'GET' });
            setEventData(data);

            // populate form
            setName(data.name);
            setDescription(data.description);
            setLocation(data.location);
            setStartTime(data.startTime.slice(0, 16));
            setEndTime(data.endTime.slice(0, 16));
            if (data.capacity !== null) setCapacity(String(data.capacity));
            if (data.pointsRemain !== undefined) setPoints(String(data.pointsRemain));
            setPublished(Boolean(data.published));

        } catch (err) {
            setPageError(err.message);
        }
    };

    useEffect(() => {
        loadEvent();
    }, [eventId]);

    if (pageError) return <p className="error-message">{pageError}</p>;
    if (!eventData) return <p>Loading...</p>;

    // ---------------------------------------------------------
    // Submit Update
    // ---------------------------------------------------------
    const submitUpdate = async () => {
        setUpdateError(null);
        setSuccess(null);

        const payload = {};

        if (name !== eventData.name) payload.name = name;
        if (description !== eventData.description) payload.description = description;
        if (location !== eventData.location) payload.location = location;

        if (startTime !== eventData.startTime.slice(0, 16)) payload.startTime = startTime;
        if (endTime !== eventData.endTime.slice(0, 16)) payload.endTime = endTime;

        if (capacity !== '') payload.capacity = Number(capacity);

        if (isManager) {
            if (points !== String(eventData.pointsRemain))
                payload.points = Number(points);

            if (!eventData.published && published === true)
                payload.published = true;
        }

        try {
            const updated = await api(`/events/${eventId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            // Merge updates
            setEventData(prev => ({ ...prev, ...updated }));
            setSuccess('Event updated successfully!');

        } catch (err) {
            // DO NOT wipe the page. Only show error inside the edit box.
            if (err.status === 400) {
                setUpdateError(err.message);
                return;
            }
            setUpdateError('Unexpected error occurred');
        }
    };

    // ---------------------------------------------------------
    // DELETE EVENT
    // ---------------------------------------------------------
    const deleteEvent = async () => {
        if (!window.confirm('Are you sure you want to delete this event?')) return;

        try {
            await api(`/events/${eventId}`, { method: 'DELETE' });
            navigate('/events');
        } catch (err) {
            setUpdateError(err.message);
        }
    };

    const canDelete = isManager && !eventData.published;

    console.log("role:", role);
    console.log("isManager:", isManager);
    console.log("eventData.published:", eventData?.published);


    return (
        <div className="event-edit-container">

            <h1>Edit Event</h1>

            {/* Delete Button */}
            {canDelete && (
                <button className="delete-btn" onClick={deleteEvent}>
                    Delete Event
                </button>
            )}

            {/* Update Error */}
            {updateError && <p className="error-message">{updateError}</p>}
            {success && <p className="success-message">{success}</p>}

            {/* Form */}
            <div className="edit-form">

                <label>Name</label>
                <input value={name} onChange={e => setName(e.target.value)} />

                <label>Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} />

                <label>Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} />

                <label>Start Time</label>
                <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />

                <label>End Time</label>
                <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />

                <label>Capacity</label>
                <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} />

                {isManager && (
                    <>
                        <label>Points Remaining</label>
                        <input type="number" value={points} onChange={e => setPoints(e.target.value)} />

                        {!eventData.published && (
                            <>
                                <label>Publish Event?</label>
                                <input
                                    type="checkbox"
                                    checked={published}
                                    onChange={e => setPublished(e.target.checked)}
                                />
                            </>
                        )}
                    </>
                )}

                <button className="submit-btn" onClick={submitUpdate}>
                    Save Changes
                </button>

            </div>
        </div>
    );
}

export default EventEdit;
