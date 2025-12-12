// src/pages/EventsList.jsx
import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './EventsList.css';

function EventsList() {
    const api = useApi();
    const navigate = useNavigate();
    const { role } = useAuth();

    const isManagerPlus = role === 'manager' || role === 'superuser';

    const [filters, setFilters] = useState({
        name: '',
        location: '',
        started: '',
        ended: '',
        showFull: '',
        published: '', // only used by manager+
        page: 1,
        limit: 5
    });

    const [count, setCount] = useState(0);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // -----------------------------
    // Build query string
    // -----------------------------
    const buildQueryString = () => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {

                // ❌ Cashiers/regulars must NEVER send published=
                if (key === 'published' && !isManagerPlus) return;

                params.append(key, value);
            }
        });

        return `/events?${params.toString()}`;
    };

    // const buildQueryString = () => {
    //     const params = new URLSearchParams();

    //     Object.entries(filters).forEach(([key, value]) => {
    //         if (value !== '' && value !== null && value !== undefined) {
    //             params.append(key, value);
    //         }
    //     });

    //     return `/events?${params.toString()}`;
    // };

    // -----------------------------
    // Fetch events on filter change
    // -----------------------------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const url = buildQueryString();
                const data = await api(url, { method: 'GET' });

                setRows(data.results || []);
                setCount(data.count || 0);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [filters]);

    const update = (field, value) => {
        setFilters(prev => ({
            ...prev,
            [field]: value,
            page: 1
        }));
    };

    const totalPages = Math.ceil(count / filters.limit);

    return (
        <div className="events-container">
            <h1>Events</h1>

            {error && <p className="error-message">{error}</p>}

            {/* =========================== FILTER BAR =========================== */}
            <div className="filters-row">

                <input
                    type="text"
                    placeholder="Event name"
                    value={filters.name}
                    onChange={e => update('name', e.target.value)}
                />

                <input
                    type="text"
                    placeholder="Location"
                    value={filters.location}
                    onChange={e => update('location', e.target.value)}
                />

                <select
                    value={filters.started}
                    onChange={e => update('started', e.target.value)}
                >
                    <option value="">Started?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>

                <select
                    value={filters.ended}
                    onChange={e => update('ended', e.target.value)}
                >
                    <option value="">Ended?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>

                <select
                    value={filters.showFull}
                    onChange={e => update('showFull', e.target.value)}
                >
                    <option value="">Show Full?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>

                {/* ONLY manager+ sees Published filter */}
                {isManagerPlus && (
                    <select
                        value={filters.published}
                        onChange={e => update('published', e.target.value)}
                    >
                        <option value="">Published?</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                    </select>
                )}
            </div>

            {/* =========================== TABLE =========================== */}
            <table className="events-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Start</th>
                        <th>End</th>
                        <th>Capacity</th>
                        <th>Guests</th>

                        {/* Manager+ Only Columns */}
                        {isManagerPlus && <th>Published</th>}
                        {isManagerPlus && <th>Points Left</th>}
                        {isManagerPlus && <th>Points Awarded</th>}
                    </tr>
                </thead>

                <tbody>
                    {loading && (
                        <tr><td colSpan="12" style={{ textAlign: 'center' }}>Loading…</td></tr>
                    )}

                    {!loading && rows.length === 0 && (
                        <tr><td colSpan="12" style={{ textAlign: 'center' }}>No events found.</td></tr>
                    )}

                    {!loading && rows.map(event => (
                        <tr
                            key={event.id}
                            className="clickable-row"
                            onClick={() => navigate(`/events/${event.id}`)}
                        >
                            <td>{event.id}</td>
                            <td>{event.name}</td>
                            <td>{event.location}</td>
                            <td>{event.startTime}</td>
                            <td>{event.endTime}</td>

                            <td>{event.capacity ?? "∞"}</td>
                            <td>{event.numGuests}</td>

                            {isManagerPlus && (
                                <>
                                    <td>{event.published ? "Yes" : "No"}</td>
                                    <td>{event.pointsRemain}</td>
                                    <td>{event.pointsAwarded}</td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* =========================== PAGINATION =========================== */}
            <div className="pagination-row">
                <button
                    disabled={filters.page <= 1}
                    onClick={() => update('page', filters.page - 1)}
                >
                    Previous
                </button>

                <span>Page {filters.page} / {totalPages || 1}</span>

                <button
                    disabled={filters.page >= totalPages}
                    onClick={() => update('page', filters.page + 1)}
                >
                    Next
                </button>

                <select
                    value={filters.limit}
                    onChange={e => update('limit', Number(e.target.value))}
                >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                </select>
            </div>
        </div>
    );
}

export default EventsList;
