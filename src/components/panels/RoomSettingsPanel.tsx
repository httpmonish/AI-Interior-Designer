import { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';

const roomTypes = [
  'Living Room', 'Bedroom', 'Study',
  'Home Office', 'Dining Room', 'Gaming Room',
  'Kitchen', 'Balcony', 'Bathroom'
];

export default function RoomSettingsPanel() {
  const rooms = useRoomStore(s => s.rooms);
  const activeRoomId = useRoomStore(s => s.activeRoomId);
  const updateRoom = useRoomStore(s => s.updateRoom);

  const room = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const [type, setType] = useState('Living Room');
  
  if (!room) return null;

  const handleDimChange = (dim: 'width' | 'length' | 'height', val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      updateRoom(room.id, { dimensions: { ...room.dimensions, [dim]: num } });
    }
  };

  return (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="form-group">
        <label className="form-label">Room Name</label>
        <input 
          type="text" 
          className="input-field" 
          value={room.name} 
          onChange={e => updateRoom(room.id, { name: e.target.value })} 
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{ marginBottom: 8 }}>Room Type</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {roomTypes.map(rt => (
            <button 
              key={rt} 
              className="btn-secondary" 
              style={{ 
                padding: '6px 8px', fontSize: 11,
                background: type === rt ? 'var(--accent-light)' : 'var(--bg-elevated)',
                borderColor: type === rt ? 'var(--accent)' : 'var(--border)',
                color: type === rt ? 'var(--accent)' : 'var(--text-primary)'
              }}
              onClick={() => setType(rt)}
            >
              {rt}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="form-label" style={{ marginBottom: 12 }}>Dimensions (cm)</label>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Width</label>
            <input type="number" className="input-field input-sm" value={room.dimensions.width} onChange={e => handleDimChange('width', e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Length</label>
            <input type="number" className="input-field input-sm" value={room.dimensions.length} onChange={e => handleDimChange('length', e.target.value)} />
          </div>
        </div>
        <div>
          <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Ceiling Height</label>
          <input type="number" className="input-field input-sm" value={room.dimensions.height} onChange={e => handleDimChange('height', e.target.value)} />
        </div>
      </div>

      <div>
        <label className="form-label" style={{ marginBottom: 12 }}>Position (cm)</label>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>X Offset</label>
            <input 
              type="number" 
              className="input-field input-sm" 
              value={room.position.x} 
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) updateRoom(room.id, { position: { ...room.position, x: val } });
              }} 
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 10, color: 'var(--text-muted)' }}>Z Offset</label>
            <input 
              type="number" 
              className="input-field input-sm" 
              value={room.position.z} 
              onChange={e => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val)) updateRoom(room.id, { position: { ...room.position, z: val } });
              }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
