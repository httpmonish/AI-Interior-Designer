'use client';

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRoomStore } from '../store/useRoomStore';
import { FurnitureItem, ArchitecturalFeature, WallType } from '../types/room';

// ─── Furniture catalog data ───────────────────────────────────────────────────
type CatalogEntry = {
  name: string;
  type: FurnitureItem['type'];
  width: number;
  depth: number;
  emoji: string;
};

const CATALOG: Record<string, CatalogEntry[]> = {
  'Living Room': [
    { name: '3-Seater Sofa',   type: 'sofa',         width: 2.4, depth: 0.9, emoji: '🛋' },
    { name: 'Loveseat',        type: 'sofa',         width: 1.6, depth: 0.8, emoji: '🛋' },
    { name: 'Coffee Table',    type: 'coffee_table', width: 1.2, depth: 0.6, emoji: '🪵' },
    { name: 'TV Unit',         type: 'tv_stand',     width: 2.0, depth: 0.45, emoji: '📺' },
    { name: 'Dining Table',    type: 'dining_table', width: 1.8, depth: 0.9, emoji: '🍽' },
    { name: 'Plant',           type: 'plant',        width: 0.5, depth: 0.5, emoji: '🪴' },
  ],
  'Bedroom': [
    { name: 'King Bed',        type: 'bed',      width: 2.0, depth: 2.0, emoji: '🛏' },
    { name: 'Queen Bed',       type: 'bed',      width: 1.6, depth: 2.0, emoji: '🛏' },
    { name: 'Single Bed',      type: 'bed',      width: 0.9, depth: 2.0, emoji: '🛏' },
    { name: 'Wardrobe',        type: 'wardrobe', width: 1.5, depth: 0.6, emoji: '🚪' },
    { name: 'Nightstand',      type: 'coffee_table', width: 0.5, depth: 0.4, emoji: '🕯' },
    { name: 'Dresser',         type: 'desk',     width: 1.2, depth: 0.5, emoji: '🗄' },
  ],
  'Office': [
    { name: 'Standing Desk',   type: 'desk',    width: 1.4, depth: 0.7, emoji: '🖥' },
    { name: 'L-Shape Desk',    type: 'desk',    width: 2.0, depth: 1.2, emoji: '🖥' },
    { name: 'Office Chair',    type: 'chair',   width: 0.6, depth: 0.6, emoji: '🪑' },
    { name: 'Bookshelf',       type: 'wardrobe',width: 1.0, depth: 0.3, emoji: '📚' },
    { name: 'Filing Cabinet',  type: 'wardrobe',width: 0.5, depth: 0.5, emoji: '🗃' },
  ],
  'Decor': [
    { name: 'Floor Lamp',      type: 'plant',   width: 0.3, depth: 0.3, emoji: '💡' },
    { name: 'Armchair',        type: 'chair',   width: 0.8, depth: 0.8, emoji: '🪑' },
    { name: 'Side Table',      type: 'coffee_table', width: 0.5, depth: 0.5, emoji: '🪵' },
    { name: 'Indoor Plant',    type: 'plant',   width: 0.4, depth: 0.4, emoji: '🌿' },
  ],
};

const WALLS: { label: string; value: WallType }[] = [
  { label: 'N', value: 'north' },
  { label: 'S', value: 'south' },
  { label: 'E', value: 'east' },
  { label: 'W', value: 'west' },
];

function toFt(m: number) { return (m * 3.28084).toFixed(1); }

// ─── Sub-component: Section Header ───────────────────────────────────────────
function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest">{children}</span>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
  );
}

