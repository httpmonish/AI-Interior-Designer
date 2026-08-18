import { useState } from 'react';
import { useRoomStore } from '../../store/useRoomStore';
import { FURNITURE_CATALOG, CATEGORY_LABELS } from '../../data/furnitureCatalog';
import { Plus, Search } from 'lucide-react';
import type { FurnitureCategory } from '../../types';

const CATEGORIES: FurnitureCategory[] = [
  'seating', 'beds', 'tables', 'desks', 'storage',
  'tv-media', 'lighting', 'plants', 'decor', 'kitchen', 'bathroom', 'outdoor',
];

export default function FurnitureLibrary() {
  const { addFurniture } = useRoomStore();
  const [activeCategory, setActiveCategory] = useState<FurnitureCategory>('seating');
  const [search, setSearch] = useState('');

  const filtered = FURNITURE_CATALOG.filter(f => {
    if (search) return f.name.toLowerCase().includes(search.toLowerCase());
    return f.category === activeCategory;
  });

  return (
    <div style={{ padding: 0 }}>
      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }} />
          <input
            className="input-field input-sm"
            style={{ paddingLeft: 30 }}
            placeholder="Search furniture..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Category pills */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 4,
        padding: '8px 12px', borderBottom: '1px solid var(--border)',
      }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`btn-ghost ${activeCategory === cat && !search ? 'active' : ''}`}
            style={{ padding: '4px 8px', fontSize: 11 }}
            onClick={() => { setActiveCategory(cat); setSearch(''); }}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Items */}
      <div style={{ padding: 8 }}>
        {filtered.map(template => (
          <div
            key={template.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 10px', borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)', marginBottom: 6,
              background: 'var(--bg-tertiary)',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
            }}
            onClick={() => addFurniture(template)}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 'var(--radius-sm)',
                background: template.color, marginBottom: 4, opacity: 0.7,
                border: '1px solid var(--border)',
              }} />
              <div style={{ fontSize: 12, fontWeight: 600 }}>{template.name}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                {template.dimensions.width} × {template.dimensions.depth} × {template.dimensions.height} cm
              </div>
            </div>
            <button className="btn-ghost" style={{ padding: '6px 10px', fontSize: 11 }}>
              <Plus size={14} /> Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
