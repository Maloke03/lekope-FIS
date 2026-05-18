import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LockKeyhole, Radio } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import authImage from '../../images/auth.jpg';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const redirectPath = {
        STATION_MANAGER: '/dashboard',
        FINANCE_OFFICER: '/dashboard',
        MARKETING_OFFICER: '/adcontracts',
        STAFF: '/payroll',
        AUDITOR: '/dashboard'
      }[result.user.role] || '/dashboard';
      navigate(redirectPath);
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-back">
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <section className="auth-shell auth-shell--login">
        <div className="auth-visual">
          <img src={authImage} alt="Lekope FM financial system access" />
          <div className="auth-visual__overlay">
            <span>Secure finance workspace</span>
            <h2>Welcome back to Lekope FM FIS.</h2>
            <p>Open your dashboard, review live activity, and keep the station moving with confidence.</p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-brand-mark">
            <Radio size={34} />
          </div>
          <span className="auth-kicker">Authorized access</span>
          <h1>Sign in</h1>
          <p className="auth-copy">Use your Lekope FM account credentials to continue to your role-based workspace.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-alert">{error}</div>}

            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@lekopefm.co.ls"
                required
              />
            </label>

            <label className="auth-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              <LockKeyhole size={17} />
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            Do not have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Login;
