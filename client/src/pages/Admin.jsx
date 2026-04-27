import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

const s = {
  wrap: { maxWidth: '900px', margin: '2rem auto', padding: '0 1rem' },
  h1: { color: '#7fff7f', marginBottom: '2rem' },
  h2: { color: '#a0a0c0', marginBottom: '1rem', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' },
  section: { background: '#12121a', border: '1px solid #2a2a3a', borderRadius: '8px', padding: '1.5rem', marginBottom: '2rem' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { padding: '10px 12px', textAlign: 'left', color: '#7fff7f', fontSize: '0.8rem', textTransform: 'uppercase', borderBottom: '1px solid #2a2a3a' },
  td: { padding: '10px 12px', borderBottom: '1px solid #1a1a2a', color: '#e0e0e0', fontSize: '0.9rem' },
  delBtn: { background: 'transparent', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' },
  empty: { color: '#a0a0c0', fontSize: '0.9rem' }
};

export default function Admin() {
  const { authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    authFetch('/api/admin/users').then(r => r.json()).then(setUsers);
    fetch('/api/scores').then(r => r.json()).then(setScores);
  }, []);

  async function deleteUser(id) {
    if (!confirm('Delete this user?')) return;
    await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setUsers(u => u.filter(x => x.id !== id));
  }

  async function deleteScore(id) {
    if (!confirm('Delete this score?')) return;
    await authFetch(`/api/admin/scores/${id}`, { method: 'DELETE' });
    setScores(s => s.filter(x => x.id !== id));
  }

  return (
    <div style={s.wrap}>
      <h1 style={s.h1}>Admin Panel</h1>

      <div style={s.section}>
        <h2 style={s.h2}>Users ({users.length})</h2>
        {users.length === 0 ? <p style={s.empty}>No users.</p> : (
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Email</th>
              <th style={s.th}>Role</th>
              <th style={s.th}>Joined</th>
              <th style={s.th}></th>
            </tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>{u.role}</td>
                  <td style={s.td}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td style={s.td}><button style={s.delBtn} onClick={() => deleteUser(u.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={s.section}>
        <h2 style={s.h2}>All Scores ({scores.length})</h2>
        {scores.length === 0 ? <p style={s.empty}>No scores.</p> : (
          <table style={s.table}>
            <thead><tr>
              <th style={s.th}>Player</th>
              <th style={s.th}>Score</th>
              <th style={s.th}>Loops</th>
              <th style={s.th}></th>
            </tr></thead>
            <tbody>
              {scores.map(entry => (
                <tr key={entry.id}>
                  <td style={s.td}>{entry.user?.email?.split('@')[0] ?? '-'}</td>
                  <td style={s.td}>{entry.score}</td>
                  <td style={s.td}>{entry.loops_survived}</td>
                  <td style={s.td}><button style={s.delBtn} onClick={() => deleteScore(entry.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
