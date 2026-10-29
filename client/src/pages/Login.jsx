import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={location.state?.from || '/'} replace />;

  const isRegister = mode === 'register';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (isRegister) {
      if (password.length < 8) return setError('Password must be at least 8 characters');
      if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
        return setError('Password must contain at least one letter and one number');
      }
      if (password !== confirm) return setError('Passwords do not match');
    }
    setBusy(true);
    try {
      if (isRegister) await register(email, password);
      else await login(email, password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(isRegister ? 'login' : 'register');
    setError('');
    setPassword('');
    setConfirm('');
  }

  return (
    <div className="card auth-card">
      <h1 className="page-title" style={{ fontSize: '28px' }}>{isRegister ? 'Create Account' : 'Sign In'}</h1>
      <p style={{ textAlign: 'center', color: '#aaa' }}>
        {isRegister
          ? 'Create an account to save your own wrestlers, lineups and results.'
          : 'Sign in to build your Royal Rumble and see your predictions.'}
      </p>
      {error && <div className="error-msg" role="alert">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="email">Email</label>
        <input
          id="email" type="email" autoComplete="email" required maxLength={254}
          value={email} onChange={e => setEmail(e.target.value)}
        />
        <label htmlFor="password">Password</label>
        <input
          id="password" type="password" required maxLength={72}
          autoComplete={isRegister ? 'new-password' : 'current-password'}
          value={password} onChange={e => setPassword(e.target.value)}
        />
        {isRegister && (
          <>
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm" type="password" required maxLength={72} autoComplete="new-password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
            />
            <small style={{ color: '#888' }}>At least 8 characters, with a letter and a number.</small>
          </>
        )}
        <button className="btn" type="submit" disabled={busy} style={{ width: '100%', marginTop: '15px' }}>
          {busy ? 'Please wait...' : isRegister ? 'Create Account' : 'Sign In'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isRegister ? 'Already have an account?' : 'New here?'}{' '}
        <button type="button" className="link-btn" onClick={switchMode}>
          {isRegister ? 'Sign in' : 'Create an account'}
        </button>
      </p>
    </div>
  );
}
