import './Testing.css';
import { useState } from 'react';
import { BASE_URL } from '../globals';

function Testing() {

    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const testingApi = async () => {
        setLoading(true);
        const res = await fetch(`${BASE_URL}/auth/tokens`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                utorid: 'mclovin7',
                password: 'Abcdef1!',
            }),
        });

        if (!res.ok) {
            const err = await res.json();
            setLoading(false);
            setResult(`Error: ${err.message}`);
        } else {
            const jwt = await res.json();
            setLoading(false);
            setResult(`JWT: ${jwt.token}`);
        }
    };

    return (
        <>
        <div className='test-container'>
            <h1>TESTING COMPONENT</h1>
            <p>Hello World</p>
            <button onClick={testingApi}>Click to test API</button>
            {
                loading
                    ? <p>L O A D I N G ...</p>
                    : result
                        ? <p className={result.startsWith('Error') ? 'error-msg' : ''}>{result}</p>
                        : null
            }
        </div>
        </>
    );
}

export default Testing;
