import { useRoomStore } from '../../store/useRoomStore';
import {
  Box, MousePointer2, Move, RotateCw, Maximize2, Orbit,
  Ruler, Undo2, Redo2, Save, Download, Sparkles, Hand,
  PanelLeftClose, PanelRightClose, PanelLeft, PanelRight,
  Home,
} from 'lucide-react';
import type { ActiveTool } from '../../types';

export default function TopToolbar() {
  const {
    projectName, setProjectName, viewMode, setViewMode,
    activeTool, setActiveTool, designerMode, setDesignerMode,
    undo, redo, undoStack, redoStack,
    saveProject, runOptimization, isOptimizing,
    setPage, leftSidebarOpen, rightSidebarOpen, rightPanel,
    toggleLeftSidebar, toggleRightSidebar,
  } = useRoomStore();

  const tools: { tool: ActiveTool; icon: React.ReactNode; label: string }[] = [
    { tool: 'select', icon: <MousePointer2 size={16} />, label: 'Select' },
    { tool: 'move', icon: <Move size={16} />, label: 'Move' },
    { tool: 'rotate', icon: <RotateCw size={16} />, label: 'Rotate' },
    { tool: 'scale', icon: <Maximize2 size={16} />, label: 'Scale' },
    { tool: 'orbit', icon: <Orbit size={16} />, label: 'Orbit' },
    { tool: 'measure', icon: <Ruler size={16} />, label: 'Measure' },
  ];

  const handleExport = () => {
    const state = useRoomStore.getState();
    const data = {
      name: state.projectName,
      rooms: state.rooms,
      furniture: state.furniture,
      lifestyle: state.lifestyle,
      style: state.selectedStyle,
      score: state.designScore,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectName.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: 48,
      background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)',
      padding: '0 12px', gap: 8, flexShrink: 0,
    }}>
      {/* Logo + Home */}
      <button className="btn-ghost" onClick={() => setPage('landing')} title="Home">
        <Home size={16} />
      </button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
        <Box size={18} style={{ color: 'var(--accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 14 }} className="logo-gradient">RoomMind</span>
      </div>

      {/* Project name */}
      <input
        className="input-field input-sm"
        style={{ width: 160, background: 'transparent', border: 'none' }}
        value={projectName}
        onChange={e => setProjectName(e.target.value)}
      />

      <div className="divider" style={{ width: 1, height: 24, margin: '0 4px' }} />

      {/* Sidebar toggles */}
      <button className="btn-icon" onClick={toggleLeftSidebar} title="Toggle Left Panel">
        {leftSidebarOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
      </button>
      <button className="btn-icon" onClick={toggleRightSidebar} title="Toggle Right Panel">
        {rightSidebarOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
      </button>

      <div className="divider" style={{ width: 1, height: 24, margin: '0 4px' }} />

      {/* View mode */}
      <div style={{
        display: 'flex', background: 'var(--bg-primary)',
        borderRadius: 'var(--radius-sm)', padding: 2, border: '1px solid var(--border)',
      }}>
        <button
          className="btn-ghost"
          style={{
            padding: '4px 12px', fontSize: 12, borderRadius: 4,
            ...(viewMode === '2d' ? { background: 'var(--accent-subtle)', color: 'var(--accent)' } : {}),
          }}
          onClick={() => setViewMode('2d')}
        >2D</button>
        <button
          className="btn-ghost"
          style={{
            padding: '4px 12px', fontSize: 12, borderRadius: 4,
            ...(viewMode === '3d' ? { background: 'var(--accent-subtle)', color: 'var(--accent)' } : {}),
          }}
          onClick={() => setViewMode('3d')}
        >3D</button>
      </div>

      <div className="divider" style={{ width: 1, height: 24, margin: '0 4px' }} />

      {/* Tools */}
      <div style={{ display: 'flex', gap: 2 }}>
        {tools.map(t => (
          <button
            key={t.tool}
            className={`btn-icon ${activeTool === t.tool ? 'active' : ''}`}
            onClick={() => setActiveTool(t.tool)}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div className="divider" style={{ width: 1, height: 24, margin: '0 4px' }} />

      {/* Undo / Redo */}
      <button className="btn-icon" onClick={undo} disabled={undoStack.length === 0} title="Undo"
        style={{ opacity: undoStack.length === 0 ? 0.3 : 1 }}>
        <Undo2 size={16} />
      </button>
      <button className="btn-icon" onClick={redo} disabled={redoStack.length === 0} title="Redo"
        style={{ opacity: redoStack.length === 0 ? 0.3 : 1 }}>
        <Redo2 size={16} />
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Save / Export */}
      <button className="btn-icon" onClick={saveProject} title="Save">
        <Save size={16} />
      </button>
      <button className="btn-icon" onClick={handleExport} title="Export JSON">
        <Download size={16} />
      </button>

      <div className="divider" style={{ width: 1, height: 24, margin: '0 8px' }} />

      {/* AI Optimizer Toggle */}
      <button
        className={rightPanel === 'ai-assistant' && rightSidebarOpen ? 'btn-primary' : 'btn-secondary'}
        style={{ padding: '6px 16px', fontSize: 13, marginRight: 8, borderRadius: 'var(--radius-xl)' }}
        onClick={() => {
          if (rightPanel === 'ai-assistant' && rightSidebarOpen) {
            useRoomStore.getState().toggleRightSidebar();
          } else {
            if (!rightSidebarOpen) useRoomStore.getState().toggleRightSidebar();
            useRoomStore.getState().setRightPanel('ai-assistant');
          }
        }}
      >
        <Sparkles size={14} />
        {rightPanel === 'ai-assistant' && rightSidebarOpen ? 'Close AI Optimizer' : 'Open AI Optimizer'}
      </button>

      {/* User Profile */}
      <div style={{ position: 'relative' }}>
        <button 
          className="btn-icon"
          style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', color: 'white', fontWeight: 600, fontSize: 13, border: 'none' }}
          onClick={() => {
            const el = document.getElementById('user-dropdown');
            if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
          }}
        >
          U
        </button>
        <div id="user-dropdown" style={{ display: 'none', position: 'absolute', top: 40, right: 0, width: 200, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: 12, boxShadow: 'var(--shadow-lg)', zIndex: 1000 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>User Account</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12 }}>user@example.com</div>
          <button 
            className="btn-danger" 
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={() => {
               localStorage.removeItem('roommind-auth');
               window.location.reload();
            }}
          >
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
