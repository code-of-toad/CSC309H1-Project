import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { hasClearance } from '../globals';

function Sidebar() {
    const { role } = useAuth();

    return (
        <aside className='sidebar'>
            <h2>Gihon Loyalty</h2>
            <ul>

                {/* --- Profile stuff --- */}
                <li><Link to='/dashboard'>Dashboard</Link></li>
                <li><Link to='/profile'>Profile</Link></li>
                {hasClearance(role, 'cashier') && (
                    <li><Link to='/users/register'>Register User</Link></li>
                )}
                {hasClearance(role, 'manager') && (
                    <li><Link to='/users'>All Users</Link></li>
                )}

                {/* --- Transaction stuff --- */}
                <li><Link to='/my-transactions'>My Transactions</Link></li>
                <li><Link to='/transfer'>Transfer Points</Link></li>
                <li><Link to='/redeem'>Redeem Points</Link></li>
                {hasClearance(role, 'cashier') && (
                    <li><Link to='/transactions/purchase'>New Purchase</Link></li>
                )}
                {hasClearance(role, 'manager') && (
                    <li><Link to='/transactions'>All Transactions</Link></li>
                )}

                {/* --- Promotions stuff --- */}
                {hasClearance(role, 'regular') && (
                    <li><Link to="/promotions">Promotions</Link></li>
                )}
                {hasClearance(role, 'manager') && (
                    <li><Link to="/promotions/create">Create Promotion</Link></li>
                )}

                {/* --- Events stuff --- */}
                <li><Link to="/events">Events</Link></li>
                {hasClearance(role, 'manager') && (
                    <li><Link to="/events/create">Create Event</Link></li>
                )}
            </ul>
        </aside>
    );
}

export default Sidebar;
