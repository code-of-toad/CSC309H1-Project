import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import './CreateRedemption.css';

function CreateRedemption() {
    const api = useApi();

    const [amount, setAmount] = useState('');
    const [remark, setRemark] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const data = await api('/users/me/transactions', {
                method: 'POST',
                body: JSON.stringify({
                    type: 'redemption',
                    amount: Number(amount),
                    remark,
                }),
            });

            setResult(data);
            setAmount('');
            setRemark('');
        } catch (err) {
            setError(err.message || 'Redemption failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="redemption-container">
            <h1>Create Redemption</h1>

            <form className="redemption-form" onSubmit={submit}>
                <label>
                    Amount to Redeem (points):
                    <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                    />
                </label>

                <label>
                    Remark (optional):
                    <input
                        type="text"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                    />
                </label>

                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting…' : 'Submit Redemption'}
                </button>
            </form>

            {error && <p className="error-message">{error}</p>}

            {result && (
                <div className="success-box">
                    <h2>Redemption Created!</h2>
                    <p><strong>ID:</strong> {result.id}</p>
                    <p><strong>Amount:</strong> {result.amount}</p>
                    <p><strong>Remark:</strong> {result.remark || '—'}</p>
                    <p><strong>Created By:</strong> {result.createdBy}</p>
                </div>
            )}
        </div>
    );
}

export default CreateRedemption;
