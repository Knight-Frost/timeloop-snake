import React from 'react';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem 1rem' },
  h2: { color: '#7fff7f', marginBottom: '1rem' },
  note: { color: '#a0a0c0', fontSize: '0.85rem', marginBottom: '1rem' },
  frame: { border: 'none', borderRadius: '8px', background: '#0a0a0f' }
};

export default function Game() {
  const { user } = useAuth();

  return (
    <div style={s.wrap}>
      <h2 style={s.h2}>Time Loop Snake</h2>
      <p style={s.note}>Playing as {user?.email} — scores are saved automatically on game over.</p>
      <iframe
        src="/game/index.html"
        width="820"
        height="620"
        style={s.frame}
        title="Time Loop Snake"
      />
    </div>
  );
}
