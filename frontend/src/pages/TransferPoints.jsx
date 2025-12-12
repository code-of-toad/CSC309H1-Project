import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import './TransferPoints.css';

function TransferPoints() {
    const api = useApi();

    const [recipientUtorid, setRecipientUtorid] = useState('');
    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // -------------------------------------------------------------
    // SUBMIT TRANSFER
    // -------------------------------------------------------------
    const submitTransfer = async () => {
        setError(null);
        setSuccess(null);

        if (!recipientUtorid) {
            setError("Recipient UTORid is required");
            return;
        }
        if (!amount || Number(amount) <= 0) {
            setError("Amount must be a positive number");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                type: "transfer",
                amount: Number(amount),
                remark,
            };

            // Use UTORid directly (backend now supports this)
            const res = await api(`/users/${recipientUtorid}/transactions`, {
                method: "POST",
                body: JSON.stringify(payload),
                headers: { "Content-Type": "application/json" },
            });

            setSuccess(`Transferred ${amount} points to ${recipientUtorid}!`);

            // Clear form
            setRecipientUtorid('');
            setAmount('');
            setRemark('');

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="transfer-container">
            <h1>Transfer Points</h1>

            <div className="form-box">

                <label>Recipient UTORid:</label>
                <input
                    type="text"
                    value={recipientUtorid}
                    onChange={(e) => setRecipientUtorid(e.target.value)}
                />

                <label>Amount:</label>
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

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <button
                    className="submit-btn"
                    disabled={loading}
                    onClick={submitTransfer}
                >
                    {loading ? "Transferring…" : "Transfer Points"}
                </button>

            </div>
        </div>
    );
}

export default TransferPoints;
