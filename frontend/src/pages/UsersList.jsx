import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useNavigate } from 'react-router-dom';
import { formatDate } from '../globals';
import Table from '../components/Table';
import './UsersList.css';

function UsersList() {
    const api = useApi();
    const navigate = useNavigate();

    // Filters + pagination
    const [query, setQuery] = useState({
        name: '',
        role: '',
        verified: '',
        activated: '',
        page: 1,
        limit: 10
    });

    // Data state
    const [count, setCount] = useState(0);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    //----------------------------------------------------------------------
    // Helper to update filters OR pagination
    //----------------------------------------------------------------------
    const updateQuery = (field, value) => {
        setQuery(prev => ({
            ...prev,
            [field]: value,
            page: 1 // always reset to first page when filters change
        }));
    };

    //----------------------------------------------------------------------
    // Build backend query string
    //----------------------------------------------------------------------
    const buildQueryString = () => {
        const params = new URLSearchParams();

        Object.entries(query).forEach(([key, value]) => {
            if (value !== '' && value !== null) {
                params.append(key, value);
            }
        });

        return `/users?${params.toString()}`;
    };

    //----------------------------------------------------------------------
    // Fetch user list from backend whenever query changes
    //----------------------------------------------------------------------
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            setError(null);

            try {
                const url = buildQueryString();
                const data = await api(url, { method: 'GET' });

                setCount(data.count);
                setResults(data.results);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [query]);

    //----------------------------------------------------------------------
    // Table column config
    //----------------------------------------------------------------------
    const columns = [
        { label: 'UTORid', accessor: 'utorid' },
        { label: 'Name', accessor: 'name' },
        { label: 'Email', accessor: 'email' },
        { label: 'Role', accessor: 'role' },
        { label: 'Verified', accessor: 'verified' },
        { label: 'Activated', accessor: 'lastLogin' },
        { label: 'Points', accessor: 'points' },
        { label: 'Created At', accessor: 'createdAt' }
    ];

    //----------------------------------------------------------------------
    // Page JSX
    //----------------------------------------------------------------------
    return (
        <div className="users-list-container">
            <h1>All Users</h1>

            {/* ---------------- FILTER BAR ---------------- */}
            <div className="filters">
                <input
                    type="text"
                    placeholder="Search name or UTORid"
                    value={query.name}
                    onChange={(e) => updateQuery('name', e.target.value)}
                />

                <select
                    value={query.role}
                    onChange={(e) => updateQuery('role', e.target.value)}
                >
                    <option value="">All Roles</option>
                    <option value="regular">Regular</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="superuser">Superuser</option>
                </select>

                <select
                    value={query.verified}
                    onChange={(e) => updateQuery('verified', e.target.value)}
                >
                    <option value="">Verified?</option>
                    <option value="true">Verified</option>
                    <option value="false">Not Verified</option>
                </select>

                <select
                    value={query.activated}
                    onChange={(e) => updateQuery('activated', e.target.value)}
                >
                    <option value="">Ever Logged In?</option>
                    <option value="true">Activated</option>
                    <option value="false">Not Activated</option>
                </select>
            </div>

            {/* ---------------- TABLE ---------------- */}
            <Table
                columns={columns}
                data={results}
                loading={loading}
                error={error}
                page={query.page}
                limit={query.limit}
                totalCount={count}
                onPageChange={(p) => setQuery(prev => ({ ...prev, page: p }))}
                onLimitChange={(lim) => setQuery(prev => ({ ...prev, limit: lim }))}
                
                // CLICKABLE ROW → navigate to /users/:userId
                renderRow={(row) => (
                    <tr
                        key={row.id}
                        onClick={() => navigate(`/users/${row.id}`)}
                        className="clickable-row"
                    >
                        <td>{row.utorid}</td>
                        <td>{row.name}</td>
                        <td>{row.email}</td>
                        <td>{row.role}</td>
                        <td>{row.verified ? 'Yes' : 'No'}</td>
                        <td>{row.lastLogin ? 'Yes' : 'No'}</td>
                        <td>{row.points}</td>
                        <td>{formatDate(row.createdAt)}</td>
                    </tr>
                )}
            />
        </div>
    );
}

export default UsersList;
