'use client';

import { useState } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { exportCanvasToPNG, exportStateToJSON } from '../utils/exportUtils';

const PRESETS = [
  { key: 'masterBedroom',    label: '🛏  Master Bedroom' },
  { key: 'modernLivingRoom', label: '🛋  Modern Living Room' },
  { key: 'compactHomeOffice',label: '💼  Compact Home Office' },
  { key: 'messyLayout',      label: '🔥  Messy Layout (Fix Me)' },
];

export default function Header() {
  const { roomType, isOptimizing, triggerAIOptimize, loadPreset, furniture, features, width, length } = useRoomStore();
  const [selectedPreset, setSelectedPreset] = useState('masterBedroom');
  const [isExporting, setIsExporting] = useState(false);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const key = e.target.value;
    setSelectedPreset(key);
    loadPreset(key);
  };

  const handleExportPNG = async () => {
    setIsExporting(true);
    await exportCanvasToPNG('floorplan-canvas', `${roomType.toLowerCase().replace(/\s+/g, '-')}-blueprint.png`);
    setIsExporting(false);
  };

  const handleExportJSON = () => {
    exportStateToJSON({ roomType, width, length, features, furniture, selectedId: null }, `${roomType.toLowerCase().replace(/\s+/g, '-')}-config.json`);
  };

  const handleClearAll = () => {
    const store = useRoomStore.getState();
    furniture.forEach(f => store.removeFurniture(f.id));
    features.forEach(f => store.removeFeature(f.id));
  };

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-zinc-800 bg-zinc-950 z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <div>
          <span className="text-sm font-bold text-white tracking-tight">RoomCraft</span>
          <span className="text-sm font-bold text-indigo-400 tracking-tight"> AI</span>
        </div>
        <div className="ml-1 text-xs text-zinc-600 font-medium hidden md:block">2D Floorplan Optimizer</div>
      </div>

      {/* Center – Preset Switcher */}
      <div className="flex items-center gap-2">
        <label className="text-xs text-zinc-500 font-medium hidden md:block">Preset:</label>
        <select
          value={selectedPreset}
          onChange={handlePresetChange}
          className="text-xs bg-zinc-900 border border-zinc-700 text-zinc-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
        >
          {PRESETS.map(p => (
            <option key={p.key} value={p.key}>{p.label}</option>
          ))}
        </select>
      </div>

      {/* Right – Actions */}
      <div className="flex items-center gap-2">
        {/* AI Auto-Arrange – Primary CTA */}
        <button
          onClick={triggerAIOptimize}
          disabled={isOptimizing}
          className="ai-btn-gradient flex items-center gap-2 px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isOptimizing ? (
            <>
              <svg className="spinner w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              Optimizing…
            </>
          ) : (
            <>✨ AI Auto-Arrange</>
          )}
        </button>

        {/* Secondary actions */}
        <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-2 ml-1">
          <button
            onClick={handleClearAll}
            className="text-xs text-zinc-400 hover:text-red-400 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 font-medium transition-colors"
            title="Clear all furniture"
          >
            Clear All
          </button>
          <button
            onClick={() => loadPreset(selectedPreset)}
            className="text-xs text-zinc-400 hover:text-zinc-100 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 font-medium transition-colors"
            title="Reset to preset"
          >
            Reset
          </button>

          {/* Export dropdown */}
          <div className="relative group">
            <button
              disabled={isExporting}
              className="text-xs text-zinc-400 hover:text-zinc-100 px-2.5 py-1.5 rounded-md hover:bg-zinc-800 font-medium transition-colors flex items-center gap-1 disabled:opacity-50"
            >
              Export
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl py-1 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
              <button
                onClick={handleExportPNG}
                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                🖼  Export as PNG
              </button>
              <button
                onClick={handleExportJSON}
                className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                📄  Export as JSON
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
