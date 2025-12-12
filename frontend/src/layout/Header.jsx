import { useAuth } from '../contexts/AuthContext';

function Header() {
    const { logout, name, role } = useAuth();

    const firstName = name ? name.split(' ')[0] : 'User';
    const roleLabel = role || 'unknown';

    // Append "user" only for regular
    const roleDisplay =
        roleLabel === 'regular'
            ? `${roleLabel.toUpperCase()} user`
            : roleLabel.toUpperCase();

    return (
        <header className='header'>
            <div className='header-title'>
                Hello {firstName}, you're logged in as a {roleDisplay}.
            </div>

            <div className='header-right'>
                <button onClick={logout} className='logout-button'>
                    Logout
                </button>
            </div>
        </header>
    );
}

export default Header;
