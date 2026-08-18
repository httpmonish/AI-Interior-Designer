import { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import FloorPlan2D from '../2d/FloorPlan2D';
import { ArrowRight, ArrowLeft, Upload } from 'lucide-react';

const roomTypes = [
  'Living Room', 'Bedroom', 'Study',
  'Home Office', 'Dining Room', 'Gaming Room',
  'Kitchen', 'Balcony', 'Bathroom'
];

export default function RoomSetup() {
  const rooms = useRoomStore(s => s.rooms);
  const activeRoomId = useRoomStore(s => s.activeRoomId);
  const updateRoom = useRoomStore(s => s.updateRoom);
  const setPage = useRoomStore(s => s.setPage);

  const room = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const [name, setName] = useState(room?.name || 'Modern Living Room');
  const [type, setType] = useState('Living Room');
  const [refImage, setRefImage] = useState<string | null>(null);
  
  if (!room) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRefImage(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDimChange = (dim: 'width' | 'length' | 'height', val: string) => {
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      updateRoom(room.id, { dimensions: { ...room.dimensions, [dim]: num } });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ padding: '40px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <h1 className="font-serif" style={{ fontSize: 42, lineHeight: 1.1, color: 'var(--text-primary)' }}>
          Let's understand <br />
          <span style={{ color: 'var(--terracotta)', fontStyle: 'italic' }}>your room.</span>
        </h1>
        <div style={{ display: 'flex', gap: 24, fontSize: 11, fontWeight: 600, letterSpacing: '0.05em' }}>
          <div style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>1</div> SPACE
          </div>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>2</div> OPENINGS
          </div>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</div> LIFESTYLE
          </div>
          <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>4</div> FURNITURE
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ padding: '0 60px', display: 'flex', gap: 40, flex: 1 }}>
        
        {/* Form Left */}
        <div style={{ flex: 1, background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', padding: 40, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 16 }}>STEP 01 / SPACE</div>
          <h2 className="font-serif" style={{ fontSize: 28, marginBottom: 8 }}>Start with the shape of the room.</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 32 }}>Dimensions give RoomMind the boundaries it needs to make practical decisions.</p>

          <div className="form-group">
            <label className="form-label">Room name</label>
            <input type="text" className="input-field" value={name} onChange={e => { setName(e.target.value); updateRoom(room.id, { name: e.target.value }); }} />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 12 }}>Room type</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {roomTypes.map(rt => (
                <button 
                  key={rt} 
                  className="btn-secondary" 
                  style={{ 
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

          <div style={{ display: 'flex', gap: 20, marginTop: 12, marginBottom: 24 }}>
            <div style={{ flex: 1 }}>
              <label className="form-label">Width (cm)</label>
              <input type="number" className="input-field" value={room.dimensions.width} onChange={e => handleDimChange('width', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Length (cm)</label>
              <input type="number" className="input-field" value={room.dimensions.length} onChange={e => handleDimChange('length', e.target.value)} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="form-label">Height (cm)</label>
              <input type="number" className="input-field" value={room.dimensions.height} onChange={e => handleDimChange('height', e.target.value)} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reference Image (Optional)</label>
            <label className="btn-secondary" style={{ width: '100%', padding: '12px', justifyContent: 'center', cursor: 'pointer', borderStyle: 'dashed' }}>
              <Upload size={16} /> Upload Floor Plan or Inspiration
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
            </label>
            {refImage && (
              <div style={{ width: '100%', height: 160, borderRadius: 'var(--radius-md)', overflow: 'hidden', marginTop: 12, border: '1px solid var(--border)' }}>
                <img src={refImage} alt="Reference" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
          </div>
        </div>

        {/* Live Preview Right */}
        <div style={{ flex: 1, background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', color: 'var(--text-primary)' }}>LIVE PREVIEW</div>
          </div>
          <div style={{ flex: 1, position: 'relative' }}>
             <FloorPlan2D />
          </div>
          <div style={{ padding: '24px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>{room.dimensions.width} × {room.dimensions.length} cm</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{type} · {useRoomStore.getState().furniture.filter(f => f.roomId === room.id).length} pieces</div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{ padding: '24px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)' }}>
        <button className="btn-ghost" onClick={() => setPage('landing')}>
          <ArrowLeft size={16} /> Back
        </button>
        <button className="btn-primary" onClick={() => useRoomStore.getState().setPage('designer')}>
          Continue <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
