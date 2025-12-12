import { useEffect, useState } from 'react';
import { useApi } from '../hooks/useApi';
import './PromotionSelector.css';

function PromotionSelector({ selectedIds, setSelectedIds }) {
    const api = useApi();

    const [promos, setPromos] = useState([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(5);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPromos = async () => {
            try {
                setLoading(true);
                const data = await api(`/promotions?page=${page}&limit=${limit}`);
                setPromos(data.results || []);
                setCount(data.count || 0);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadPromos();
    }, [page, limit]);

    const togglePromo = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(x => x !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const totalPages = Math.ceil(count / limit);

    return (
        <div className="promotion-box">
            <h2>Available Promotions</h2>

            {loading && <p>Loading promotions...</p>}
            {error && <p className="error-message">{error}</p>}

            {!loading && !error && promos.length === 0 && (
                <p>No promotions available.</p>
            )}

            {promos.length > 0 && (
                <>
                    <table className="promo-table">
                        <thead>
                            <tr>
                                <th>Use</th>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Rate</th>
                                <th>Min Spending</th>
                                <th>Ends</th>
                            </tr>
                        </thead>
                        <tbody>
                            {promos.map((p) => (
                                <tr key={p.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.includes(p.id)}
                                            onChange={() => togglePromo(p.id)}
                                        />
                                    </td>
                                    <td>{p.name}</td>
                                    <td>{p.type}</td>
                                    <td>{p.rate}</td>
                                    <td>${p.minSpending?.toFixed(2) || '0.00'}</td>
                                    <td>{p.endTime || '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="promo-pagination">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(page - 1)}
                        >
                            Previous
                        </button>

                        <span>Page {page} / {totalPages || 1}</span>

                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            Next
                        </button>

                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value))}
                        >
                            <option value={5}>5 per page</option>
                            <option value={10}>10 per page</option>
                            <option value={20}>20 per page</option>
                            <option value={50}>50 per page</option>
                        </select>
                    </div>
                </>
            )}
        </div>
    );
}

export default PromotionSelector;
