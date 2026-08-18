import { useRoomStore } from '../../store/useRoomStore';

export default function DesignScore() {
  const { designScore } = useRoomStore();

  const metrics = [
    { label: 'Space Efficiency', value: designScore.spaceEfficiency, color: '#8b5cf6' },
    { label: 'Walkability', value: designScore.walkability, color: '#34d399' },
    { label: 'Functionality', value: designScore.functionality, color: '#60a5fa' },
    { label: 'Natural Light', value: designScore.naturalLight, color: '#fbbf24' },
    { label: 'Balance', value: designScore.balance, color: '#f472b6' },
  ];

  return (
    <div style={{ padding: 16 }} className="animate-fadeIn">
      {/* Overall score */}
      <div style={{
        textAlign: 'center', padding: 20,
        background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)', marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
          RoomMind Score
        </div>
        <div className="score-value animate-score" style={{ fontSize: 48, margin: '8px 0' }}>
          {designScore.overall}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>out of 100</div>
      </div>

      {/* Individual metrics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {metrics.map(m => (
          <div key={m.label}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: 12, marginBottom: 4,
            }}>
              <span style={{ color: 'var(--text-secondary)' }}>{m.label}</span>
              <span style={{ fontWeight: 700, color: m.value >= 80 ? 'var(--success)' : m.value >= 60 ? 'var(--warning)' : 'var(--error)' }}>
                {m.value}
              </span>
            </div>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${m.value}%`,
                  background: `linear-gradient(90deg, ${m.color}88, ${m.color})`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
