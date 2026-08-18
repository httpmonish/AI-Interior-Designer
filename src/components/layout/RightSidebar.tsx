import { useRoomStore } from '../../store/useRoomStore';
import { Sparkles, SlidersHorizontal, HeartPulse, BarChart3 } from 'lucide-react';
import AIAssistant from '../ai/AIAssistant';
import FurnitureInspector from '../panels/FurnitureInspector';
import RoomHealth from '../panels/RoomHealth';
import DesignScore from '../panels/DesignScore';
import type { RightPanelView } from '../../types';

export default function RightSidebar() {
  const { rightPanel, setRightPanel, selectedFurnitureId } = useRoomStore();

  const tabs: { id: RightPanelView; icon: React.ReactNode; label: string }[] = [
    { id: 'ai-assistant', icon: <Sparkles size={16} />, label: 'AI' },
    { id: 'furniture-inspector', icon: <SlidersHorizontal size={16} />, label: 'Inspector' },
    { id: 'design-score', icon: <BarChart3 size={16} />, label: 'Score' },
    { id: 'room-health', icon: <HeartPulse size={16} />, label: 'Health' },
  ];

  return (
    <div style={{
      width: 320, height: '100%', background: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      flexShrink: 0, overflow: 'hidden',
    }} className="animate-slideInRight">
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 4px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            className="btn-ghost"
            style={{
              flex: 1, padding: '10px 4px', fontSize: 11, flexDirection: 'column', gap: 2,
              borderBottom: rightPanel === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
              borderRadius: 0, color: rightPanel === tab.id ? 'var(--accent)' : undefined,
            }}
            onClick={() => setRightPanel(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {rightPanel === 'ai-assistant' && <AIAssistant />}
        {rightPanel === 'furniture-inspector' && <FurnitureInspector />}
        {rightPanel === 'design-score' && <DesignScore />}
        {rightPanel === 'room-health' && <RoomHealth />}
      </div>
    </div>
  );
}
