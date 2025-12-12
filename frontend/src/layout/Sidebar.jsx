import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { hasClearance } from '../globals';

function Sidebar() {
    const { role } = useAuth();

    return (
        <aside className='sidebar'>
            <h2>Gihon Loyalty</h2>
            <ul>

                {/* --- Core --- */}
                <li><Link to='/dashboard'>Dashboard</Link></li>
                <li><Link to='/profile'>Profile</Link></li>

                {/* --- Wallet Group --- */}
                <li><Link to='/my-transactions'>My Transactions</Link></li>
                <li><Link to='/redeem'>Redeem Points</Link></li>
                <li><Link to='/transfer'>Transfer Points</Link></li>

                {/* --- Events --- */}
                <li><Link to="/events">Events</Link></li>

                {/* --- Promotions (Regular+) --- */}
                {hasClearance(role, 'regular') && (
                    <li><Link to="/promotions">Promotions</Link></li>
                )}

                {/* --- Cashier & Manager Tools --- */}

                {/* Cashier: Register users */}
                {hasClearance(role, 'cashier') && (
                    <li><Link to='/users/register'>Register User</Link></li>
                )}

                {/* Manager/Superuser: Users list */}
                {hasClearance(role, 'manager') && (
                    <li><Link to='/users'>All Users</Link></li>
                )}

                {/* Cashier: New Purchase */}
                {hasClearance(role, 'cashier') && (
                    <li><Link to='/transactions/purchase'>New Purchase</Link></li>
                )}

                {/* Manager/Superuser: All Transactions */}
                {hasClearance(role, 'manager') && (
                    <li><Link to='/transactions'>All Transactions</Link></li>
                )}

                {/* Manager/Superuser: Create Event */}
                {hasClearance(role, 'manager') && (
                    <li><Link to="/events/create">Create Event</Link></li>
                )}

                {/* Manager/Superuser: Create Promotion */}
                {hasClearance(role, 'manager') && (
                    <li><Link to="/promotions/create">New Promotion</Link></li>
                )}
            </ul>
        </aside>
    );
}

export default Sidebar;
