import { useRoomStore } from '../../store/useRoomStore';
import {
  Orbit, Hand, Move, RotateCw, Ruler, ZoomIn, RotateCcw,
  ArrowUp, Layers, Eye, Footprints, HelpCircle, Box
} from 'lucide-react';
import { useState } from 'react';
import type { CameraView } from '../../types';

export default function FloatingControls() {
  const {
    cameraView, setCameraView, activeTool, setActiveTool,
    showWalkingPaths, toggleWalkingPaths,
  } = useRoomStore();
  const [showHelp, setShowHelp] = useState(false);

  const views: { id: CameraView; label: string; icon: React.ReactNode }[] = [
    { id: 'isometric', label: 'Isometric', icon: <Box size={14} /> },
    { id: 'top', label: 'Top', icon: <ArrowUp size={14} /> },
    { id: 'front', label: 'Front', icon: <Eye size={14} /> },
    { id: 'right', label: 'Right', icon: <Layers size={14} /> },
    { id: 'free', label: 'Free', icon: <Orbit size={14} /> },
  ];

  return (
    <>
      {/* Bottom center floating bar */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, zIndex: 10,
      }}>
        {/* View presets */}
        <div className="glass-panel-sm" style={{ display: 'flex', gap: 2, padding: 4 }}>
          {views.map(v => (
            <button
              key={v.id}
              className={`btn-ghost ${cameraView === v.id ? 'active' : ''}`}
              style={{ padding: '6px 10px', fontSize: 11 }}
              onClick={() => setCameraView(v.id)}
              title={v.label}
            >
              {v.icon}
              <span style={{ marginLeft: 2 }}>{v.label}</span>
            </button>
          ))}
        </div>

        {/* Walking paths toggle */}
        <div className="glass-panel-sm" style={{ padding: 4 }}>
          <button
            className={`btn-ghost ${showWalkingPaths ? 'active' : ''}`}
            style={{ padding: '6px 10px', fontSize: 11 }}
            onClick={toggleWalkingPaths}
            title="Show Walking Paths"
          >
            <Footprints size={14} /> Paths
          </button>
        </div>

        {/* Reset view */}
        <div className="glass-panel-sm" style={{ padding: 4 }}>
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', fontSize: 11 }}
            onClick={() => setCameraView('isometric')}
            title="Reset View"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Help tooltip */}
      <div style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}>
        <button
          className="btn-icon"
          style={{
            background: 'var(--bg-glass)', backdropFilter: 'blur(12px)',
            border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
            width: 32, height: 32,
          }}
          onClick={() => setShowHelp(!showHelp)}
          title="Controls Help"
        >
          <HelpCircle size={14} />
        </button>

        {showHelp && (
          <div className="glass-panel" style={{
            position: 'absolute', bottom: 40, right: 0, padding: 16, width: 220,
          }}>
            <h4 style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>3D Controls</h4>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><strong>Left Drag</strong> — Orbit</div>
              <div><strong>Right Drag</strong> — Pan</div>
              <div><strong>Scroll</strong> — Zoom</div>
              <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--text-primary)' }}>Trackpad</div>
              <div><strong>Two Finger</strong> — Pan</div>
              <div><strong>Pinch</strong> — Zoom</div>
              <div style={{ marginTop: 8, fontWeight: 600, color: 'var(--text-primary)' }}>Selection</div>
              <div><strong>Click</strong> — Select furniture</div>
              <div><strong>Drag</strong> — Move selected</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
