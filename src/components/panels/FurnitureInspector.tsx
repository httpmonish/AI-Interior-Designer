import { useRoomStore } from '../../store/useRoomStore';
import { RotateCw, Copy, Trash2, Crosshair } from 'lucide-react';

export default function FurnitureInspector() {
  const {
    furniture, selectedFurnitureId, updateFurniture,
    removeFurniture, duplicateFurniture, rotateFurniture90,
  } = useRoomStore();

  const selected = furniture.find(f => f.id === selectedFurnitureId);

  if (!selected) {
    return (
      <div style={{ padding: 20, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Click a furniture item in the 3D scene to inspect it.
        </p>
      </div>
    );
  }

  const updateDim = (key: 'width' | 'depth' | 'height', val: number) => {
    updateFurniture(selected.id, {
      dimensions: { ...selected.dimensions, [key]: val },
    });
  };

  const updatePos = (key: 'x' | 'y' | 'z', val: number) => {
    updateFurniture(selected.id, {
      position: { ...selected.position, [key]: val },
    });
  };

  const updateRot = (key: 'x' | 'y' | 'z', val: number) => {
    updateFurniture(selected.id, {
      rotation: { ...selected.rotation, [key]: val },
    });
  };

  return (
    <div style={{ padding: 12 }} className="animate-fadeIn">
      {/* Header */}
      <div style={{
        padding: '10px 12px', background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-md)', marginBottom: 12,
        border: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: selected.color, opacity: 0.7,
          }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{selected.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{selected.category}</div>
          </div>
        </div>
      </div>

      {/* Dimensions */}
      <SectionLabel>Dimensions (cm)</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
        <NumInput label="W" value={selected.dimensions.width} onChange={v => updateDim('width', v)} />
        <NumInput label="D" value={selected.dimensions.depth} onChange={v => updateDim('depth', v)} />
        <NumInput label="H" value={selected.dimensions.height} onChange={v => updateDim('height', v)} />
      </div>

      {/* Position */}
      <SectionLabel>Position (cm)</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 12 }}>
        <NumInput label="X" value={Math.round(selected.position.x)} onChange={v => updatePos('x', v)} />
        <NumInput label="Y" value={Math.round(selected.position.y)} onChange={v => updatePos('y', v)} />
        <NumInput label="Z" value={Math.round(selected.position.z)} onChange={v => updatePos('z', v)} />
      </div>

      {/* Rotation */}
      <SectionLabel>Rotation (°)</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 16 }}>
        <NumInput label="X" value={Math.round(selected.rotation.x)} onChange={v => updateRot('x', v)} />
        <NumInput label="Y" value={Math.round(selected.rotation.y)} onChange={v => updateRot('y', v)} />
        <NumInput label="Z" value={Math.round(selected.rotation.z)} onChange={v => updateRot('z', v)} />
      </div>

      {/* Color */}
      <SectionLabel>Color</SectionLabel>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <input
          type="color"
          value={selected.color}
          onChange={e => updateFurniture(selected.id, { color: e.target.value })}
          style={{
            width: 32, height: 32, border: '1px solid var(--border)',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'transparent',
          }}
        />
        <input
          className="input-field input-sm"
          value={selected.color}
          onChange={e => updateFurniture(selected.id, { color: e.target.value })}
          style={{ flex: 1 }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => rotateFurniture90(selected.id)}>
          <RotateCw size={14} /> Rotate 90°
        </button>
        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => duplicateFurniture(selected.id)}>
          <Copy size={14} /> Duplicate
        </button>
        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={() => {
          const room = useRoomStore.getState().rooms.find(r => r.id === selected.roomId);
          if (room) {
            updatePos('x', room.position.x + room.dimensions.width / 2 - selected.dimensions.width / 2);
            updatePos('z', room.position.z + room.dimensions.length / 2 - selected.dimensions.depth / 2);
          }
        }}>
          <Crosshair size={14} /> Center
        </button>
        <button className="btn-danger" onClick={() => removeFurniture(selected.id)}>
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
    }}>
      {children}
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <input
        className="input-field input-sm"
        type="number"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%' }}
      />
    </div>
  );
}
