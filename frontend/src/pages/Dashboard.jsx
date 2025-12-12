import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
    const { role, points } = useAuth();
    const navigate = useNavigate();

    // ============================
    // CARD DEFINITIONS BY ROLE
    // ============================

    // ---------- REGULAR USER ----------
    const regularCards = [
        {
            title: 'Points',
            subtitle: `${points} points`,
            clickable: false,
        },
        {
            title: 'Profile Summary',
            subtitle: 'View & edit your profile',
            onClick: () => navigate('/profile'),
        },
        {
            title: 'Recent Transactions',
            subtitle: 'View transaction history',
            onClick: () => navigate('/my-transactions'),
        },
        {
            title: 'Active Promotions',
            subtitle: 'View all available promotions',
            onClick: () => navigate('/promotions'),
        },
        {
            title: 'Available Events',
            subtitle: 'RSVP for active events',
            onClick: () => navigate('/events'),
        },
    ];

    // ---------- CASHIER ----------
    const cashierCards = [
        {
            title: 'Profile Summary',
            subtitle: 'Your cashier account',
            onClick: () => navigate('/profile'),
        },
        {
            title: 'Create New Account',
            subtitle: 'Register a new user',
            onClick: () => navigate('/users/new'),
        },
        {
            title: 'Create Purchase',
            subtitle: 'Make a purchase transaction',
            onClick: () => navigate('/transactions/new'),
        },
        {
            title: 'Active Promotions',
            subtitle: 'View current promotions',
            onClick: () => navigate('/promotions'),
        },
    ];

    // ---------- MANAGER/SUPERUSER ----------
    const adminCards = [
        {
            title: 'Profile Summary',
            subtitle: 'Manage your admin account',
            onClick: () => navigate('/profile'),
        },
        {
            title: 'Create New Account',
            subtitle: 'Register a new user',
            onClick: () => navigate('/users/new'),
        },
        {
            title: 'View All Users',
            subtitle: 'Search & manage users',
            onClick: () => navigate('/users'),
        },
        {
            title: 'View All Transactions',
            subtitle: 'Full transaction history',
            onClick: () => navigate('/transactions'),
        },
        {
            title: 'View All Events',
            subtitle: 'Manage events',
            onClick: () => navigate('/events'),
        },
        {
            title: 'View All Promotions',
            subtitle: 'Manage promotions',
            onClick: () => navigate('/promotions'),
        },
    ];

    // ============================
    // SELECT CARDS PER ROLE
    // ============================
    let cards = [];
    if (role === 'regular') cards = regularCards;
    else if (role === 'cashier') cards = cashierCards;
    else if (role === 'manager' || role === 'superuser') cards = adminCards;

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>

            <div className="dashboard-grid">
                {cards.map((card, idx) => (
                    <div
                        key={idx}
                        className={`dashboard-card ${card.onClick ? 'clickable' : ''}`}
                        onClick={card.onClick ? card.onClick : undefined}
                    >
                        <h2>{card.title}</h2>
                        <p>{card.subtitle}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Dashboard;
