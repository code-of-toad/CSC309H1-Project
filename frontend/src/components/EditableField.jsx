import { useState } from 'react';
import './EditableField.css';

function EditableField({ label, value, type, options = [], canEdit, onSave }) {
    const [editing, setEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const startEdit = () => {
        setTempValue(value);
        setEditing(true);
        setError(null);
    };

    const cancel = () => {
        setEditing(false);
        setTempValue(value);
        setError(null);
    };

    const save = async () => {
        setSaving(true);
        setError(null);

        try {
            // -------------------------------------------------------------
            // 🔥 CRITICAL FIX: Ensure primitive value sent to onSave()
            // -------------------------------------------------------------
            let finalValue = tempValue;

            if (type === 'boolean') {
                finalValue = Boolean(tempValue);
            }

            if (type === 'select') {
                finalValue = String(tempValue);
            }

            if (type === 'text' || type === 'date') {
                finalValue = String(tempValue);
            }

            if (type === 'number') {
                finalValue = Number(tempValue);
            }

            await onSave(finalValue);

            setEditing(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Determine which input to render
    let inputElement;

    if (type === 'text') {
        inputElement = (
            <input
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
            />
        );
    }

    else if (type === 'boolean') {
        inputElement = (
            <input
                type="checkbox"
                checked={Boolean(tempValue)}
                onChange={(e) => setTempValue(e.target.checked)}
            />
        );
    }

    else if (type === 'select') {
        inputElement = (
            <select
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        );
    }

    else if (type === 'date') {
        inputElement = (
            <input
                type="date"
                value={tempValue || ''}
                onChange={(e) => setTempValue(e.target.value)}
            />
        );
    }

    return (
        <div className="editable-row">
            <strong>{label}: </strong>

            {!editing ? (
                <>
                    <span>{String(value)}</span>

                    {canEdit && (
                        <span className="edit-text" onClick={startEdit}>
                            Edit
                        </span>
                    )}
                </>
            ) : (
                <div className="edit-controls">
                    {inputElement}

                    <span className="save-text" onClick={save}>
                        {saving ? 'Saving…' : 'Save'}
                    </span>

                    <span className="cancel-text" onClick={cancel}>
                        Cancel
                    </span>

                    {error && <p className="error-message">{error}</p>}
                </div>
            )}
        </div>
    );
}

export default EditableField;
