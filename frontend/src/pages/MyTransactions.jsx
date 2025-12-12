import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import './MyTransactions.css';

function MyTransactions() {
    const api = useApi();

    const [filters, setFilters] = useState({
        type: '',
        promotionId: '',
        relatedId: '',
        amount: '',
        operator: '',
        page: 1,
        limit: 10,
    });

    const [count, setCount] = useState(0);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // ------------------------------------------------------
    // Build query string
    // ------------------------------------------------------
    const buildQueryString = () => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, val]) => {
            if (val !== '' && val !== null && val !== undefined) {
                params.append(key, val);
            }
        });

        return `/users/me/transactions?${params.toString()}`;
    };

    // ------------------------------------------------------
    // Load data whenever filters change
    // ------------------------------------------------------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const url = buildQueryString();
                const data = await api(url, { method: 'GET' });
                setCount(data.count);
                setRows(data.results);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [filters]);

    // ------------------------------------------------------
    // Helper to update filters
    // ------------------------------------------------------
    const update = (field, value) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value,
            page: 1,
        }));
    };

    const totalPages = Math.ceil(count / filters.limit);

    // ------------------------------------------------------
    // Render
    // ------------------------------------------------------
    return (
        <div className="my-trx-container">
            <h1>My Transactions</h1>

            {/* FILTER BAR */}
            <div className="filters">
                <select
                    value={filters.type}
                    onChange={(e) => update('type', e.target.value)}
                >
                    <option value="">Type</option>
                    <option value="purchase">Purchase</option>
                    <option value="redemption">Redemption</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="event">Event</option>
                    <option value="transfer">Transfer</option>
                </select>

                <input
                    type="number"
                    placeholder="Promotion ID"
                    value={filters.promotionId}
                    onChange={(e) => update('promotionId', e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Related ID"
                    value={filters.relatedId}
                    onChange={(e) => update('relatedId', e.target.value)}
                />

                <input
                    type="number"
                    placeholder="Amount"
                    value={filters.amount}
                    onChange={(e) => update('amount', e.target.value)}
                />

                <select
                    value={filters.operator}
                    onChange={(e) => update('operator', e.target.value)}
                >
                    <option value="">Operator</option>
                    <option value="gte">≥</option>
                    <option value="lte">≤</option>
                </select>
            </div>

            {/* TABLE */}
            <table className="trx-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Spent</th>
                        <th>Amount</th>
                        <th>Related ID</th>
                        <th>Promotion IDs</th>
                        <th>Remark</th>
                        <th>Created By</th>
                    </tr>
                </thead>

                <tbody>
                    {loading && (
                        <tr><td colSpan="8">Loading...</td></tr>
                    )}

                    {error && (
                        <tr><td colSpan="8" className="error-message">{error}</td></tr>
                    )}

                    {!loading && !error && rows.length === 0 && (
                        <tr><td colSpan="8">No transactions found.</td></tr>
                    )}

                    {!loading && !error && rows.map((trx) => {
                        const spentFmt =
                            trx.spent != null
                                ? `$${Number(trx.spent).toFixed(2)}`
                                : '—';

                        return (
                            <tr key={trx.id}>
                                <td>{trx.id}</td>
                                <td>{trx.type}</td>
                                <td>{spentFmt}</td>
                                <td>{trx.amount}</td>
                                <td>{trx.relatedId ?? '—'}</td>
                                <td>
                                    {trx.promotions?.length
                                        ? trx.promotions.map((p) => p.id).join(', ')
                                        : '—'}
                                </td>
                                <td>{trx.remark || '—'}</td>
                                <td>{trx.createdBy}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* PAGINATION */}
            <div className="pagination">
                <button
                    disabled={filters.page === 1}
                    onClick={() => update('page', filters.page - 1)}
                >
                    Previous
                </button>

                <span>
                    Page {filters.page} / {totalPages || 1}
                </span>

                <button
                    disabled={filters.page === totalPages}
                    onClick={() => update('page', filters.page + 1)}
                >
                    Next
                </button>

                <select
                    value={filters.limit}
                    onChange={(e) => update('limit', Number(e.target.value))}
                >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                </select>
            </div>
        </div>
    );
}

export default MyTransactions;
