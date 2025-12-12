import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import './EventDetails.css';

function EventDetails() {
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

    // Reward
    const [rewardAmount, setRewardAmount] = useState('');
    const [rewardUtorid, setRewardUtorid] = useState('');
    const [rewardMessage, setRewardMessage] = useState(null);

    // Load event
    useEffect(() => {
        const load = async () => {
            try {
                const data = await api(`/events/${eventId}`);
                setEventData({
                    ...data,
                    organizers: data.organizers ?? [],
                    guests: data.guests ?? [],
                });
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [eventId]);

    if (loading) return <p>Loading…</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!eventData) return <p>No event found.</p>;

    // Permissions
    const isManager = role === 'manager' || role === 'superuser';
    const isOrganizer = eventData.organizers.some(o => o.id === user?.id);

    // Organizer UI + Guest invite + Reward system
    const canEdit = isManager || isOrganizer;

    // Visibility: Only managers + organizers can SEE organizers
    const canSeeOrganizers = isManager || isOrganizer;

    // ------------------------
    // Organizer Management
    // ------------------------
    const handleAddOrganizer = async () => {
        setOrgMessage(null);
        if (!orgUtorid.trim()) return setOrgMessage('UTORid required');

        try {
            const res = await api(`/events/${eventId}/organizers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ utorid: orgUtorid.trim() }),
            });

            setEventData(prev => ({
                ...prev,
                organizers: res.organizers,
            }));

            setOrgUtorid('');
            setOrgMessage('Organizer added successfully.');
        } catch (err) {
            setOrgMessage(err.message);
        }
    };

    const handleRemoveOrganizer = async (uid) => {
        try {
            await api(`/events/${eventId}/organizers/${uid}`, { method: 'DELETE' });
            setEventData(prev => ({
                ...prev,
                organizers: prev.organizers.filter(o => o.id !== uid),
            }));
        } catch (err) {
            alert(err.message);
        }
    };

    // ------------------------
    // Guest Management
    // ------------------------
    const handleAddGuest = async () => {
        setGuestMessage(null);
        if (!guestUtorid.trim()) return setGuestMessage('UTORid required');

        try {
            const res = await api(`/events/${eventId}/guests`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ utorid: guestUtorid.trim() }),
            });

            setEventData(prev => ({
                ...prev,
                guests: [res.guestAdded, ...prev.guests],
                numGuests: res.numGuests,
            }));

            setGuestUtorid('');
            setGuestMessage('Guest added successfully.');
        } catch (err) {
            setGuestMessage(err.message);
        }
    };

    const handleRemoveGuest = async (uid) => {
        try {
            await api(`/events/${eventId}/guests/${uid}`, { method: 'DELETE' });

            setEventData(prev => ({
                ...prev,
                guests: prev.guests.filter(g => g.id !== uid),
                numGuests: prev.numGuests - 1,
            }));
        } catch (err) {
            alert(err.message);
        }
    };

    // ------------------------
    // Reward Transactions
    // ------------------------
    const handleReward = async (all) => {
        setRewardMessage(null);

        if (!rewardAmount.trim() || Number(rewardAmount) <= 0)
            return setRewardMessage('Amount must be positive.');

        const payload = {
            type: 'event',
            amount: Number(rewardAmount),
        };

        if (!all) {
            if (!rewardUtorid.trim())
                return setRewardMessage('UTORid required.');
            payload.utorid = rewardUtorid.trim();
        }

        try {
            await api(`/events/${eventId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            setRewardMessage('Points awarded successfully.');
            setRewardAmount('');
            setRewardUtorid('');
        } catch (err) {
            setRewardMessage(err.message);
        }
    };

    // ------------------------
    // Delete Event (manager only)
    // ------------------------
    const handleDeleteEvent = async () => {
        if (!window.confirm('Delete this event?')) return;

        try {
            await api(`/events/${eventId}`, { method: 'DELETE' });
            navigate('/events');
        } catch (err) {
            alert(err.message);
        }
    };

    // ------------------------
    // UI RENDER
    // ------------------------
    return (
        <div className="event-details-page">
            <h1>Event #{eventData.id}</h1>

            <p><strong>Name:</strong> {eventData.name}</p>
            <p><strong>Description:</strong> {eventData.description}</p>
            <p><strong>Location:</strong> {eventData.location}</p>
            <p><strong>Start:</strong> {eventData.startTime}</p>
            <p><strong>End:</strong> {eventData.endTime}</p>
            <p><strong>Capacity:</strong> {eventData.capacity ?? 'Unlimited'}</p>
            {/* <p><strong>Guests:</strong> {eventData.numGuests}</p> */}
            <p><strong>Published:</strong> {eventData.published ? 'Yes' : 'No'}</p>

            {/* Edit Event */}
            {canEdit && (
                <button className="blue-btn" onClick={() => navigate(`/events/${eventId}/edit`)}>
                    Edit Event
                </button>
            )}

            {/* Delete Event */}
            {isManager && !eventData.published && (
                <button className="red-btn" onClick={handleDeleteEvent}>
                    Delete Event
                </button>
            )}

            {/* ========= ORGANIZERS SECTION (hidden from guests) ========= */}
            {canSeeOrganizers && (
                <div className="section">
                    <h2>Organizers</h2>

                    {isManager && (
                        <div className="box">
                            <input
                                value={orgUtorid}
                                onChange={e => setOrgUtorid(e.target.value)}
                                placeholder="Enter UTORid"
                            />
                            <button className="green-btn" onClick={handleAddOrganizer}>
                                Add Organizer
                            </button>
                            {orgMessage && (
                                <p className={orgMessage.includes('successfully') ? 'success' : 'error'}>
                                    {orgMessage}
                                </p>
                            )}
                        </div>
                    )}

                    <ul className="list-box">
                        {(eventData.organizers ?? []).map(o => (
                            <li key={o.id}>
                                {o.name} ({o.utorid})
                                {isManager && (
                                    <button className="small-remove-btn" onClick={() => handleRemoveOrganizer(o.id)}>
                                        Remove
                                    </button>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ========= GUEST LIST (everyone can see it) ========= */}
            <div className="section">
                <h2>Guest List</h2>

                {canEdit && (
                    <div className="box">
                        <input
                            value={guestUtorid}
                            onChange={e => setGuestUtorid(e.target.value)}
                            placeholder="Enter UTORid"
                        />
                        <button className="green-btn" onClick={handleAddGuest}>
                            Add Guest
                        </button>
                        {guestMessage && (
                            <p className={guestMessage.includes('successfully') ? 'success' : 'error'}>
                                {guestMessage}
                            </p>
                        )}
                    </div>
                )}

                <ul className="list-box">
                    {(eventData.guests ?? []).map(g => (
                        <li key={g.id}>
                            {g.name} ({g.utorid})
                            {isManager && (
                                <button className="small-remove-btn" onClick={() => handleRemoveGuest(g.id)}>
                                    Remove
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* ========= REWARD SECTION (manager + organizer) ========= */}
            {canEdit && (
                <div className="section">
                    <h2>Reward Guests</h2>

                    <div className="box">
                        <input
                            type="number"
                            value={rewardAmount}
                            onChange={e => setRewardAmount(e.target.value)}
                            placeholder="Amount"
                        />
                        <input
                            value={rewardUtorid}
                            onChange={e => setRewardUtorid(e.target.value)}
                            placeholder="Specific UTORid (optional)"
                        />

                        <button className="green-btn" onClick={() => handleReward(false)}>
                            Reward One Guest
                        </button>

                        <button className="blue-btn" onClick={() => handleReward(true)}>
                            Reward All Guests
                        </button>

                        {rewardMessage && (
                            <p className={rewardMessage.includes('successfully') ? 'success' : 'error'}>
                                {rewardMessage}
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default EventDetails;
