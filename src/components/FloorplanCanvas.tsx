"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useRoomStore } from '../store/useRoomStore';
import { FurnitureItem } from '../types/room';

const FURNITURE_COLORS: Record<string, { fill: string; stroke: string; glow: string }> = {
  bed:          { fill: 'rgba(59, 130, 246, 0.22)', stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.45)' },
  sofa:         { fill: 'rgba(16, 185, 129, 0.22)', stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.45)' },
  desk:         { fill: 'rgba(245, 158, 11, 0.22)', stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.45)' },
  wardrobe:     { fill: 'rgba(123, 97, 255, 0.22)', stroke: '#7b61ff', glow: 'rgba(123, 97, 255, 0.45)' },
  tv_stand:     { fill: 'rgba(236, 72, 153, 0.22)', stroke: '#ec4899', glow: 'rgba(236, 72, 153, 0.45)' },
  coffee_table: { fill: 'rgba(20, 184, 166, 0.22)', stroke: '#14b8a6', glow: 'rgba(20, 184, 166, 0.45)' },
  chair:        { fill: 'rgba(99, 102, 241, 0.22)', stroke: '#6366f1', glow: 'rgba(99, 102, 241, 0.45)' },
  plant:        { fill: 'rgba(34, 197, 94, 0.22)',  stroke: '#22c55e', glow: 'rgba(34, 197, 94, 0.45)' },
  dining_table: { fill: 'rgba(234, 179, 8, 0.22)',  stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.45)' },
  default:      { fill: 'rgba(148, 163, 184, 0.22)', stroke: '#94a3b8', glow: 'rgba(148, 163, 184, 0.45)' }
};

const FURNITURE_ICONS: Record<string, string> = {
  bed: '🛏️',
  sofa: '🛋️',
  desk: '💻',
  wardrobe: '🗄️',
  tv_stand: '📺',
  coffee_table: '🧺',
  chair: '🪑',
  plant: '🌱',
  dining_table: '🍽️',
  default: '📦'
};

