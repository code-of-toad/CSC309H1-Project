import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../contexts/AuthContext';
import { formatDate, hasClearance } from '../globals';
import './TransactionDetails.css';

function TransactionDetails() {
    const api = useApi();
    const { role } = useAuth();
    const { transactionId } = useParams();

    const [trx, setTrx] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Adjustment Form State ---
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustRemark, setAdjustRemark] = useState('');
    const [adjustError, setAdjustError] = useState(null);
    const [adjustSuccess, setAdjustSuccess] = useState(null);
    const [adjustLoading, setAdjustLoading] = useState(false);

    // --- Promotions State ---
    const [promos, setPromos] = useState([]);
    const [promoPage, setPromoPage] = useState(1);
    const [promoLimit, setPromoLimit] = useState(10);
    const [promoCount, setPromoCount] = useState(0);
    const [selectedPromoIds, setSelectedPromoIds] = useState([]);

    // --- Redemption Processing State ---
    const [procError, setProcError] = useState(null);
    const [procLoading, setProcLoading] = useState(false);

    // Load transaction details
    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                const data = await api(`/transactions/${transactionId}`);
                setTrx(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [transactionId]);

    // Load promotions
    useEffect(() => {
        const loadPromos = async () => {
            try {
                const data = await api(`/promotions?page=${promoPage}&limit=${promoLimit}`);
                setPromos(data.results || []);
                setPromoCount(data.count || 0);
            } catch {
                setPromos([]);
            }
        };
        loadPromos();
    }, [promoPage, promoLimit]);

    if (loading) return <p>Loading transaction...</p>;
    if (error) return <p className="error-message">{error}</p>;
    if (!trx) return <p>No transaction found.</p>;

    // Format money
    const spentFormatted =
        trx.spent !== null && trx.spent !== undefined
            ? `$${Number(trx.spent).toFixed(2)}`
            : '—';

    // ---------------------------------------------------------
    // SUBMIT ADJUSTMENT
    // ---------------------------------------------------------
    const submitAdjustment = async () => {
        setAdjustError(null);
        setAdjustSuccess(null);

        if (!adjustAmount || isNaN(adjustAmount)) {
            setAdjustError("Amount must be a valid number");
            return;
        }

        const payload = {
            utorid: trx.utorid,
            type: "adjustment",
            amount: Number(adjustAmount),
            relatedId: trx.id,
            promotionIds: selectedPromoIds,
            remark: adjustRemark
        };

        try {
            setAdjustLoading(true);

            const res = await api(`/transactions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            setAdjustSuccess(`Adjustment created successfully! New ID = ${res.id}`);
            setAdjustAmount('');
            setAdjustRemark('');
            setSelectedPromoIds([]);

        } catch (err) {
            setAdjustError(err.message);
        } finally {
            setAdjustLoading(false);
        }
    };

    // ---------------------------------------------------------
    // TOGGLE PROMOTION
    // ---------------------------------------------------------
    const togglePromo = (id) => {
        setSelectedPromoIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    // ---------------------------------------------------------
    // PROCESS REDEMPTION
    // ---------------------------------------------------------
    const canProcessRedemption =
        trx.type === "redemption" &&
        !trx.processedBy &&
        hasClearance(role, "cashier");

    // const canProcessRedemption =
    //     trx.type === "redemption" &&
    //     trx.processedBy === null &&
    //     hasClearance(role, "cashier");

    const processRedemption = async () => {
        setProcError(null);
        try {
            setProcLoading(true);

            await api(`/transactions/${trx.id}/processed`, {
                method: "PATCH",
                body: JSON.stringify({ processed: true }),
                headers: { "Content-Type": "application/json" }
            });

            // Reload transaction
            const updated = await api(`/transactions/${trx.id}`);
            setTrx(updated);

        } catch (err) {
            setProcError(err.message);
        } finally {
            setProcLoading(false);
        }
    };

    return (
        <div className="transaction-details-container">
            <h1>Transaction #{trx.id}</h1>

            {/* ================== DETAILS ================== */}
            <div className="details-box">
                <p><strong>UTORid:</strong> {trx.utorid}</p>
                <p><strong>Type:</strong> {trx.type}</p>

                <p><strong>Amount:</strong> {trx.amount}</p>
                <p><strong>Spent:</strong> {spentFormatted}</p>

                <p>
                    <strong>Related ID:</strong>{" "}
                    {trx.relatedId !== null ? trx.relatedId : "—"}
                </p>

                <p>
                    <strong>Suspicious:</strong>{" "}
                    <span className={trx.suspicious ? "flag-red" : "flag-green"}>
                        {trx.suspicious ? "Yes" : "No"}
                    </span>
                </p>

                <p>
                    <strong>Promotion IDs:</strong>{" "}
                    {trx.promotions?.length
                        ? trx.promotions.map((p) => p.id).join(", ")
                        : "—"}
                </p>

                <p><strong>Remark:</strong> {trx.remark || "—"}</p>

                <p><strong>Created By:</strong> {trx.createdBy}</p>
                <p><strong>Processed By:</strong> {trx.processedBy || "—"}</p>

                {trx.createdAt && (
                    <p><strong>Created At:</strong> {formatDate(trx.createdAt)}</p>
                )}

                {/* ================== PROCESS REDEMPTION ================== */}
                {canProcessRedemption && (
                    <div className="process-box">
                        <button
                            className="process-btn"
                            disabled={procLoading}
                            onClick={processRedemption}
                        >
                            {procLoading ? "Processing…" : "Process Redemption"}
                        </button>

                        {procError && (
                            <p className="error-message">{procError}</p>
                        )}
                    </div>
                )}
            </div>

            {/* ================== ADJUSTMENT ================== */}
            <h2>Create Adjustment</h2>

            <div className="adjust-box">
                <div>
                    <label>Amount (points):</label>
                    <input
                        type="number"
                        value={adjustAmount}
                        onChange={(e) => setAdjustAmount(e.target.value)}
                    />
                </div>

                <div>
                    <label>Remark (optional):</label>
                    <input
                        type="text"
                        value={adjustRemark}
                        onChange={(e) => setAdjustRemark(e.target.value)}
                    />
                </div>

                {adjustError && <p className="error-message">{adjustError}</p>}
                {adjustSuccess && <p className="success-message">{adjustSuccess}</p>}

                <button
                    onClick={submitAdjustment}
                    disabled={adjustLoading}
                    className="submit-btn"
                >
                    {adjustLoading ? "Submitting…" : "Submit Adjustment"}
                </button>
            </div>

            {/* ================== PROMOTIONS ================== */}
            <h2>Available Promotions</h2>

            <div className="promotions-table-box">
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
                        {promos.length === 0 && (
                            <tr><td colSpan="6">No promotions found.</td></tr>
                        )}

                        {promos.map((promo) => (
                            <tr key={promo.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedPromoIds.includes(promo.id)}
                                        onChange={() => togglePromo(promo.id)}
                                    />
                                </td>
                                <td>{promo.name}</td>
                                <td>{promo.type}</td>
                                <td>{promo.rate}</td>
                                <td>${promo.minSpending.toFixed(2)}</td>
                                <td>{promo.endTime || "—"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination-bar">
                    <button
                        disabled={promoPage === 1}
                        onClick={() => setPromoPage(promoPage - 1)}
                    >
                        Previous
                    </button>

                    <span>
                        Page {promoPage} / {Math.ceil(promoCount / promoLimit) || 1}
                    </span>

                    <button
                        disabled={promoPage >= Math.ceil(promoCount / promoLimit)}
                        onClick={() => setPromoPage(promoPage + 1)}
                    >
                        Next
                    </button>

                    <select
                        value={promoLimit}
                        onChange={(e) => setPromoLimit(Number(e.target.value))}
                    >
                        <option value="10">10 per page</option>
                        <option value="20">20 per page</option>
                        <option value="50">50 per page</option>
                    </select>
                </div>
            </div>
        </div>
    );
}

export default TransactionDetails;
