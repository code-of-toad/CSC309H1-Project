import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import './TransactionsList.css';
import { formatDate } from '../globals';

function TransactionsList() {
    const api = useApi();
    const navigate = useNavigate();

    const [filters, setFilters] = useState({
        name: '',
        createdBy: '',
        suspicious: '',
        promotionId: '',
        type: '',
        relatedId: '',
        amount: '',
        operator: '',
    });

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [count, setCount] = useState(0);
    const [trxs, setTrxs] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    // -----------------------------------------
    // LOAD TABLE DATA
    // -----------------------------------------
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);

                const params = new URLSearchParams();
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== '' && value !== null) params.append(key, value);
                });
                params.append('page', page);
                params.append('limit', limit);

                const data = await api(`/transactions?${params.toString()}`);
                setTrxs(data.results);
                setCount(data.count);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [filters, page, limit]);

    // -----------------------------------------
    // TOGGLE SUSPICIOUS
    // -----------------------------------------
    const toggleSuspicious = async (trx) => {
        try {
            await api(`/transactions/${trx.id}/suspicious`, {
                method: 'PATCH',
                body: JSON.stringify({ suspicious: !trx.suspicious }),
            });

            // Reload after update
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null) params.append(key, value);
            });
            params.append('page', page);
            params.append('limit', limit);

            const updated = await api(`/transactions?${params.toString()}`);
            setTrxs(updated.results);
            setCount(updated.count);
        } catch (err) {
            alert(err.message);
        }
    };

    const totalPages = Math.ceil(count / limit);

    return (
        <div className="transactions-container">
            <h1>Transactions</h1>

            {error && <p className="error-message">{error}</p>}

            {/* -------------------------------------
                FILTER BAR
            -------------------------------------- */}
            <div className="filters-row">
                <input
                    type="text"
                    placeholder="Search UTORid or Name"
                    value={filters.name}
                    onChange={(e) => setFilters({ ...filters, name: e.target.value })}
                />

                <input
                    type="text"
                    placeholder="Created By (UTORid)"
                    value={filters.createdBy}
                    onChange={(e) => setFilters({ ...filters, createdBy: e.target.value })}
                />

                <select
                    value={filters.suspicious}
                    onChange={(e) => setFilters({ ...filters, suspicious: e.target.value })}
                >
                    <option value="">Suspicious?</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                </select>

                <input
                    type="number"
                    placeholder="Promotion ID"
                    value={filters.promotionId}
                    onChange={(e) => setFilters({ ...filters, promotionId: e.target.value })}
                />

                <select
                    value={filters.type}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                >
                    <option value="">Type</option>
                    <option value="purchase">purchase</option>
                    <option value="adjustment">adjustment</option>
                    <option value="redemption">redemption</option>
                    <option value="transfer">transfer</option>
                    <option value="event">event</option>
                </select>

                <input
                    type="number"
                    placeholder="Related ID"
                    value={filters.relatedId}
                    onChange={(e) => setFilters({ ...filters, relatedId: e.target.value })}
                />
            </div>

            {/* -------------------------------------
                TABLE
            -------------------------------------- */}
            <table className="transactions-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>UTORid</th>
                        <th>Type</th>
                        <th>Spent</th>
                        <th>Amount</th>
                        <th>Suspicious</th>
                        <th>Created By</th>
                        <th>Related ID</th>
                        <th>Remark</th>
                        <th>Promotions</th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="10" style={{ textAlign: 'center' }}>
                                Loading...
                            </td>
                        </tr>
                    ) : trxs.length === 0 ? (
                        <tr>
                            <td colSpan="10" style={{ textAlign: 'center' }}>
                                No results
                            </td>
                        </tr>
                    ) : (
                        trxs.map((trx) => (
                            <tr
                                key={trx.id}
                                className="clickable-row"
                                onClick={() => navigate(`/transactions/${trx.id}`)}
                            >
                                {/* Remove Link — row itself navigates */}
                                <td>{trx.id}</td>

                                <td>{trx.utorid}</td>
                                <td>{trx.type}</td>

                                <td>
                                    {trx.spent != null
                                        ? `$${Number(trx.spent).toFixed(2)}`
                                        : '—'}
                                </td>

                                <td>{trx.amount}</td>

                                <td>
                                    <button
                                        className={
                                            trx.suspicious
                                                ? 'sus-btn sus-true'
                                                : 'sus-btn sus-false'
                                        }
                                        onClick={(e) => {
                                            e.stopPropagation(); // ← prevents navigation
                                            toggleSuspicious(trx);
                                        }}
                                    >
                                        {trx.suspicious ? 'YES' : 'NO'}
                                    </button>
                                </td>

                                <td>{trx.createdBy}</td>
                                <td>{trx.relatedId || '—'}</td>
                                <td>{trx.remark || '—'}</td>

                                <td>
                                    {trx.promotions?.length
                                        ? trx.promotions.map((p) => p.id).join(', ')
                                        : '—'}
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* -------------------------------------
                PAGINATION
            -------------------------------------- */}
            <div className="pagination-row">
                <button
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                >
                    Previous
                </button>

                <span>
                    Page {page} / {totalPages || 1}
                </span>

                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>

                <select
                    value={limit}
                    onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                    }}
                >
                    <option value={5}>5 per page</option>
                    <option value={10}>10 per page</option>
                    <option value={20}>20 per page</option>
                </select>
            </div>
        </div>
    );
}

export default TransactionsList;
