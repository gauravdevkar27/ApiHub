import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../../stores/authStore.js';
import './Auth.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(''); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email.trim() || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      await login({
        email: formData.email.trim(),
        password: formData.password,
      });
      navigate('/', { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        'Something went wrong. Please try again.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-brand__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <h1 className="auth-brand__title">ApiHub</h1>
          <p className="auth-brand__subtitle">Sign in to your workspace</p>
        </div>

     
        {error && (
          <div className="auth-error">
            <svg className="auth-error__icon" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4.25a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0v-3zm.75 6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

  
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="auth-input-group">
            <label className="auth-input-group__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              className="auth-input-group__input"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-input-group__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="auth-input-group__input"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={`auth-submit-btn ${isSubmitting ? 'auth-submit-btn--loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

      
        <div className="auth-footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth-footer__link">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
