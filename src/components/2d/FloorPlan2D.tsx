import { useRoomStore } from '../../store/useRoomStore';
import { useMemo, useState, useRef } from 'react';

export default function FloorPlan2D({ previewOnly = false }: { previewOnly?: boolean }) {
  const rooms = useRoomStore(s => s.rooms);
  const furniture = useRoomStore(s => s.furniture);
  const selectedId = useRoomStore(s => s.selectedFurnitureId);
  const selectFurniture = useRoomStore(s => s.selectFurniture);
  const updateFurniture = useRoomStore(s => s.updateFurniture);

  const svgRef = useRef<SVGSVGElement>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  // Calculate global bounding box for the entire house
  const bounds = useMemo(() => {
    if (rooms.length === 0) return { minX: 0, maxX: 400, minZ: 0, maxZ: 400, w: 400, h: 400 };
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const r of rooms) {
      minX = Math.min(minX, r.position.x);
      maxX = Math.max(maxX, r.position.x + r.dimensions.width);
      minZ = Math.min(minZ, r.position.z);
      maxZ = Math.max(maxZ, r.position.z + r.dimensions.length);
    }
    return { 
      minX, maxX, minZ, maxZ, 
      w: Math.max(200, maxX - minX), 
      h: Math.max(200, maxZ - minZ) 
    };
  }, [rooms]);

  const gridLines = useMemo(() => {
    const lines = [];
    const step = 25; // 25cm grid
    // Extend grid slightly beyond bounds
    const startX = Math.floor((bounds.minX - 50) / step) * step;
    const endX = Math.ceil((bounds.maxX + 50) / step) * step;
    const startZ = Math.floor((bounds.minZ - 50) / step) * step;
    const endZ = Math.ceil((bounds.maxZ + 50) / step) * step;

    for (let x = startX; x <= endX; x += step) {
      lines.push(<line key={`vx-${x}`} x1={x} y1={startZ} x2={x} y2={endZ} stroke="rgba(0,0,0,0.03)" strokeWidth={1} />);
    }
    for (let z = startZ; z <= endZ; z += step) {
      lines.push(<line key={`vz-${z}`} x1={startX} y1={z} x2={endX} y2={z} stroke="rgba(0,0,0,0.03)" strokeWidth={1} />);
    }
    return lines;
  }, [bounds]);

  if (rooms.length === 0) return null;

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingId || !svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const svgP = pt.matrixTransform(ctm.inverse());
    
    const item = furniture.find(f => f.id === draggingId);
    if (item) {
      const room = rooms.find(r => r.id === item.roomId);
      if (room) {
        // Clamp visually relative to its own room
        const localX = svgP.x - room.position.x;
        const localZ = svgP.y - room.position.z;
        const clampedX = Math.max(0, Math.min(room.dimensions.width, localX));
        const clampedZ = Math.max(0, Math.min(room.dimensions.length, localZ));

        updateFurniture(draggingId, {
          position: {
            x: room.position.x + clampedX,
            y: item.position.y,
            z: room.position.z + clampedZ
          }
        });
      }
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
        viewBox={`${bounds.minX - 40} ${bounds.minZ - 40} ${bounds.w + 80} ${bounds.h + 80}`}
        style={{ width: '100%', height: '100%', maxHeight: previewOnly ? 'none' : '80vh', display: 'block', touchAction: 'none' }}
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={!previewOnly ? handlePointerMove : undefined}
        onPointerUp={!previewOnly ? handlePointerUp : undefined}
        onPointerLeave={!previewOnly ? handlePointerUp : undefined}
      >
        <defs>
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="2" dy="4" stdDeviation="4" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Global Grid */}
        {gridLines}

        {/* Render all rooms */}
        {rooms.map(r => (
          <g key={r.id} transform={`translate(${r.position.x}, ${r.position.z})`}>
            {/* Room Floor */}
            <rect x={0} y={0} width={r.dimensions.width} height={r.dimensions.length} fill="white" />
            
            {/* Thick Architectural Walls */}
            <rect 
              x={0} y={0} width={r.dimensions.width} height={r.dimensions.length} 
              fill="none" stroke="#2C3E50" strokeWidth={6} strokeLinejoin="round" 
            />

            {/* Doors */}
            {r.doors.map(d => {
              let dx = 0, dy = 0, rot = 0;
              if (d.wall === 'south') { dx = d.position; dy = r.dimensions.length; rot = 0; }
              if (d.wall === 'north') { dx = d.position + d.width; dy = 0; rot = 180; }
              if (d.wall === 'east') { dx = r.dimensions.width; dy = d.position; rot = -90; }
              if (d.wall === 'west') { dx = 0; dy = d.position + d.width; rot = 90; }
              
              return (
                <g key={d.id} transform={`translate(${dx}, ${dy}) rotate(${rot})`}>
                  {/* Cutout wall to make it seamless */}
                  <line x1={0} y1={0} x2={d.width} y2={0} stroke="white" strokeWidth={10} />
                  {/* Door leaf */}
                  <line x1={0} y1={0} x2={0} y2={-d.width} stroke="#2C3E50" strokeWidth={3} strokeLinecap="round" />
                  {/* Door swing arc */}
                  <path d={`M 0 ${-d.width} A ${d.width} ${d.width} 0 0 1 ${d.width} 0`} fill="none" stroke="#95A5A6" strokeWidth={1.5} strokeDasharray="4 4" />
                </g>
              );
            })}

            {/* Windows */}
            {r.windows.map(wi => {
              let wx = 0, wy = 0, rot = 0;
              if (wi.wall === 'south') { wx = wi.position; wy = r.dimensions.length; rot = 0; }
              if (wi.wall === 'north') { wx = wi.position; wy = 0; rot = 0; }
              if (wi.wall === 'east') { wx = r.dimensions.width; wy = wi.position; rot = 90; }
              if (wi.wall === 'west') { wx = 0; wy = wi.position; rot = 90; }

              return (
                <g key={wi.id} transform={`translate(${wx}, ${wy}) rotate(${rot})`}>
                  {/* Glass pane */}
                  <line x1={0} y1={0} x2={wi.width} y2={0} stroke="#3498DB" strokeWidth={4} strokeLinecap="butt" />
                  <line x1={0} y1={2} x2={wi.width} y2={2} stroke="white" strokeWidth={1.5} />
                  <line x1={0} y1={-2} x2={wi.width} y2={-2} stroke="white" strokeWidth={1.5} />
                </g>
              );
            })}
          </g>
        ))}

        {/* Render all furniture across all rooms */}
        {furniture.map(f => {
          const isSel = f.id === selectedId && !previewOnly;

          let fill = '#ECF0F1';
          let stroke = '#BDC3C7';
          let text = '#7F8C8D';
          
          if (f.category === 'seating') { fill = '#D4E6F1'; stroke = '#7FB3D5'; text = '#2471A3'; }
          else if (f.category === 'tables') { fill = '#FDEBD0'; stroke = '#F3C57B'; text = '#B9770E'; }
          else if (f.category === 'storage') { fill = '#E8DAEF'; stroke = '#C39BD3'; text = '#76448A'; }
          else if (f.category === 'tv-media') { fill = '#D5D8DC'; stroke = '#85929E'; text = '#2E4053'; }
          else if (f.category === 'lighting') { fill = '#FCF3CF'; stroke = '#F4D03F'; text = '#9A7D0A'; }
          else if (f.category === 'plants') { fill = '#D5F5E3'; stroke = '#7DCEA0'; text = '#1E8449'; }
          else if (f.category === 'beds') { fill = '#EAECEE'; stroke = '#ABB2B9'; text = '#2E4053'; }
          else if (f.category === 'kitchen') { fill = '#F2F4F4'; stroke = '#BFC9CA'; text = '#616A6B'; }
          else if (f.category === 'bathroom') { fill = '#EBF5FB'; stroke = '#AED6F1'; text = '#2874A6'; }

          if (isSel) {
            stroke = 'var(--terracotta)';
            fill = '#FDF1F0';
            text = 'var(--terracotta)';
          }

          const showText = f.dimensions.width > 60 && f.dimensions.depth > 60;

          return (
            <g 
              key={f.id} 
              transform={`translate(${f.position.x}, ${f.position.z}) rotate(${f.rotation.y})`}
              onPointerDown={(e) => {
                if (previewOnly) return;
                e.stopPropagation();
                (e.target as Element).setPointerCapture(e.pointerId);
                selectFurniture(f.id);
                setDraggingId(f.id);
              }}
              style={{ cursor: previewOnly ? 'default' : (draggingId === f.id ? 'grabbing' : 'grab') }}
              filter="url(#drop-shadow)"
            >
              <rect
                x={-f.dimensions.width / 2}
                y={-f.dimensions.depth / 2}
                width={f.dimensions.width}
                height={f.dimensions.depth}
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
                rx={6}
              />
              {!previewOnly && showText && (
                <text
                  x={0}
                  y={0}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={text}
                  fontSize={12}
                  fontWeight={600}
                  fontFamily="Inter, sans-serif"
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