// ─── Sub-component: Number Stepper ───────────────────────────────────────────
function NumberStepper({
  label, value, min, max, step, unit, onChange,
}: {
  label: string; value: number; min: number; max: number; step: number; unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-zinc-300 font-medium w-12">{label}</span>
      <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg overflow-hidden">
        <button
          onClick={() => onChange(Math.max(min, parseFloat((value - step).toFixed(1))))}
          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-bold"
        >−</button>
        <span className="w-16 text-center text-xs font-semibold text-zinc-100">{value}{unit}</span>
        <button
          onClick={() => onChange(Math.min(max, parseFloat((value + step).toFixed(1))))}
          className="w-7 h-7 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-bold"
        >+</button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeftConfigPanel() {
  const {
    width, length, features, furniture,
    setRoomDimensions, addFeature, removeFeature, addFurniture,
  } = useRoomStore();

  const [unit, setUnit] = useState<'m' | 'ft'>('m');
  const [activeTab, setActiveTab] = useState('Living Room');

  // Custom furniture form state
  const [customName, setCustomName] = useState('');
  const [customWidth, setCustomWidth] = useState(1.0);
  const [customDepth, setCustomDepth] = useState(1.0);
  const [customColor, setCustomColor] = useState('#6366f1');
  const [showCustom, setShowCustom] = useState(false);

  // Add obstacle state
  const [obstacleType, setObstacleType] = useState<'door' | 'window'>('door');
  const [obstacleWall, setObstacleWall] = useState<WallType>('north');
  const [obstacleOffset, setObstacleOffset] = useState(0.5);
  const [obstacleWidth, setObstacleWidth] = useState(0.9);

  const displayVal = (m: number) => unit === 'm' ? `${m}m` : `${toFt(m)}ft`;

  const handleAddFurniture = (entry: CatalogEntry) => {
    const item: FurnitureItem = {
      id: uuidv4(),
      name: entry.name,
      type: entry.type,
      width: entry.width,
      depth: entry.depth,
      x: parseFloat((width / 2 - entry.width / 2).toFixed(2)),
      y: parseFloat((length / 2 - entry.depth / 2).toFixed(2)),
      rotation: 0,
    };
    addFurniture(item);
  };

  const handleAddCustomFurniture = () => {
    if (!customName.trim()) return;
    const item: FurnitureItem = {
      id: uuidv4(),
      name: customName.trim(),
      type: 'chair',
      width: customWidth,
      depth: customDepth,
      x: parseFloat((width / 2 - customWidth / 2).toFixed(2)),
      y: parseFloat((length / 2 - customDepth / 2).toFixed(2)),
      rotation: 0,
      color: customColor,
    };
    addFurniture(item);
    setCustomName('');
    setShowCustom(false);
  };

  const handleAddObstacle = () => {
    const feature: ArchitecturalFeature = {
      id: uuidv4(),
      type: obstacleType,
      wall: obstacleWall,
      offset: obstacleOffset,
      width: obstacleWidth,
    };
    addFeature(feature);
  };

  return (
    <aside className="w-72 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* ── Room Geometry ── */}
        <section className="fade-in">
          <SectionHeader>Room Geometry</SectionHeader>
          <div className="space-y-2.5">
            {/* Unit toggle */}
            <div className="flex justify-end mb-1">
              <div className="flex bg-zinc-900 border border-zinc-800 rounded-md p-0.5 text-[11px]">
                {(['m', 'ft'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setUnit(u)}
                    className={`px-2.5 py-1 rounded font-medium transition-colors ${unit === u ? 'bg-indigo-600 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >{u}</button>
                ))}
              </div>
            </div>

            <NumberStepper
              label="Width" value={width} min={2} max={10} step={0.1}
              unit={unit === 'm' ? 'm' : 'ft'}
              onChange={(v) => setRoomDimensions(v, length)}
            />
            <NumberStepper
              label="Length" value={length} min={2} max={10} step={0.1}
              unit={unit === 'm' ? 'm' : 'ft'}
              onChange={(v) => setRoomDimensions(width, v)}
            />

            {/* Room area info */}
            <div className="bg-zinc-900 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-[11px] text-zinc-500">Floor area</span>
              <span className="text-[11px] font-semibold text-zinc-300">{(width * length).toFixed(1)} m²</span>
            </div>
          </div>
        </section>

        {/* ── Obstacles (Doors & Windows) ── */}
        <section className="fade-in">
          <SectionHeader>Doors & Windows</SectionHeader>

          {/* Add obstacle form */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5 mb-3">
            {/* Type selector */}
            <div className="flex gap-1.5">
              {(['door', 'window'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setObstacleType(t)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${obstacleType === t
                    ? t === 'door'
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                    : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {t === 'door' ? '🚪' : '🪟'} {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>

            {/* Wall selector */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-zinc-500 w-10">Wall</span>
              <div className="flex gap-1.5 flex-1">
                {WALLS.map(w => (
                  <button
                    key={w.value}
                    onClick={() => setObstacleWall(w.value)}
                    className={`flex-1 py-1 rounded-md text-[11px] font-semibold border transition-colors ${obstacleWall === w.value ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-zinc-700 text-zinc-500 hover:text-zinc-200'}`}
                  >{w.label}</button>
                ))}
              </div>
            </div>

            {/* Offset + Width */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Offset</label>
                <input
                  type="number" min={0} max={10} step={0.1} value={obstacleOffset}
                  onChange={e => setObstacleOffset(parseFloat(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Width</label>
                <input
                  type="number" min={0.3} max={3} step={0.1} value={obstacleWidth}
                  onChange={e => setObstacleWidth(parseFloat(e.target.value))}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              onClick={handleAddObstacle}
              className="w-full py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-700 transition-colors"
            >
              + Add {obstacleType === 'door' ? '🚪' : '🪟'}
            </button>
          </div>

          {/* Active features list */}
          {features.length === 0 ? (
            <p className="text-[11px] text-zinc-600 text-center py-2">No doors or windows added</p>
          ) : (
            <div className="space-y-1.5">
              {features.map(f => (
                <div key={f.id} className="flex items-center justify-between bg-zinc-900 rounded-lg px-3 py-2 group">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{f.type === 'door' ? '🚪' : '🪟'}</span>
                    <div>
                      <span className="text-[11px] font-medium text-zinc-300 capitalize">{f.type}</span>
                      <span className="text-[11px] text-zinc-600 ml-1.5">{f.wall[0].toUpperCase()} wall · {f.width}m</span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFeature(f.id)}
                    className="text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 text-lg leading-none"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Furniture Catalog ── */}
        <section className="fade-in">
          <SectionHeader>Furniture Catalog</SectionHeader>

          {/* Category tabs */}
          <div className="flex gap-1 mb-3 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
            {Object.keys(CATALOG).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1 rounded-md text-[10px] font-semibold transition-colors ${activeTab === tab ? 'bg-zinc-700 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                {tab.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Items grid */}
          <div className="grid grid-cols-1 gap-1.5">
            {CATALOG[activeTab].map(entry => (
              <button
                key={entry.name}
                onClick={() => handleAddFurniture(entry)}
                className="flex items-center gap-3 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-600/50 hover:bg-zinc-800 transition-all group text-left"
              >
                <span className="text-xl w-7 text-center">{entry.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-200 group-hover:text-white truncate">{entry.name}</div>
                  <div className="text-[10px] text-zinc-600">{entry.width}m × {entry.depth}m</div>
                </div>
                <svg className="w-3.5 h-3.5 text-zinc-700 group-hover:text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </button>
            ))}
          </div>

          {/* Active furniture count */}
          {furniture.length > 0 && (
            <div className="mt-2 text-center text-[10px] text-zinc-600">
              {furniture.length} item{furniture.length !== 1 ? 's' : ''} on canvas
            </div>
          )}
        </section>

        {/* ── Custom Furniture ── */}
        <section className="fade-in">
          <button
            onClick={() => setShowCustom(v => !v)}
            className="flex items-center gap-2 w-full text-[11px] text-zinc-500 hover:text-zinc-300 font-medium transition-colors"
          >
            <svg className={`w-3 h-3 transition-transform ${showCustom ? 'rotate-90' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
            Custom Furniture
          </button>
          {showCustom && (
            <div className="mt-2 bg-zinc-900 border border-zinc-800 rounded-xl p-3 space-y-2.5 fade-in">
              <div>
                <label className="text-[11px] text-zinc-500 block mb-1">Name</label>
                <input
                  type="text" value={customName} placeholder="e.g. Piano"
                  onChange={e => setCustomName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-1">Width (m)</label>
                  <input type="number" min={0.2} max={5} step={0.1} value={customWidth}
                    onChange={e => setCustomWidth(parseFloat(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
                <div>
                  <label className="text-[11px] text-zinc-500 block mb-1">Depth (m)</label>
                  <input type="number" min={0.2} max={5} step={0.1} value={customDepth}
                    onChange={e => setCustomDepth(parseFloat(e.target.value))}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-[11px] text-zinc-500">Color</label>
                <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
                  className="w-8 h-7 rounded cursor-pointer border-0 bg-transparent" />
                <span className="text-[11px] text-zinc-500 font-mono">{customColor}</span>
              </div>
              <button
                onClick={handleAddCustomFurniture}
                disabled={!customName.trim()}
                className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium transition-colors"
              >
                Add to Canvas
              </button>
            </div>
          )}
        </section>

        <div className="pb-4" />
      </div>
    </aside>
  );
}
