import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Radio, UserPlus } from 'lucide-react';
import { useAuth, ROLES } from '../../contexts/AuthContext';
import authImage from '../../images/auth.jpg';

const roles = [
  { value: ROLES.STATION_MANAGER, label: 'Station Manager' },
  { value: ROLES.FINANCE_OFFICER, label: 'Finance Officer' },
  { value: ROLES.MARKETING_OFFICER, label: 'Marketing Officer' },
  { value: ROLES.STAFF, label: 'Staff Member' },
  { value: ROLES.AUDITOR, label: 'Auditor' }
];

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: ROLES.STATION_MANAGER
  });
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const { register, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setValidationError('');
  };

  const validateForm = () => {
    if (!formData.name.trim()) return setValidationError('Full name is required'), false;
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) return setValidationError('Please enter a valid email'), false;
    if (formData.password.length < 6) return setValidationError('Password must be at least 6 characters'), false;
    if (formData.password !== formData.confirmPassword) return setValidationError('Passwords do not match. Retype both fields without extra spaces.'), false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    const result = await register({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    });
    setLoading(false);

    if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <main className="auth-page">
      <Link to="/" className="auth-back">
        <ArrowLeft size={16} />
        Back to home
      </Link>

      <section className="auth-shell auth-shell--register">
        <div className="auth-visual">
          <img src={authImage} alt="Lekope FM account setup" />
          <div className="auth-visual__overlay">
            <span>New authorized user</span>
            <h2>Create access for finance, station and reporting teams.</h2>
            <p>Set the right role from the start so every user lands in the correct workspace.</p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-brand-mark">
            <Radio size={34} />
          </div>
          <span className="auth-kicker">Account setup</span>
          <h1>Create account</h1>
          <p className="auth-copy">Register an authorized Lekope FM user and assign the correct system role.</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {(error || validationError) && <div className="auth-alert">{validationError || error}</div>}

            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </label>

            <label className="auth-field">
              <span>Email address</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="name@lekopefm.co.ls"
                required
              />
            </label>

            <div className="auth-form__row">
              <label className="auth-field">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  required
                />
              </label>

              <label className="auth-field">
                <span>Confirm password</span>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat password"
                  required
                />
              </label>
            </div>

            <label className="auth-field">
              <span>Role</span>
              <select name="role" value={formData.role} onChange={handleChange}>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </label>

            <button className="auth-submit" type="submit" disabled={loading}>
              <UserPlus size={17} />
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
};

export default Register;
