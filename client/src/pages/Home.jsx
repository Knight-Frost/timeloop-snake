import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 56px)', textAlign: 'center', padding: '2rem' },
  h1: { color: '#7fff7f', fontSize: '3rem', marginBottom: '1rem', fontWeight: 800 },
  sub: { color: '#a0a0c0', fontSize: '1.1rem', maxWidth: '500px', lineHeight: '1.6', marginBottom: '2rem' },
  btnRow: { display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' },
  btnPrimary: { background: '#7fff7f', color: '#0a0a0f', padding: '12px 32px', borderRadius: '6px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' },
  btnSecondary: { background: 'transparent', color: '#7fff7f', border: '1px solid #7fff7f', padding: '12px 32px', borderRadius: '6px', fontWeight: 700, fontSize: '1rem', textDecoration: 'none' }
};

export default function Home() {
  const { user } = useAuth();
  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Time Loop Snake</h1>
      <p style={s.sub}>Classic Snake with a twist — every 14 seconds a ghost of your past self appears and hunts you. Survive your own history.</p>
      <div style={s.btnRow}>
        {user ? (
          <Link to="/play" style={s.btnPrimary}>Play Now</Link>
        ) : (
          <Link to="/register" style={s.btnPrimary}>Get Started</Link>
        )}
        <Link to="/leaderboard" style={s.btnSecondary}>Leaderboard</Link>
      </div>
    </div>
  );
}
