import { useState } from 'react';
import { useApi } from '../hooks/useApi';

function AdjustmentPanel({ transaction }) {
    const api = useApi();
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [promoIds, setPromoIds] = useState([]);
    const [promotions, setPromotions] = useState([]);
    const [success, setSuccess] = useState(null);
    const [error, setError] = useState(null);

    // Load promotions once user opens the panel
    const loadPromos = async () => {
        try {
            const res = await api(`/promotions?page=1&limit=100`);
            setPromotions(res.results);
        } catch (err) {
            console.error(err);
        }
    };

    const togglePromo = (id) => {
        setPromoIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const submitAdjustment = async () => {
        setError(null);
        setSuccess(null);

        try {
            const body = {
                utorid: transaction.utorid,
                type: 'adjustment',
                amount: Number(amount),
                relatedId: transaction.id,
                promotionIds: promoIds,
                remark
            };

            const res = await api('/transactions', {
                method: 'POST',
                body
            });

            setSuccess(`Adjustment created (ID: ${res.id})`);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="adjustment-panel">
            <h3>Adjust This Transaction</h3>

            <label>Amount (+/-):</label>
            <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
            />

            <label>Remark (optional):</label>
            <input
                type="text"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
            />

            {/* Promotion loading */}
            <button onClick={loadPromos}>Load Promotions</button>

            {/* Promotion list */}
            {promotions.length > 0 && (
                <div className="promo-list">
                    {promotions.map((p) => (
                        <label key={p.id}>
                            <input
                                type="checkbox"
                                checked={promoIds.includes(p.id)}
                                onChange={() => togglePromo(p.id)}
                            />
                            {p.name} (ID: {p.id})
                        </label>
                    ))}
                </div>
            )}

            <button className="submit-btn" onClick={submitAdjustment}>
                Submit Adjustment
            </button>

            {success && <p className="success-msg">{success}</p>}
            {error && <p className="error-msg">{error}</p>}
        </div>
    );
}

export default AdjustmentPanel;
