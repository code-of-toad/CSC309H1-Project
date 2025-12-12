import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import './EventDetailsFull.css';

function EventDetailsFull() {
    const api = useApi();
    const navigate = useNavigate();
    const { role, user } = useAuth();
    const { eventId } = useParams();

    const [eventData, setEventData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Add Organizer
    const [orgUtorid, setOrgUtorid] = useState('');
    const [orgMessage, setOrgMessage] = useState(null);

    // Add Guest
    const [guestUtorid, setGuestUtorid] = useState('');
    const [guestMessage, setGuestMessage] = useState(null);

    // Reward Single Guest
    const [rewardUtorid, setRewardUtorid] = useState('');
    const [rewardAmount, setRewardAmount] = useState('');
    const [rewardMessage, setRewardMessage] = useState(null);

    // Reward All Guests
    const [allAmount, setAllAmount] = useState('');
    const [allMessage, setAllMessage] = useState(null);

    //---------------------------------------------
    // Load Event
    //---------------------------------------------
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

    if (loading) return <p>Loading event...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!eventData) return <p>No event found.</p>;

    //---------------------------------------------
    // Derived Permissions
    //---------------------------------------------
    const isManager = role === 'manager' || role === 'superuser';

    const isOrganizer = !!(
        user?.id &&
        eventData?.organizers?.some((o) => o.id === user.id)
    );

    //---------------------------------------------
    // Add Organizer Handler
    //---------------------------------------------
    const handleAddOrganizer = async () => {
        setOrgMessage(null);
        if (!orgUtorid.trim()) {
            setOrgMessage('UTORid required');
            return;
        }

        try {
            const res = await api(`/events/${eventId}/organizers`, {
                method: 'POST',
                body: JSON.stringify({ utorid: orgUtorid.trim() }),
                headers: { 'Content-Type': 'application/json' }
            });
            setEventData((prev) => ({
                ...prev,
                organizers: res.organizers
            }));
            setOrgUtorid('');
            setOrgMessage('Organizer added successfully.');
        } catch (err) {
            setOrgMessage(err.message);
        }
    };

    //---------------------------------------------
    // Remove Organizer Handler
    //---------------------------------------------
    const handleRemoveOrganizer = async (userId) => {
        try {
            await api(`/events/${eventId}/organizers/${userId}`, {
                method: 'DELETE'
            });

            setEventData((prev) => ({
                ...prev,
                organizers: prev.organizers.filter((o) => o.id !== userId)
            }));
        } catch (err) {
            alert(err.message);
        }
    };

    //---------------------------------------------
    // Add Guest Handler
    //---------------------------------------------
    const handleAddGuest = async () => {
        setGuestMessage(null);
        if (!guestUtorid.trim()) {
            setGuestMessage('UTORid required');
            return;
        }

        try {
            const res = await api(`/events/${eventId}/guests`, {
                method: 'POST',
                body: JSON.stringify({ utorid: guestUtorid.trim() }),
                headers: { 'Content-Type': 'application/json' }
            });

            setEventData((prev) => ({
                ...prev,
                guests: [res.guestAdded, ...(prev.guests || [])],
                numGuests: res.numGuests
            }));

            setGuestUtorid('');
            setGuestMessage('Guest added successfully.');
        } catch (err) {
            setGuestMessage(err.message);
        }
    };

    //---------------------------------------------
    // Remove Guest Handler (manager only)
    //---------------------------------------------
    const handleRemoveGuest = async (userId) => {
        try {
            await api(`/events/${eventId}/guests/${userId}`, {
                method: 'DELETE'
            });

            setEventData((prev) => ({
                ...prev,
                guests: prev.guests.filter((g) => g.id !== userId),
                numGuests: prev.numGuests - 1
            }));
        } catch (err) {
            alert(err.message);
        }
    };

    //---------------------------------------------
    // Delete Event
    //---------------------------------------------
    const handleDeleteEvent = async () => {
        if (!window.confirm('Delete this event?')) return;

        try {
            await api(`/events/${eventId}`, {
                method: 'DELETE'
            });
            navigate('/events');
        } catch (err) {
            alert(err.message);
        }
    };

    //---------------------------------------------
    // Reward Single Guest
    //---------------------------------------------
    const handleRewardOne = async () => {
        setRewardMessage(null);

        if (!rewardUtorid.trim() || !rewardAmount.trim()) {
            setRewardMessage('UTORid and amount required');
            return;
        }

        try {
            const res = await api(`/events/${eventId}/transactions`, {
                method: 'POST',
                body: JSON.stringify({
                    type: 'event',
                    utorid: rewardUtorid.trim(),
                    amount: Number(rewardAmount)
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            setRewardMessage(`Awarded ${res.awarded} points to ${res.recipient}`);

            const updated = await api(`/events/${eventId}`);
            setEventData(updated);

            setRewardUtorid('');
            setRewardAmount('');
        } catch (err) {
            setRewardMessage(err.message);
        }
    };

    //---------------------------------------------
    // Reward ALL Guests
    //---------------------------------------------
    const handleRewardAll = async () => {
        setAllMessage(null);

        if (!allAmount.trim()) {
            setAllMessage('Amount required');
            return;
        }

        try {
            const res = await api(`/events/${eventId}/transactions`, {
                method: 'POST',
                body: JSON.stringify({
                    type: 'event',
                    amount: Number(allAmount)
                }),
                headers: { 'Content-Type': 'application/json' }
            });

            setAllMessage(`Awarded points to ${res.length} guests.`);

            const updated = await api(`/events/${eventId}`);
            setEventData(updated);

            setAllAmount('');
        } catch (err) {
            setAllMessage(err.message);
        }
    };

    //---------------------------------------------
    // Render UI
    //---------------------------------------------
    return (
        <div className="event-details-container">
            <h1>Event #{eventData.id}</h1>

            <p><strong>Name:</strong> {eventData.name}</p>
            <p><strong>Description:</strong> {eventData.description}</p>
            <p><strong>Location:</strong> {eventData.location}</p>

            <p><strong>Start:</strong> {eventData.startTime}</p>
            <p><strong>End:</strong> {eventData.endTime}</p>

            <p><strong>Capacity:</strong> {eventData.capacity ?? 'Unlimited'}</p>

            <p><strong>Guests:</strong> {eventData.numGuests}</p> */

            {/* ⭐ ADDED: Guest List Summary (Read-only) */}
            {eventData.guests && eventData.guests.length > 0 && (
                <>
                    <p><strong>Guest List:</strong></p>
                    <ul className="top-guest-list">
                        {eventData.guests.map(g => (
                            <li key={g.id}>{g.name} ({g.utorid})</li>
                        ))}
                    </ul>
                </>
            )}

            <p><strong>Points Remaining:</strong> {eventData.pointsRemain}</p>
            <p><strong>Points Awarded:</strong> {eventData.pointsAwarded}</p>

            <p><strong>Published:</strong> {eventData.published ? 'Yes' : 'No'}</p>

            {(isManager || isOrganizer) && (
                <button
                    className="edit-btn"
                    onClick={() => navigate(`/events/${eventId}/edit`)}
                >
                    Edit Event
                </button>
            )}

            {isManager && !eventData.published && (
                <button className="delete-btn" onClick={handleDeleteEvent}>
                    Delete Event
                </button>
            )}

            <h2>Organizers</h2>

            {isManager && (
                <div className="box">
                    <h3>Add Organizer</h3>
                    <input
                        value={orgUtorid}
                        onChange={(e) => setOrgUtorid(e.target.value)}
                        placeholder="Enter UTORid"
                    />
                    <button onClick={handleAddOrganizer}>Add Organizer</button>
                    {orgMessage && (
                        <p className={`form-message ${orgMessage.includes('successfully') ? 'success' : 'error'}`}>
                            {orgMessage}
                        </p>
                    )}
                </div>
            )}

            <ul className="list-box">
                {eventData.organizers?.map((org) => (
                    <li key={org.id}>
                        {org.name} ({org.utorid})
                        {isManager && (
                            <button
                                className="small-remove-btn"
                                onClick={() => handleRemoveOrganizer(org.id)}
                            >
                                Remove
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            <h2>Guest List</h2>

            {(isManager || isOrganizer) && (
                <div className="box">
                    <h3>Add Guest</h3>
                    <input
                        value={guestUtorid}
                        onChange={(e) => setGuestUtorid(e.target.value)}
                        placeholder="Enter UTORid"
                    />
                    <button onClick={handleAddGuest}>Add Guest</button>

                    {guestMessage && (
                        <p className={`form-message ${guestMessage.includes('successfully') ? 'success' : 'error'}`}>
                            {guestMessage}
                        </p>
                    )}
                </div>
            )}

            <ul className="list-box">
                {eventData.guests?.map((g) => (
                    <li key={g.id}>
                        {g.name} ({g.utorid})
                        {isManager && (
                            <button
                                className="small-remove-btn"
                                onClick={() => handleRemoveGuest(g.id)}
                            >
                                Remove
                            </button>
                        )}
                    </li>
                ))}
            </ul>

            {/* ============================= */}
            {/*     REWARD SECTION (unchanged) */}
            {/* ============================= */}
            {(isManager || isOrganizer) && (
                <>
                    <h2>Reward Guests</h2>

                    <div className="box">
                        <h3>Award Points to One Guest</h3>
                        <input
                            value={rewardUtorid}
                            onChange={(e) => setRewardUtorid(e.target.value)}
                            placeholder="Enter UTORid"
                        />
                        <input
                            value={rewardAmount}
                            onChange={(e) => setRewardAmount(e.target.value)}
                            placeholder="Amount"
                            type="number"
                        />
                        <button onClick={handleRewardOne}>Reward Guest</button>

                        {rewardMessage && (
                            <p className={`form-message ${rewardMessage.includes('Awarded') ? 'success' : 'error'}`}>
                                {rewardMessage}
                            </p>
                        )}
                    </div>

                    <div className="box">
                        <h3>Award Points to ALL Guests</h3>

                        <input
                            value={allAmount}
                            onChange={(e) => setAllAmount(e.target.value)}
                            placeholder="Amount"
                            type="number"
                        />
                        <button onClick={handleRewardAll}>Reward All Guests</button>

                        {allMessage && (
                            <p className={`form-message ${allMessage.includes('Awarded') ? 'success' : 'error'}`}>
                                {allMessage}
                            </p>
                        )}
                    </div>
                </>
            )}

        </div>
    );
}

export default EventDetailsFull;
