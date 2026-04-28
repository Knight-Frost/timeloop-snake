import React from 'react';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 1rem' },
  note: { color: '#a0a0c0', fontSize: '0.8rem', marginBottom: '0.5rem' },
  frame: {
    border: 'none',
    borderRadius: '8px',
    background: '#0a0a0f',
    display: 'block',
    width: '850px',
    height: '682px',
    maxWidth: '100vw',
    maxHeight: 'calc(100vh - 80px)'
  }
};

export default function Game() {
  const { user } = useAuth();

  return (
    <div style={s.wrap}>
      <p style={s.note}>Playing as {user?.email}. Scores are saved automatically on game over.</p>
      <iframe
        src="/game/index.html"
        style={s.frame}
        title="Time Loop Snake"
      />
    </div>
  );
}
