import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import './EventDetailsBasic.css';

function EventDetailsBasic() {
    const api = useApi();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { eventId } = useParams();

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [rsvpMessage, setRsvpMessage] = useState(null);

    //-----------------------------------------------------
    // Load Event
    //-----------------------------------------------------
    useEffect(() => {
        const loadEvent = async () => {
            try {
                const data = await api(`/events/${eventId}`);
                setEventData(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [eventId]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!eventData) return <p>No event found.</p>;

    //-----------------------------------------------------
    // Derived Flags (FIXED HERE)
    //-----------------------------------------------------
    const isGuest = !!(
        user && eventData.guests?.some((g) => g.id === user.id)
    );

    //-----------------------------------------------------
    // RSVP
    //-----------------------------------------------------
    const handleRsvp = async () => {
        setRsvpMessage(null);

        try {
            const res = await api(`/events/${eventId}/guests/me`, {
                method: 'POST'
            });

            setEventData((prev) => ({
                ...prev,
                guests: [res.guestAdded, ...(prev.guests || [])],
                numGuests: res.numGuests
            }));

            setRsvpMessage('RSVP successful!');
        } catch (err) {
            setRsvpMessage(err.message);
        }
    };

    //-----------------------------------------------------
    // Un-RSVP
    //-----------------------------------------------------
    const handleUnRsvp = async () => {
        setRsvpMessage(null);

        try {
            await api(`/events/${eventId}/guests/me`, {
                method: 'DELETE'
            });

            setEventData((prev) => ({
                ...prev,
                guests: prev.guests.filter((g) => g.id !== user.id),
                numGuests: prev.numGuests - 1
            }));

            setRsvpMessage('RSVP removed.');
        } catch (err) {
            setRsvpMessage(err.message);
        }
    };

    //-----------------------------------------------------
    // Render
    //-----------------------------------------------------
    return (
        <div className="event-basic-container">

            <h1>Event #{eventData.id}</h1>

            <p><strong>Name:</strong> {eventData.name}</p>
            <p><strong>Description:</strong> {eventData.description}</p>
            <p><strong>Location:</strong> {eventData.location}</p>

            <p><strong>Start:</strong> {eventData.startTime}</p>
            <p><strong>End:</strong> {eventData.endTime}</p>

            <p><strong>Capacity:</strong> {eventData.capacity ?? 'Unlimited'}</p>

            <p><strong>Guests:</strong> {eventData.numGuests}</p>

            {/* Guest list summary */}
            {eventData.guests && eventData.guests.length > 0 && (
                <>
                    <p><strong>Guest List:</strong></p>

                    <ul className="top-guest-list">
                        {eventData.guests.map((g) => (
                            <li key={g.id}>
                                {g.name} ({g.utorid})
                            </li>
                        ))}
                    </ul>
                </>
            )}

            <br />

            {/* RSVP */}
            {!isGuest && (
                <button className="rsvp-btn" onClick={handleRsvp}>
                    RSVP
                </button>
            )}

            {isGuest && (
                <button className="unrsvp-btn" onClick={handleUnRsvp}>
                    Un-RSVP
                </button>
            )}

            {rsvpMessage && (
                <p className={`form-message ${rsvpMessage.includes('successful') ? 'success' : 'error'}`}>
                    {rsvpMessage}
                </p>
            )}

        </div>
    );
}

export default EventDetailsBasic;
