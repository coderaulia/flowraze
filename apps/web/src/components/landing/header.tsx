import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

export function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <nav className={`lp-nav${scrolled ? ' lp-scrolled' : ''}`}>
      <div className="lp-nav-inner">
        <Link to="/" className="lp-logo">
          <span className="lp-logo-dot" />
          FlowRaze
        </Link>
        <div className="lp-nav-links">
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Features</NavLink>
          <NavLink to="/solutions" className={({ isActive }) => isActive ? 'active' : ''}>Solutions</NavLink>
          <NavLink to="/pricing" className={({ isActive }) => isActive ? 'active' : ''}>Pricing</NavLink>
          <NavLink to="/resources" className={({ isActive }) => isActive ? 'active' : ''}>Resources</NavLink>
        </div>
        <div className="lp-nav-cta">
          <Link to="/login">Log In</Link>
          <Link to="/register" className="lp-btn lp-btn-primary">Get Started Free</Link>
        </div>
      </div>
    </nav>
  );
}
