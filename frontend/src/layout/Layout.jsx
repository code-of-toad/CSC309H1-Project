import Sidebar from './Sidebar';
import Header from './Header';
import Footer from './Footer';
import './Layout.css';

function Layout({ children }) {
    return (
        // Main layout wrapper for all authenticated pages.
        // Contains Sidebar (left), Header (top), Main content (middle), Footer (bottom)
        <div className='layout-container'>
            {/* Sidebar remains visible on all authenticated pages */}
            <Sidebar />
            {/* Right-hand section contains header, content, and footer */}
            <div className='layout-right'>
                {/* Top bar that includes the page title + logout button */}
                <Header />
                {/* Dynamic page content goes here (whatever Layout wraps) */}
                <main className='layout-main'>
                    {children}
                </main>
                {/* Footer shown at the bottom of all pages */}
                <Footer />
            </div>
        </div>
    );
}

export default Layout;
