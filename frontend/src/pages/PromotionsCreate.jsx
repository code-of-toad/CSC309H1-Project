import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import './PromotionsCreate.css';

function PromotionsCreate() {
    const api = useApi();

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('automatic');

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');

    const [minSpending, setMinSpending] = useState('');
    const [rate, setRate] = useState('');
    const [points, setPoints] = useState('');

    const [message, setMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(null);

        // Convert datetime-local → ISO string (required for backend)
        const startISO = new Date(startTime).toISOString();
        const endISO = new Date(endTime).toISOString();

        const payload = {
            name,
            description,
            type,
            startTime: startISO,
            endTime: endISO,
            minSpending: minSpending === '' ? null : Number(minSpending),
            rate: rate === '' ? null : Number(rate),
            points: points === '' ? null : Number(points),
        };

        try {
            const res = await api('/promotions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            // Success message
            setMessage({
                type: 'success',
                text: `Promotion "${res.name}" created successfully.`
            });

            // Clear form
            setName('');
            setDescription('');
            setType('automatic');
            setStartTime('');
            setEndTime('');
            setMinSpending('');
            setRate('');
            setPoints('');
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <div className="promo-create-container">
            <h1>Create Promotion</h1>

            {message && (
                <p className={`form-message ${message.type}`}>
                    {message.text}
                </p>
            )}

            <form onSubmit={handleSubmit} className="promo-form">
                <label>Name</label>
                <input value={name} onChange={(e) => setName(e.target.value)} required />

                <label>Description</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />

                <label>Type</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="automatic">Automatic</option>
                    <option value="one-time">One-Time</option>
                </select>

                <label>Start Time</label>
                <input
                    type="datetime-local"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                />

                <label>End Time</label>
                <input
                    type="datetime-local"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                />

                <label>Minimum Spending (optional)</label>
                <input
                    type="number"
                    min="0"
                    value={minSpending}
                    onChange={(e) => setMinSpending(e.target.value)}
                />

                <label>Rate (optional)</label>
                <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                />

                <label>Points (optional)</label>
                <input
                    type="number"
                    min="0"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                />

                <button type="submit" className="create-btn">
                    Create Promotion
                </button>
            </form>
        </div>
    );
}

export default PromotionsCreate;
