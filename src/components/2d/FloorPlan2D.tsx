import { useRoomStore } from '../../store/useRoomStore';
import { useMemo, useState, useRef } from 'react';

export default function FloorPlan2D({ previewOnly = false }: { previewOnly?: boolean }) {
  const rooms = useRoomStore(s => s.rooms);
  const furniture = useRoomStore(s => s.furniture);
  const selectedId = useRoomStore(s => s.selectedFurnitureId);
  const selectFurniture = useRoomStore(s => s.selectFurniture);
  const updateFurniture = useRoomStore(s => s.updateFurniture);

  // Use active room or first room
  const activeRoomId = useRoomStore(s => s.activeRoomId);
  const room = rooms.find(r => r.id === activeRoomId) || rooms[0];
  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const w = room ? room.dimensions.width : 0;
  const l = room ? room.dimensions.length : 0;

  const gridLines = useMemo(() => {
    const lines = [];
    const step = 25; // 25cm grid as per screenshot
    for (let x = step; x < w; x += step) {
      lines.push(<line key={`vx-${x}`} x1={x} y1={0} x2={x} y2={l} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />);
    }
    for (let y = step; y < l; y += step) {
      lines.push(<line key={`vy-${y}`} x1={0} y1={y} x2={w} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth={1} />);
    }
    return lines;
  }, [w, l]);

  if (!room) return null;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());
    
    // Clamp to room visually (optional)
    const clampedX = Math.max(0, Math.min(w, svgP.x));
    const clampedZ = Math.max(0, Math.min(l, svgP.y));

    const item = furniture.find(f => f.id === draggingId);
    if (item) {
      updateFurniture(draggingId, {
        position: {
          x: room.position.x + clampedX,
          y: item.position.y,
          z: room.position.z + clampedZ
        }
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (draggingId) {
      (e.target as Element).releasePointerCapture(e.pointerId);
      setDraggingId(null);
    }
  };

  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: previewOnly ? 'transparent' : 'var(--bg-primary)', padding: previewOnly ? 0 : 40,
    }}>
      <svg
        ref={svgRef}
        viewBox={`-20 -20 ${w + 40} ${l + 40}`}
        style={{ width: '100%', height: '100%', maxHeight: previewOnly ? 'none' : '80vh', display: 'block', touchAction: 'none' }}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={!previewOnly ? handlePointerMove : undefined}
        onPointerUp={!previewOnly ? handlePointerUp : undefined}
        onPointerLeave={!previewOnly ? handlePointerUp : undefined}
      >
        {/* Room background & Grid */}
        <rect x={0} y={0} width={w} height={l} fill="white" stroke="var(--border)" strokeWidth={2} />
        {gridLines}

        {/* Walls (thick outline) */}
        <rect x={0} y={0} width={w} height={l} fill="none" stroke="var(--text-muted)" strokeWidth={6} />

        {/* Doors (white gap with arc) */}
        {room.doors.map(d => {
          let dx = 0, dy = 0, rot = 0;
          if (d.wall === 'south') { dx = d.position; dy = l; rot = 0; }
          if (d.wall === 'north') { dx = d.position; dy = 0; rot = 180; }
          if (d.wall === 'east') { dx = w; dy = d.position; rot = -90; }
          if (d.wall === 'west') { dx = 0; dy = d.position; rot = 90; }
          
          return (
            <g key={d.id} transform={`translate(${dx}, ${dy}) rotate(${rot})`}>
              {/* Cutout wall */}
              <line x1={0} y1={0} x2={d.width} y2={0} stroke="white" strokeWidth={10} />
              {/* Door swing */}
              <path d={`M 0 0 A ${d.width} ${d.width} 0 0 1 ${d.width} ${-d.width} L 0 ${-d.width} Z`} fill="rgba(181,107,103,0.1)" stroke="var(--terracotta)" strokeWidth={2} />
            </g>
          );
        })}

        {/* Windows (blue gap) */}
        {room.windows.map(wi => {
          let wx = 0, wy = 0, rot = 0;
          if (wi.wall === 'south') { wx = wi.position; wy = l; rot = 0; }
          if (wi.wall === 'north') { wx = wi.position; wy = 0; rot = 0; }
          if (wi.wall === 'east') { wx = w; wy = wi.position; rot = 90; }
          if (wi.wall === 'west') { wx = 0; wy = wi.position; rot = 90; }

          return (
            <g key={wi.id} transform={`translate(${wx}, ${wy}) rotate(${rot})`}>
              <line x1={0} y1={0} x2={wi.width} y2={0} stroke="#A5C8C6" strokeWidth={8} />
            </g>
          );
        })}

        {/* Furniture */}
        {furniture.filter(f => f.roomId === room.id).map(f => {
          const localX = f.position.x - room.position.x;
          const localZ = f.position.z - room.position.z;
          const isSel = f.id === selectedId && !previewOnly;

          let fill = 'var(--accent-subtle)';
          let stroke = 'var(--accent)';
          let text = 'var(--text-primary)';
          
          if (f.category === 'seating') { fill = '#B4C4B5'; stroke = '#687E69'; }
          else if (f.category === 'tables') { fill = '#C9A991'; stroke = '#8F6E55'; }
          else if (f.category === 'storage') { fill = '#9AA59B'; stroke = '#556356'; }
          else if (f.category === 'tv-media') { fill = '#869588'; stroke = '#485649'; }
          else if (f.category === 'lighting') { fill = '#D4A373'; stroke = '#A06D3E'; }

          if (isSel) {
            stroke = 'var(--terracotta)';
            fill = 'var(--terracotta-subtle)';
          }

          return (
            <g 
              key={f.id} 
              transform={`translate(${localX}, ${localZ}) rotate(${f.rotation.y})`}
              onPointerDown={(e) => {
                if (previewOnly) return;
                e.stopPropagation();
                (e.target as Element).setPointerCapture(e.pointerId);
                selectFurniture(f.id);
                setDraggingId(f.id);
              }}
              style={{ cursor: previewOnly ? 'default' : (draggingId === f.id ? 'grabbing' : 'grab') }}
            >
              <rect
                x={-f.dimensions.width / 2}
                y={-f.dimensions.depth / 2}
                width={f.dimensions.width}
                height={f.dimensions.depth}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                rx={8}
              />
              {!previewOnly && (
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={text}
                  fontSize={f.dimensions.width > 50 ? 12 : 8}
                  fontWeight={500}
                  pointerEvents="none"
                >
                  {f.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
