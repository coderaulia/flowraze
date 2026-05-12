import { Link } from 'react-router-dom';

export function LandingFooter() {
  return (
    <footer className="lp-footer">
      <div className="lp-ftr">
        <div className="brand">
          <Link to="/" className="lp-logo">
            <span className="lp-logo-dot" />
            FlowRaze
          </Link>
          <p>Understand what drives your revenue. Precision-engineered for the modern revenue team.</p>
        </div>
        <div>
          <h4>Product</h4>
          <ul>
            <li><Link to="/">Features</Link></li>
            <li><Link to="/solutions">Solutions</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><a href="#">Integrations</a></li>
          </ul>
        </div>
        <div>
          <h4>Company</h4>
          <ul>
            <li><Link to="/about">About</Link></li>
            <li><a href="#">Customers</a></li>
            <li><Link to="/careers">Careers</Link></li>
            <li><Link to="/blog">Blog</Link></li>
          </ul>
        </div>
        <div>
          <h4>Support</h4>
          <ul>
            <li><a href="#">Documentation</a></li>
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/privacy">Privacy</Link></li>
            <li><Link to="/terms">Terms</Link></li>
          </ul>
        </div>
      </div>
      <div className="lp-ftr-bottom">
        <span>© 2026 FlowRaze. Precision in Motion.</span>
        <span>Made in Jakarta · Built for the world</span>
      </div>
    </footer>
  );
}
