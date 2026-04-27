import React, { useEffect, useState } from 'react';

const s = {
  wrap: { maxWidth: '700px', margin: '3rem auto', padding: '0 1rem' },
  h1: { color: '#7fff7f', marginBottom: '1.5rem', textAlign: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#12121a', borderRadius: '8px', overflow: 'hidden' },
  th: { padding: '12px 16px', textAlign: 'left', background: '#1a1a2a', color: '#7fff7f', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  td: { padding: '12px 16px', borderBottom: '1px solid #1a1a2a', color: '#e0e0e0', fontSize: '0.95rem' },
  rank: { color: '#7fff7f', fontWeight: 700 },
  empty: { textAlign: 'center', color: '#a0a0c0', padding: '3rem' }
};

export default function Leaderboard() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scores')
      .then(r => r.json())
      .then(data => { setScores(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Leaderboard</h1>
      {loading ? (
        <p style={s.empty}>Loading...</p>
      ) : scores.length === 0 ? (
        <p style={s.empty}>No scores yet. Be the first to play!</p>
      ) : (
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Player</th>
              <th style={s.th}>Score</th>
              <th style={s.th}>Loops</th>
            </tr>
          </thead>
          <tbody>
            {scores.map((entry, i) => (
              <tr key={entry.id}>
                <td style={{ ...s.td, ...s.rank }}>{i + 1}</td>
                <td style={s.td}>{entry.user?.email?.split('@')[0] ?? 'unknown'}</td>
                <td style={s.td}>{entry.score}</td>
                <td style={s.td}>{entry.loops_survived}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
