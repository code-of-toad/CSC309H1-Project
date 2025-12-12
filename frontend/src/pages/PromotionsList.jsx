// src/pages/PromotionsList.jsx
import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './PromotionsList.css';

function PromotionsList() {
    const api = useApi();
    const navigate = useNavigate();
    const { role } = useAuth();

    const isManagerPlus = role === 'manager' || role === 'superuser';

    const [filters, setFilters] = useState({
        name: '',
        type: '',
        started: '',
        ended: '',
        page: 1,
        limit: 10
    });

    const [count, setCount] = useState(0);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Build querystring
    const buildQueryString = () => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                params.append(key, value);
            }
        });

        return `/promotions?${params.toString()}`;
    };

    // Fetch list
    useEffect(() => {
        const loadPromos = async () => {
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

        loadPromos();
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
        <div className="promos-container">
            <h1>Promotions</h1>

            {error && <p className="error-message">{error}</p>}

            {/* FILTER BAR */}
            <div className="filters-row">

                <input
                    type="text"
                    placeholder="Search name"
                    value={filters.name}
                    onChange={e => update('name', e.target.value)}
                />

                <select
                    value={filters.type}
                    onChange={e => update('type', e.target.value)}
                >
                    <option value="">Type?</option>
                    <option value="automatic">Automatic</option>
                    <option value="one-time">One-Time</option>
                </select>

                {/* Manager+ extra filters */}
                {isManagerPlus && (
                    <>
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
                    </>
                )}
            </div>

            {/* TABLE */}
            <table className="promos-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Type</th>

                        <th>Min Spend</th>
                        <th>Rate</th>
                        <th>Points</th>

                        {isManagerPlus && <th>Start</th>}
                        {isManagerPlus && <th>End</th>}
                    </tr>
                </thead>

                <tbody>
                    {loading && (
                        <tr><td colSpan="12" style={{ textAlign: 'center' }}>Loading…</td></tr>
                    )}

                    {!loading && rows.length === 0 && (
                        <tr><td colSpan="12" style={{ textAlign: 'center' }}>No promotions found.</td></tr>
                    )}

                    {!loading && rows.map(promo => (
                        <tr
                            key={promo.id}
                            className="clickable-row"
                            onClick={() => navigate(`/promotions/${promo.id}`)}
                        >
                            <td>{promo.id}</td>
                            <td>{promo.name}</td>
                            <td>{promo.type}</td>

                            <td>{promo.minSpending ?? '-'}</td>
                            <td>{promo.rate ?? '-'}</td>
                            <td>{promo.points ?? '-'}</td>

                            {isManagerPlus && (
                                <>
                                    <td>{promo.startTime}</td>
                                    <td>{promo.endTime}</td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* PAGINATION */}
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
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                    <option value={50}>50 per page</option>
                </select>
            </div>

        </div>
    );
}

export default PromotionsList;