export default function FloorplanCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const {
    width: roomWidth,
    length: roomLength,
    features,
    furniture,
    selectedId,
    setSelectedId,
    updateFurniture
  } = useRoomStore();

  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Drag interaction state
  const isDraggingRef = useRef(false);
  const dragTargetIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // View scale & pan offset
  const scaleRef = useRef(50); // pixels per meter
  const offsetRef = useRef({ x: 0, y: 0 });

  // Convert CSS canvas coordinates to room meters
  const toRoom = useCallback((cssX: number, cssY: number) => {
    return {
      x: (cssX - offsetRef.current.x) / scaleRef.current,
      y: (cssY - offsetRef.current.y) / scaleRef.current
    };
  }, []);

  // Helper: get effective dimensions taking rotation into account
  const getEffectiveDims = (item: FurnitureItem) => {
    const isRotated = item.rotation === 90 || item.rotation === 270;
    return {
      w: isRotated ? item.depth : item.width,
      h: isRotated ? item.width : item.depth
    };
  };

  // Canvas render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const w = Math.max(rect.width, 200);
    const h = Math.max(rect.height, 200);

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Dynamic scale calculation
    const padding = 64;
    const availW = w - padding * 2;
    const availH = h - padding * 2;
    const baseScale = Math.min(availW / Math.max(roomWidth, 1), availH / Math.max(roomLength, 1));
    scaleRef.current = Math.max(baseScale * zoom, 8);

    const roomPxW = roomWidth * scaleRef.current;
    const roomPxH = roomLength * scaleRef.current;
    const ox = (w - roomPxW) / 2;
    const oy = (h - roomPxH) / 2;
    offsetRef.current = { x: ox, y: oy };

    // 1. Grid Lines
    if (showGrid) {
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
      ctx.beginPath();
      for (let x = 0; x <= roomWidth + 0.01; x += 0.5) {
        const sx = ox + x * scaleRef.current;
        ctx.moveTo(sx, oy);
        ctx.lineTo(sx, oy + roomPxH);
      }
      for (let y = 0; y <= roomLength + 0.01; y += 0.5) {
        const sy = oy + y * scaleRef.current;
        ctx.moveTo(ox, sy);
        ctx.lineTo(ox + roomPxW, sy);
      }
      ctx.stroke();

      // 1-meter major lines
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.beginPath();
      for (let x = 0; x <= roomWidth + 0.01; x += 1) {
        const sx = ox + x * scaleRef.current;
        ctx.moveTo(sx, oy);
        ctx.lineTo(sx, oy + roomPxH);
      }
      for (let y = 0; y <= roomLength + 0.01; y += 1) {
        const sy = oy + y * scaleRef.current;
        ctx.moveTo(ox, sy);
        ctx.lineTo(ox + roomPxW, sy);
      }
      ctx.stroke();
    }

    // 2. Room Floor
    ctx.save();
    ctx.fillStyle = '#111827';
    ctx.shadowColor = 'rgba(0, 212, 255, 0.08)';
    ctx.shadowBlur = 24;
    ctx.fillRect(ox, oy, roomPxW, roomPxH);
    ctx.shadowBlur = 0;
    ctx.restore();

    // 3. Walls
    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 3;
    ctx.strokeRect(ox, oy, roomPxW, roomPxH);

    // Wall Cardinal Labels
    ctx.fillStyle = '#64748b';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NORTH', ox + roomPxW / 2, oy - 14);
    ctx.fillText('SOUTH', ox + roomPxW / 2, oy + roomPxH + 14);
    ctx.fillText('WEST', ox - 18, oy + roomPxH / 2);
    ctx.fillText('EAST', ox + roomPxW + 18, oy + roomPxH / 2);

    // 4. Doors & Windows
    features.forEach((feat) => {
      const featW = feat.width * scaleRef.current;
      const featPos = feat.offset * scaleRef.current;

      if (feat.type === 'door') {
        let dx = ox, dy = oy, arcX = ox, arcY = oy, startA = 0, endA = 0;
        if (feat.wall === 'south') {
          dx = ox + featPos; dy = oy + roomPxH - 3;
          arcX = dx; arcY = oy + roomPxH;
          startA = -Math.PI / 2; endA = 0;
        } else if (feat.wall === 'north') {
          dx = ox + featPos; dy = oy - 3;
          arcX = dx + featW; arcY = oy;
          startA = Math.PI / 2; endA = Math.PI;
        } else if (feat.wall === 'east') {
          dx = ox + roomPxW - 3; dy = oy + featPos;
          arcX = ox + roomPxW; arcY = oy + featPos + featW;
          startA = -Math.PI; endA = -Math.PI / 2;
        } else {
          dx = ox - 3; dy = oy + featPos;
          arcX = ox; arcY = oy + featPos;
          startA = 0; endA = Math.PI / 2;
        }

        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.beginPath();
        ctx.moveTo(arcX, arcY);
        ctx.arc(arcX, arcY, featW, startA, endA);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(arcX, arcY, featW, startA, endA);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText('🚪 Door', dx + featW / 2, dy + (feat.wall === 'south' ? 24 : -18));
      } else {
        // Window
        let wx = ox, wy = oy, ww = featW, wh = 6;
        if (feat.wall === 'north' || feat.wall === 'south') {
          wx = ox + featPos;
          wy = feat.wall === 'north' ? oy - 3 : oy + roomPxH - 3;
        } else {
          wx = feat.wall === 'west' ? ox - 3 : ox + roomPxW - 3;
          wy = oy + featPos;
          ww = 6;
          wh = featW;
        }

        ctx.fillStyle = 'rgba(123, 97, 255, 0.35)';
        ctx.fillRect(wx, wy, ww, wh);
        ctx.strokeStyle = '#7b61ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(wx, wy, ww, wh);

        ctx.fillStyle = '#a78bfa';
        ctx.font = '600 10px Inter, sans-serif';
        ctx.fillText('🪟 Window', wx + ww / 2, wy + (feat.wall === 'south' ? 24 : -18));
      }
    });

    // 5. Furniture Items
    furniture.forEach((item) => {
      const isSelected = item.id === selectedId;
      const isHovered = item.id === hoveredId;
      const palette = FURNITURE_COLORS[item.type] || FURNITURE_COLORS.default;
      const icon = FURNITURE_ICONS[item.type] || FURNITURE_ICONS.default;
      const dims = getEffectiveDims(item);

      const fw = dims.w * scaleRef.current;
      const fh = dims.h * scaleRef.current;
      const fx = ox + item.x * scaleRef.current;
      const fy = oy + item.y * scaleRef.current;

      ctx.save();

      if (isSelected) {
        ctx.shadowColor = palette.glow;
        ctx.shadowBlur = 16;
      }

      ctx.fillStyle = isSelected
        ? 'rgba(0, 212, 255, 0.24)'
        : isHovered
          ? 'rgba(0, 212, 255, 0.12)'
          : palette.fill;

      ctx.strokeStyle = isSelected
        ? '#00d4ff'
        : isHovered
          ? 'rgba(0, 212, 255, 0.8)'
          : palette.stroke;

      ctx.lineWidth = isSelected ? 2.5 : isHovered ? 2 : 1.5;

      const r = Math.min(6, fw * 0.1, fh * 0.1);
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(fx, fy, fw, fh, r);
      } else {
        ctx.rect(fx, fy, fw, fh);
      }
      ctx.fill();
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Color banner bar
      ctx.fillStyle = palette.stroke;
      ctx.fillRect(fx + 2, fy + 2, Math.max(fw - 4, 1), 3);

      // Icon & Name rendering
      const minDim = Math.min(fw, fh);
      if (minDim >= 22) {
        const iconSize = Math.max(12, Math.min(22, minDim * 0.38));
        ctx.font = `${iconSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, fx + fw / 2, fy + fh * 0.38);

        const nameSize = Math.max(8, Math.min(11, fw * 0.14));
        ctx.font = `600 ${nameSize}px Inter, sans-serif`;
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(item.name, fx + fw / 2, fy + fh * 0.68);
      }

      // Selection handles
      if (isSelected) {
        const hs = 4;
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 1.5;
        [[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]].forEach(([hx, hy]) => {
          ctx.beginPath();
          ctx.arc(hx, hy, hs, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
      }

      ctx.restore();
    });

    // 6. Dimension Annotations
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${roomWidth.toFixed(1)}m`, ox + roomPxW / 2, oy - 28);
    ctx.fillText(`${roomLength.toFixed(1)}m`, ox - 28, oy + roomPxH / 2);

  }, [roomWidth, roomLength, features, furniture, selectedId, hoveredId, zoom, showGrid, getEffectiveDims]);

  useEffect(() => {
    renderCanvas();
    const handleResize = () => renderCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderCanvas]);

  // Pointer Handlers
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const pt = toRoom(cssX, cssY);

    // Hit test furniture in reverse order (topmost first)
    for (let i = furniture.length - 1; i >= 0; i--) {
      const item = furniture[i];
      const dims = getEffectiveDims(item);
      if (pt.x >= item.x && pt.x <= item.x + dims.w && pt.y >= item.y && pt.y <= item.y + dims.h) {
        setSelectedId(item.id);
        isDraggingRef.current = true;
        dragTargetIdRef.current = item.id;
        dragOffsetRef.current = { x: pt.x - item.x, y: pt.y - item.y };
        return;
      }
    }

    setSelectedId(null);
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;
    const pt = toRoom(cssX, cssY);

    if (isDraggingRef.current && dragTargetIdRef.current) {
      const item = furniture.find((f) => f.id === dragTargetIdRef.current);
      if (!item) return;

      const dims = getEffectiveDims(item);
      let newX = Math.round((pt.x - dragOffsetRef.current.x) * 10) / 10;
      let newY = Math.round((pt.y - dragOffsetRef.current.y) * 10) / 10;

      newX = Math.max(0, Math.min(newX, roomWidth - dims.w));
      newY = Math.max(0, Math.min(newY, roomLength - dims.h));

      updateFurniture(item.id, { x: newX, y: newY });
    } else {
      // Hover detection
      let hit: string | null = null;
      for (let i = furniture.length - 1; i >= 0; i--) {
        const item = furniture[i];
        const dims = getEffectiveDims(item);
        if (pt.x >= item.x && pt.x <= item.x + dims.w && pt.y >= item.y && pt.y <= item.y + dims.h) {
          hit = item.id;
          break;
        }
      }
      setHoveredId(hit);
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    dragTargetIdRef.current = null;
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.92 : 1.08;
    setZoom((z) => Math.max(0.5, Math.min(z * factor, 3)));
  };

  return (
    <main
      ref={containerRef}
      className="flex-1 bg-zinc-950 relative overflow-hidden flex flex-col items-center justify-center select-none"
    >
      {/* Canvas Controls Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-zinc-900/85 backdrop-blur-md p-1.5 rounded-lg border border-zinc-800 shadow-xl">
        <button
          onClick={() => setZoom((z) => Math.min(z * 1.2, 3))}
          className="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition active:scale-95"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setZoom((z) => Math.max(z / 1.2, 0.5))}
          className="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition active:scale-95"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => setZoom(1)}
          className="px-2.5 py-1 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded transition active:scale-95"
          title="Reset Zoom &amp; View"
        >
          Reset
        </button>
        <button
          onClick={() => setShowGrid((g) => !g)}
          className={`px-2.5 py-1 text-xs font-semibold rounded transition active:scale-95 ${
            showGrid
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
              : 'bg-zinc-800 text-zinc-400 border border-transparent'
          }`}
          title="Toggle Grid"
        >
          Grid
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handlePointerUp}
        onWheel={handleWheel}
        style={{ cursor: hoveredId ? 'grab' : 'crosshair' }}
        className="w-full h-full block"
      />

      <div className="absolute bottom-3 text-xs text-zinc-500 font-medium bg-zinc-950/80 px-3 py-1 rounded-full border border-zinc-900 backdrop-blur-sm pointer-events-none">
        Click &amp; drag furniture to reposition &bull; Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">R</kbd> to rotate &bull; <kbd className="px-1 py-0.5 bg-zinc-800 rounded border border-zinc-700 text-zinc-300">Del</kbd> to remove
      </div>
    </main>
  );
}
