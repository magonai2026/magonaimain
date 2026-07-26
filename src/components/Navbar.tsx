import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar: React.FC = () => {
    const [] = useState<boolean>(false);
    const { pathname } = useLocation();

    return (
        <nav className="nav">
            <Link to="/" className="logo">
                <div className="logo-icon" style={{ width: '45px', height: '45px' }}>
                    <img 
                        src="/mangoai.png" 
                        alt="Niyantri Security" 
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                    />
                </div>
                <span>Magon AI</span>
            </Link>
            
            <ul className="nav-links">
                <li><Link to="/research" className={pathname === '/research' ? 'nav-link-active' : ''}>Research</Link></li>
                <li><Link to="/pricing" className={pathname === '/pricing' ? 'nav-link-active' : ''}>Pricing</Link></li>
                <li><Link to="/Guide" className={pathname === '/guide' ? 'nav-link-active' : ''}>Guide</Link></li>
                <li><Link to="/about" className={pathname === '/about' ? 'nav-link-active' : ''}>About Us</Link></li>
                <li><Link to="/contact" className={pathname === '/contact' ? 'nav-link-active' : ''}>Contact Us</Link></li>
                <li>
                    <Link to="/login" style={{ 
                        background: '#1a1a1a', 
                        color: '#fff', 
                        padding: '0.5rem 1.2rem', 
                        borderRadius: '6px' 
                    }}>
                        Login
                    </Link>
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;