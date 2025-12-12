import { useState } from 'react';
import { useApi } from '../hooks/useApi';
import './RegisterUser.css';

function RegisterUser() {
    const api = useApi();

    // Form fields
    const [utorid, setUtorid] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // UI feedback states
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successData, setSuccessData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessData(null);
        setLoading(true);

        try {
            // POST /users (cashier +)
            const data = await api('/users', {
                method: 'POST',
                body: { utorid, name, email },
            });

            // Save full backend response
            setSuccessData(data);

            // Clear form fields
            setUtorid('');
            setName('');
            setEmail('');
        } catch (err) {
            // Display backend error message (409, 400, etc.)
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='register-user-container'>
            <h1>Register New User</h1>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className='register-user-form'>
                <label htmlFor='utorid'>UTORid</label>
                <input
                    id='utorid'
                    type='text'
                    placeholder='7-8 character UTORid'
                    value={utorid}
                    onChange={e => setUtorid(e.target.value)}
                />

                <label htmlFor='name'>Full Name</label>
                <input
                    id='name'
                    type='text'
                    placeholder="User's full name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                />

                <label htmlFor='email'>Email</label>
                <input
                    id='email'
                    type='email'
                    placeholder="user@mail.utoronto.ca"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                />

                <button type='submit' disabled={loading}>
                    {loading ? 'Creating user...' : 'Create User'}
                </button>

                {error && <p className='error-message'>{error}</p>}
            </form>

            {/* Success Output */}
            {successData && (
                <div className='success-box'>
                    <h2>User Created Successfully!</h2>

                    <p><strong>UTORid:</strong> {successData.utorid}</p>
                    <p><strong>Name:</strong> {successData.name}</p>
                    <p><strong>Email:</strong> {successData.email}</p>
                    <p><strong>Verified:</strong> {successData.verified ? 'Yes' : 'No'}</p>
                    <p><strong>Activation Token:</strong></p>

                    {/* Copyable token output */}
                    <pre className='token-box'>{successData.resetToken}</pre>
                    <p className='note'>
                        This token would normally be emailed to the user.
                        For this assignment, copy it and use it on the password reset endpoint.
                    </p>
                </div>
            )}
        </div>
    );
}

export default RegisterUser;
