import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

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
          <Link to="/" className="active">Features</Link>
          <Link to="/solutions">Solutions</Link>
          <Link to="/pricing">Pricing</Link>
          <a href="#">Resources</a>
        </div>
        <div className="lp-nav-cta">
          <Link to="/login">Log In</Link>
          <Link to="/login" className="lp-btn lp-btn-primary">Get Started Free</Link>
        </div>
      </div>
    </nav>
  );
}
