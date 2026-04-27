import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  nav: { background: '#12121a', borderBottom: '1px solid #2a2a3a', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' },
  brand: { color: '#7fff7f', fontWeight: 700, fontSize: '1.1rem', textDecoration: 'none' },
  links: { display: 'flex', gap: '1.5rem', alignItems: 'center' },
  link: { color: '#a0a0c0', textDecoration: 'none', fontSize: '0.9rem' },
  btn: { background: '#7fff7f', color: '#0a0a0f', border: 'none', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }
};

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav style={s.nav}>
      <Link to="/" style={s.brand}>Time Loop Snake</Link>
      <div style={s.links}>
        <Link to="/leaderboard" style={s.link}>Leaderboard</Link>
        {user ? (
          <>
            <Link to="/play" style={s.link}>Play</Link>
            {user.role === 'admin' && <Link to="/admin" style={s.link}>Admin</Link>}
            <button onClick={handleLogout} style={s.btn}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" style={s.link}>Login</Link>
            <Link to="/register" style={{ ...s.link, ...s.btn }}>Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
