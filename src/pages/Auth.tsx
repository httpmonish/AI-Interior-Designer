import { useState } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export default function Auth() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const login = useAuthStore(s => s.login);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && email.trim()) {
      login(name, email);
    }
  };

  return (
    <div style={{
      display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        background: 'var(--bg-elevated)', padding: 40, borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)', width: '100%', maxWidth: 400,
        border: '1px solid var(--border)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, justifyContent: 'center' }}>
          <div style={{ width: 12, height: 24, background: 'var(--accent)', borderRadius: 2 }} />
          <div style={{ width: 12, height: 16, background: 'var(--success)', borderRadius: 2 }} />
        </div>
        <h1 style={{ textAlign: 'center', fontSize: 32, marginBottom: 8 }} className="font-serif">
          RoomMind <span style={{ color: 'var(--terracotta)', fontSize: 18, fontStyle: 'italic' }}>AI</span>
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: 32, fontSize: 14 }}>
          Sign in to access your workspace.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Name</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Alex"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="alex@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: 8, padding: '12px' }}>
            Continue to Workspace
          </button>
        </form>
      </div>
    </div>
  );
}
