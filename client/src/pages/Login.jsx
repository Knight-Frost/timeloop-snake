import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 56px)' },
  card: { background: '#12121a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '2rem', width: '100%', maxWidth: '400px' },
  h2: { color: '#7fff7f', marginBottom: '1.5rem', textAlign: 'center' },
  label: { display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: '#a0a0c0' },
  input: { width: '100%', padding: '10px 12px', background: '#1a1a2a', border: '1px solid #2a2a3a', borderRadius: '4px', color: '#e0e0e0', marginBottom: '1rem', fontSize: '0.95rem' },
  btn: { width: '100%', padding: '10px', background: '#7fff7f', color: '#0a0a0f', border: 'none', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' },
  err: { color: '#ff6b6b', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' },
  foot: { textAlign: 'center', marginTop: '1rem', fontSize: '0.85rem', color: '#a0a0c0' },
  footLink: { color: '#7fff7f' }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) return setError(data.error || 'Login failed');
      login(data.token, data.user);
      navigate('/play');
    } catch {
      setError('Network error');
    }
  }

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <h2 style={s.h2}>Login</h2>
        {error && <p style={s.err}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <label style={s.label}>Email</label>
          <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          <label style={s.label}>Password</label>
          <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button style={s.btn} type="submit">Login</button>
        </form>
        <p style={s.foot}>No account? <Link to="/register" style={s.footLink}>Register</Link></p>
      </div>
    </div>
  );
}
