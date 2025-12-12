import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import './PurchasePage.css';

function TransactionPurchase() {
    const api = useApi();

    const [utorid, setUtorid] = useState('');
    const [spent, setSpent] = useState('');
    const [remark, setRemark] = useState('');

    const [promotions, setPromotions] = useState([]);
    const [promoPage, setPromoPage] = useState(1);
    const [promoLimit, setPromoLimit] = useState(5);
    const [promoCount, setPromoCount] = useState(0);

    const [selectedPromos, setSelectedPromos] = useState([]);

    const [loadingPromos, setLoadingPromos] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // -------------------------------------------------------------
    // Fetch promotions (paginated)
    // -------------------------------------------------------------
    useEffect(() => {
        const loadPromos = async () => {
            setLoadingPromos(true);
            try {
                const res = await api(`/promotions?page=${promoPage}&limit=${promoLimit}`, {
                    method: 'GET'
                });

                setPromotions(res.results);
                setPromoCount(res.count);
            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoadingPromos(false);
            }
        };

        loadPromos();
    }, [promoPage, promoLimit]);

    const togglePromo = (promoId) => {
        setSelectedPromos((prev) =>
            prev.includes(promoId)
                ? prev.filter((id) => id !== promoId)
                : [...prev, promoId]
        );
    };

    // -------------------------------------------------------------
    // Submit Purchase Transaction
    // -------------------------------------------------------------
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        setSuccess(null);

        try {
            const payload = {
                utorid,
                type: 'purchase',
                spent: Number(spent),
                remark: remark || '',
                promotionIds: selectedPromos
            };

            const res = await api('/transactions', {
                method: 'POST',
                body: payload
            });

            setSuccess({
                id: res.id,
                utorid: res.utorid,
                spent: res.spent,
                earned: res.earned,
                promotionIds: res.promotionIds || []
            });

            // Reset form
            setUtorid('');
            setSpent('');
            setRemark('');
            setSelectedPromos([]);

        } catch (err) {
            console.error(err);
            setError(err.data?.error || err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const totalPromoPages = Math.ceil(promoCount / promoLimit);

    return (
        <div className="purchase-container">
            <h1>Create Purchase Transaction</h1>

            {error && <div className="error-box">{error}</div>}

            {/* ------------------- SUCCESS BOX ------------------- */}
            {success && (
                <div className="success-box">
                    <h3>Purchase Successful!</h3>

                    <p><strong>Transaction ID:</strong> {success.id}</p>
                    <p><strong>Customer:</strong> {success.utorid}</p>
                    <p><strong>Spent:</strong> ${success.spent.toFixed(2)}</p>
                    <p><strong>Earned Points:</strong> {success.earned}</p>

                    {success.promotionIds.length > 0 && (
                        <p>
                            <strong>Promotions Used:</strong> {success.promotionIds.join(', ')}
                        </p>
                    )}

                    <button className="ok-button" onClick={() => setSuccess(null)}>
                        OK
                    </button>
                </div>
            )}

            {/* ------------------- PURCHASE FORM ------------------- */}
            <form className="purchase-form" onSubmit={handleSubmit}>
                <label>Customer UTORid</label>
                <input
                    type="text"
                    value={utorid}
                    onChange={(e) => setUtorid(e.target.value)}
                    placeholder="Enter customer UTORid"
                    required
                />

                <label>Amount Spent</label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={spent}
                    onChange={(e) => setSpent(e.target.value)}
                    placeholder="Amount spent (e.g. 19.99)"
                    required
                />

                <label>Remark (optional)</label>
                <textarea
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="Optional note"
                />

                <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? 'Processing…' : 'Submit Purchase'}
                </button>
            </form>

            {/* ------------------- PROMOTIONS LIST ------------------- */}
            <div className="promo-section">
                <h2>Available Promotions</h2>

                {loadingPromos ? (
                    <p>Loading promotions…</p>
                ) : promotions.length === 0 ? (
                    <p>No promotions available.</p>
                ) : (
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
                            {promotions.map((promo) => (
                                <tr key={promo.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedPromos.includes(promo.id)}
                                            onChange={() => togglePromo(promo.id)}
                                        />
                                    </td>
                                    <td>{promo.name}</td>
                                    <td>{promo.type}</td>
                                    <td>{promo.rate}</td>
                                    <td>${promo.minSpending}</td>
                                    <td>{promo.endTime ? promo.endTime : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* PAGINATION */}
                <div className="promo-pagination">
                    <button
                        disabled={promoPage === 1}
                        onClick={() => setPromoPage(promoPage - 1)}
                    >
                        Previous
                    </button>

                    <span>
                        Page {promoPage} / {totalPromoPages || 1}
                    </span>

                    <button
                        disabled={promoPage === totalPromoPages}
                        onClick={() => setPromoPage(promoPage + 1)}
                    >
                        Next
                    </button>

                    <select
                        value={promoLimit}
                        onChange={(e) => {
                            setPromoLimit(Number(e.target.value));
                            setPromoPage(1);
                        }}
                    >
                        <option value="5">5 per page</option>
                        <option value="10">10 per page</option>
                        <option value="20">20 per page</option>
                        <option value="50">50 per page</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

export default TransactionPurchase;
