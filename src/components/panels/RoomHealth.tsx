import { useRoomStore } from '../../store/useRoomStore';
import { CheckCircle2, AlertTriangle, XCircle, Sparkles } from 'lucide-react';

export default function RoomHealth() {
  const { roomHealth, fixHealthIssue: fixIssue } = useRoomStore();

  const ok = roomHealth.filter(h => h.status === 'ok');
  const warnings = roomHealth.filter(h => h.status === 'warning');
  const errors = roomHealth.filter(h => h.status === 'error');

  return (
    <div style={{ padding: 12 }} className="animate-fadeIn">
      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12 }}>Room Health</h3>

      {/* Summary */}
      <div style={{
        display: 'flex', gap: 8, marginBottom: 16,
      }}>
        <div className="badge badge-success"><CheckCircle2 size={12} /> {ok.length} OK</div>
        {warnings.length > 0 && (
          <div className="badge badge-warning"><AlertTriangle size={12} /> {warnings.length} Warning{warnings.length > 1 ? 's' : ''}</div>
        )}
        {errors.length > 0 && (
          <div className="badge badge-error"><XCircle size={12} /> {errors.length} Error{errors.length > 1 ? 's' : ''}</div>
        )}
      </div>

      {/* Checks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Warnings first */}
        {warnings.map(check => (
          <div key={check.id} style={{
            padding: '8px 10px', background: 'rgba(251, 191, 36, 0.06)',
            borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251, 191, 36, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <AlertTriangle size={14} style={{ color: 'var(--warning)' }} />
              <span style={{ fontSize: 12, fontWeight: 600 }}>{check.label}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, paddingLeft: 20 }}>
              ⚠ {check.message}
            </p>
            {check.furnitureId && (
              <button
                className="btn-success"
                style={{ fontSize: 11, padding: '4px 10px', marginLeft: 20 }}
                onClick={() => fixIssue(check.furnitureId!)}
              >
                <Sparkles size={12} /> Fix with AI
              </button>
            )}
          </div>
        ))}

        {/* OK checks */}
        {ok.map(check => (
          <div key={check.id} style={{
            padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6,
            borderRadius: 'var(--radius-sm)',
          }}>
            <CheckCircle2 size={14} style={{ color: 'var(--success)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{check.label}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>{check.message}</span>
          </div>
        ))}
      </div>

      {roomHealth.length === 0 && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
          Add furniture to see health checks.
        </p>
      )}
    </div>
  );
}
