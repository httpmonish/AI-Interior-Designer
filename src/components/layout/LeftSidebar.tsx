import { useRoomStore } from '../../store/useRoomStore';
import {
  LayoutDashboard, FolderOpen, Plus, Settings2, Sofa,
  Palette, Sparkles, ChevronDown
} from 'lucide-react';
import FurnitureLibrary from '../panels/FurnitureLibrary';
import MaterialsPanel from '../panels/MaterialsPanel';
import RoomSettingsPanel from '../panels/RoomSettingsPanel';
import type { LeftPanelView } from '../../types';

export default function LeftSidebar() {
  const {
    leftPanel, setLeftPanel, setPage, createNewProject, rooms, activeRoomId, setActiveRoom,
  } = useRoomStore();

  const navItems: { id: LeftPanelView; icon: React.ReactNode; label: string }[] = [
    { id: 'room-setup', icon: <Settings2 size={16} />, label: 'Room Setup' },
    { id: 'furniture', icon: <Sofa size={16} />, label: 'Furniture' },
    { id: 'materials', icon: <Palette size={16} />, label: 'Materials' },
  ];

  return (
    <div style={{
      width: 280, height: '100%', background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
    }} className="animate-slideInLeft">
      {/* Nav tabs */}
      <div style={{
        display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px',
      }}>
        {navItems.map(item => (
          <button
            key={item.id}
            className="btn-ghost"
            style={{
              flex: 1, padding: '10px 4px', fontSize: 11, flexDirection: 'column', gap: 2,
              borderBottom: leftPanel === item.id ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 0, color: leftPanel === item.id ? 'var(--accent)' : undefined,
            }}
            onClick={() => setLeftPanel(item.id)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Room selector */}
      {rooms.length > 1 && (
        <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)' }}>
          <select
            className="input-field input-sm"
            value={activeRoomId}
            onChange={e => setActiveRoom(e.target.value)}
          >
            {rooms.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Panel content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {leftPanel === 'furniture' && <FurnitureLibrary />}
        {leftPanel === 'materials' && <MaterialsPanel />}
        {leftPanel === 'room-setup' && <RoomSettingsPanel />}
      </div>
    </div>
  );
}
