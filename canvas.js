/**
 * RoomAI — Canvas Renderer
 * High-performance 2D architectural room canvas with drag-and-drop,
 * zoom/pan, grid snapping, and animated layout transitions.
 */

const CATEGORY_COLORS = {
  bed:     { fill: 'rgba(59, 130, 246, 0.22)',  stroke: 'rgba(59, 130, 246, 0.9)',  glow: 'rgba(59, 130, 246, 0.45)' },
  seating: { fill: 'rgba(16, 185, 129, 0.22)',  stroke: 'rgba(16, 185, 129, 0.9)',  glow: 'rgba(16, 185, 129, 0.45)' },
  table:   { fill: 'rgba(245, 158, 11, 0.22)',  stroke: 'rgba(245, 158, 11, 0.9)',  glow: 'rgba(245, 158, 11, 0.45)' },
  storage: { fill: 'rgba(123, 97, 255, 0.22)',  stroke: 'rgba(123, 97, 255, 0.9)',  glow: 'rgba(123, 97, 255, 0.45)' },
  decor:   { fill: 'rgba(255, 107, 157, 0.22)', stroke: 'rgba(255, 107, 157, 0.9)', glow: 'rgba(255, 107, 157, 0.45)' },
  default: { fill: 'rgba(148, 163, 184, 0.2)',  stroke: 'rgba(148, 163, 184, 0.7)', glow: 'rgba(148, 163, 184, 0.35)' }
};

class RoomCanvas {
  constructor(canvasId) {
    try {
      this.canvasEl = document.getElementById(canvasId);
      if (!this.canvasEl) { console.warn('Canvas element not found:', canvasId); return; }
      this.ctx = this.canvasEl.getContext('2d');

      // State
      this.room = null;
      this.placements = [];
      this.selectedId = null;
      this.hoveredId = null;
      this.isDragging = false;
      this.dragStartPos = null;
      this.dragOffset = { x: 0, y: 0 };
      this.showGrid = true;
      this.gridSnap = 0.5; // feet
      this.onMoveCb = null;
      this.animReq = null;

      // View transform
      this.scale = 1; // pixels per foot
      this.offsetX = 0;
      this.offsetY = 0;

      // Theme
      this.isDark = true;

      // Sizing
      this.dpr = window.devicePixelRatio || 1;
      this.cssW = 0;
      this.cssH = 0;

      // Bind events and initialize
      this._bindEvents();
      requestAnimationFrame(() => {
        this._resize();
        this._draw();
      });
      window.addEventListener('resize', () => { this._resize(); this._draw(); });
    } catch (e) {
      console.warn('RoomCanvas init error:', e);
    }
  }

  // ========================
  // Public API
  // ========================

  setRoom(room) {
    try {
      this.room = room;
      this._fitRoomToCanvas();
      this._draw();
    } catch (e) { console.warn('setRoom error:', e); }
  }

  setPlacements(placements) {
    try {
      if (this.animReq) {
        cancelAnimationFrame(this.animReq);
        this.animReq = null;
      }
      this.placements = placements ? placements.map(p => ({...p})) : [];
      this._draw();
    } catch (e) { console.warn(e); }
  }

  setPlacementsAnimated(newPlacements) {
    try {
      if (this.animReq) {
        cancelAnimationFrame(this.animReq);
        this.animReq = null;
      }

      if (!newPlacements || newPlacements.length === 0) {
        this.placements = [];
        this._draw();
        return;
      }

      const oldPlacements = this.placements.map(p => ({...p}));
      const targets = newPlacements.map(p => ({...p}));
      const duration = 500;
      const start = performance.now();

      const step = (now) => {
        const t = Math.min((now - start) / duration, 1);
        // Ease out cubic
        const ease = 1 - Math.pow(1 - t, 3);

        this.placements = targets.map((target) => {
          const old = oldPlacements.find(o => o.id === target.id);
          if (old && old.x !== undefined && old.y !== undefined) {
            return {
              ...target,
              x: old.x + (target.x - old.x) * ease,
              y: old.y + (target.y - old.y) * ease
            };
          }
          return { ...target };
        });

        this._draw();

        if (t < 1) {
          this.animReq = requestAnimationFrame(step);
        } else {
          this.placements = targets.map(p => ({...p}));
          this.animReq = null;
          this._draw();
        }
      };

      this.animReq = requestAnimationFrame(step);
    } catch (e) {
      console.warn('Animation error:', e);
      this.placements = newPlacements ? newPlacements.map(p => ({...p})) : [];
      this._draw();
    }
  }

  onPlacementMoved(cb) {
    this.onMoveCb = cb;
  }

  addPlacement(item) {
    try {
      if (!item || !item.id) return;
      this.placements = this.placements.filter(p => p.id !== item.id);
      this.placements.push({...item});
      this._draw();
    } catch(e) { console.warn(e); }
  }

  removePlacement(id) {
    try {
      this.placements = this.placements.filter(p => p.id !== id);
      if (this.selectedId === id) this.selectedId = null;
      if (this.hoveredId === id) this.hoveredId = null;
      this._draw();
    } catch(e) { console.warn(e); }
  }

  screenToRoom(cssX, cssY) {
    return this._toRoom(cssX, cssY);
  }

  getAllPlacements() {
    return this.placements.map(p => ({...p}));
  }

  setShowGrid(v) {
    this.showGrid = v;
    this._draw();
  }

  zoomIn() {
    this.scale = Math.min(this.scale * 1.2, 120);
    this._recenter();
    this._draw();
  }

  zoomOut() {
    this.scale = Math.max(this.scale / 1.2, 8);
    this._recenter();
    this._draw();
  }

  resetView() {
    this._fitRoomToCanvas();
    this._draw();
  }

  setTheme(theme) {
    this.isDark = (theme !== 'light');
    this._draw();
  }

  getSelectedPlacement() {
    return this.placements.find(p => p.id === this.selectedId) || null;
  }

  resize() {
    this._resize();
    this._draw();
  }

  // ========================
  // Internal Sizing & Coordinates
  // ========================

  _resize() {
    try {
      const parent = this.canvasEl.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      this.cssW = Math.max(rect.width || 600, 300);
      this.cssH = Math.max(rect.height || 400, 300);
      this.dpr = window.devicePixelRatio || 1;

      this.canvasEl.width = this.cssW * this.dpr;
      this.canvasEl.height = this.cssH * this.dpr;
      this.canvasEl.style.width = this.cssW + 'px';
      this.canvasEl.style.height = this.cssH + 'px';

      if (this.room) this._fitRoomToCanvas();
    } catch (e) { console.warn('Resize error:', e); }
  }

  _fitRoomToCanvas() {
    try {
      if (!this.room) return;
      const padding = 70;
      const availW = this.cssW - padding * 2;
      const availH = this.cssH - padding * 2;
      if (availW <= 0 || availH <= 0) return;

      const scaleX = availW / Math.max(this.room.width, 6);
      const scaleY = availH / Math.max(this.room.height, 6);
      this.scale = Math.max(Math.min(scaleX, scaleY), 10);

      this._recenter();
    } catch (e) { console.warn(e); }
  }

  _recenter() {
    if (!this.room) return;
    const roomPxW = this.room.width * this.scale;
    const roomPxH = this.room.height * this.scale;
    this.offsetX = (this.cssW - roomPxW) / 2;
    this.offsetY = (this.cssH - roomPxH) / 2;
  }

  _toRoom(cssX, cssY) {
    return {
      x: (cssX - this.offsetX) / this.scale,
      y: (cssY - this.offsetY) / this.scale
    };
  }

  _toScreen(rx, ry) {
    return {
      x: rx * this.scale + this.offsetX,
      y: ry * this.scale + this.offsetY
    };
  }

  _snap(v) {
    return Math.round(v / this.gridSnap) * this.gridSnap;
  }

  // ========================
  // Rendering
  // ========================

  _draw() {
    try {
      const ctx = this.ctx;
      if (!ctx) return;
      const W = this.cssW;
      const H = this.cssH;

      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);

      // Canvas background
      ctx.fillStyle = this.isDark ? '#0b101d' : '#f1f5f9';
      ctx.fillRect(0, 0, W, H);

      if (!this.room) {
        ctx.fillStyle = this.isDark ? '#475569' : '#94a3b8';
        ctx.font = '14px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Configure room dimensions or enter a description', W / 2, H / 2);
        return;
      }

      if (this.showGrid) this._drawGrid(ctx);
      this._drawRoom(ctx);
      this._drawDoors(ctx);
      this._drawWindows(ctx);
      this._drawAllFurniture(ctx);
      this._drawDimLabels(ctx);

    } catch (e) {
      console.warn('Draw error:', e);
    }
  }

  _drawGrid(ctx) {
    const rm = this.room;
    const s = this.scale;
    const ox = this.offsetX;
    const oy = this.offsetY;

    ctx.save();
    ctx.lineWidth = 0.5;

    // 1-foot grid
    ctx.strokeStyle = this.isDark ? 'rgba(148,163,184,0.07)' : 'rgba(0,0,0,0.05)';
    ctx.beginPath();
    for (let x = 0; x <= rm.width; x += 1) {
      const sx = ox + x * s;
      ctx.moveTo(sx, oy);
      ctx.lineTo(sx, oy + rm.height * s);
    }
    for (let y = 0; y <= rm.height; y += 1) {
      const sy = oy + y * s;
      ctx.moveTo(ox, sy);
      ctx.lineTo(ox + rm.width * s, sy);
    }
    ctx.stroke();

    // 5-foot grid
    ctx.strokeStyle = this.isDark ? 'rgba(148,163,184,0.15)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= rm.width; x += 5) {
      const sx = ox + x * s;
      ctx.moveTo(sx, oy);
      ctx.lineTo(sx, oy + rm.height * s);
    }
    for (let y = 0; y <= rm.height; y += 5) {
      const sy = oy + y * s;
      ctx.moveTo(ox, sy);
      ctx.lineTo(ox + rm.width * s, sy);
    }
    ctx.stroke();
    ctx.restore();
  }

  _drawRoom(ctx) {
    const rm = this.room;
    const s = this.scale;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const rw = rm.width * s;
    const rh = rm.height * s;

    // Room interior floor fill
    ctx.save();
    ctx.fillStyle = this.isDark ? '#141c2e' : '#ffffff';
    ctx.shadowColor = this.isDark ? 'rgba(0, 212, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 24;
    ctx.fillRect(ox, oy, rw, rh);
    ctx.shadowBlur = 0;

    // Walls
    ctx.strokeStyle = this.isDark ? '#00d4ff' : '#0284c7';
    ctx.lineWidth = 3;
    ctx.strokeRect(ox, oy, rw, rh);

    // Wall cardinal markers
    ctx.fillStyle = this.isDark ? '#64748b' : '#94a3b8';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NORTH', ox + rw / 2, oy - 14);
    ctx.fillText('SOUTH', ox + rw / 2, oy + rh + 14);
    ctx.fillText('WEST', ox - 18, oy + rh / 2);
    ctx.fillText('EAST', ox + rw + 18, oy + rh / 2);
    ctx.restore();
  }

  _drawDoors(ctx) {
    if (!this.room || !this.room.doors) return;
    const rm = this.room;
    const s = this.scale;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const rw = rm.width * s;
    const rh = rm.height * s;

    ctx.save();
    this.room.doors.forEach(door => {
      const dw = door.width * s;
      const pos = Math.min(door.position, (door.wall === 'north' || door.wall === 'south' ? rm.width : rm.height) - door.width) * s;

      let dx, dy, arcX, arcY, arcR, startA, endA;

      ctx.fillStyle = this.isDark ? '#0b101d' : '#f1f5f9';
      if (door.wall === 'south') {
        dx = ox + pos; dy = oy + rh - 3;
        ctx.fillRect(dx, dy, dw, 6);
        arcX = dx; arcY = oy + rh;
        startA = -Math.PI / 2; endA = 0;
        arcR = dw;
      } else if (door.wall === 'north') {
        dx = ox + pos; dy = oy - 3;
        ctx.fillRect(dx, dy, dw, 6);
        arcX = dx + dw; arcY = oy;
        startA = Math.PI / 2; endA = Math.PI;
        arcR = dw;
      } else if (door.wall === 'east') {
        dx = ox + rw - 3; dy = oy + pos;
        ctx.fillRect(dx, dy, 6, dw);
        arcX = ox + rw; arcY = oy + pos + dw;
        startA = -Math.PI; endA = -Math.PI / 2;
        arcR = dw;
      } else if (door.wall === 'west') {
        dx = ox - 3; dy = oy + pos;
        ctx.fillRect(dx, dy, 6, dw);
        arcX = ox; arcY = oy + pos;
        startA = 0; endA = Math.PI / 2;
        arcR = dw;
      }

      // Swing area
      ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      ctx.moveTo(arcX, arcY);
      ctx.arc(arcX, arcY, arcR, startA, endA);
      ctx.closePath();
      ctx.fill();

      // Swing boundary arc
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(arcX, arcY, arcR, startA, endA);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#10b981';
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      if (door.wall === 'south') ctx.fillText('🚪 Door', dx + dw / 2, oy + rh + 26);
      else if (door.wall === 'north') ctx.fillText('🚪 Door', dx + dw / 2, oy - 26);
      else if (door.wall === 'east') ctx.fillText('🚪 Door', ox + rw + 28, dy + dw / 2);
      else if (door.wall === 'west') ctx.fillText('🚪 Door', ox - 28, dy + dw / 2);
    });
    ctx.restore();
  }

  _drawWindows(ctx) {
    if (!this.room || !this.room.windows) return;
    const rm = this.room;
    const s = this.scale;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const rw = rm.width * s;
    const rh = rm.height * s;

    ctx.save();
    this.room.windows.forEach(win => {
      const ww = win.width * s;
      const maxSpan = (win.wall === 'north' || win.wall === 'south') ? rm.width : rm.height;
      const pos = Math.min(win.position, maxSpan - win.width) * s;
      const thick = 8;

      let wx, wy, wWidth, wHeight;
      if (win.wall === 'north') { wx = ox + pos; wy = oy - thick / 2; wWidth = ww; wHeight = thick; }
      else if (win.wall === 'south') { wx = ox + pos; wy = oy + rh - thick / 2; wWidth = ww; wHeight = thick; }
      else if (win.wall === 'west') { wx = ox - thick / 2; wy = oy + pos; wWidth = thick; wHeight = ww; }
      else if (win.wall === 'east') { wx = ox + rw - thick / 2; wy = oy + pos; wWidth = thick; wHeight = ww; }

      // Window glass
      ctx.fillStyle = this.isDark ? 'rgba(123, 97, 255, 0.35)' : 'rgba(99, 102, 241, 0.3)';
      ctx.fillRect(wx, wy, wWidth, wHeight);

      // Window frame
      ctx.strokeStyle = this.isDark ? '#7b61ff' : '#6366f1';
      ctx.lineWidth = 2;
      ctx.strokeRect(wx, wy, wWidth, wHeight);

      // Window crossline
      ctx.beginPath();
      if (win.wall === 'north' || win.wall === 'south') {
        ctx.moveTo(wx + wWidth / 2, wy);
        ctx.lineTo(wx + wWidth / 2, wy + wHeight);
      } else {
        ctx.moveTo(wx, wy + wHeight / 2);
        ctx.lineTo(wx + wWidth, wy + wHeight / 2);
      }
      ctx.stroke();

      // Label
      ctx.fillStyle = this.isDark ? '#a78bfa' : '#6366f1';
      ctx.font = '600 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      if (win.wall === 'south') ctx.fillText('🪟 Window', wx + ww / 2, oy + rh + 26);
      else if (win.wall === 'north') ctx.fillText('🪟 Window', wx + ww / 2, oy - 26);
      else if (win.wall === 'east') ctx.fillText('🪟 Window', ox + rw + 32, wy + ww / 2);
      else if (win.wall === 'west') ctx.fillText('🪟 Window', ox - 32, wy + ww / 2);
    });
    ctx.restore();
  }

  _drawAllFurniture(ctx) {
    if (!this.placements || this.placements.length === 0) return;

    // Draw non-selected first, selected last (on top)
    const sorted = [...this.placements].sort((a, b) => {
      if (a.id === this.selectedId) return 1;
      if (b.id === this.selectedId) return -1;
      return 0;
    });

    sorted.forEach(item => this._drawOneFurniture(ctx, item));
  }

  _drawOneFurniture(ctx, item) {
    try {
      const s = this.scale;
      const ox = this.offsetX;
      const oy = this.offsetY;

      const fx = ox + item.x * s;
      const fy = oy + item.y * s;
      const fw = item.width * s;
      const fh = item.height * s;

      const isSelected = (item.id === this.selectedId);
      const isHovered = (item.id === this.hoveredId);
      const catColor = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.default;

      ctx.save();

      // Drop shadow for active/selected items
      if (isSelected) {
        ctx.shadowColor = catColor.glow;
        ctx.shadowBlur = 18;
      }

      // Card body
      ctx.fillStyle = isSelected
        ? (this.isDark ? 'rgba(0, 212, 255, 0.22)' : 'rgba(14, 165, 233, 0.22)')
        : catColor.fill;

      const r = Math.min(6, fw * 0.1, fh * 0.1);
      this._roundRect(ctx, fx, fy, fw, fh, r);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Border outline
      ctx.strokeStyle = isSelected
        ? (this.isDark ? '#00d4ff' : '#0284c7')
        : isHovered
          ? (this.isDark ? 'rgba(0, 212, 255, 0.8)' : 'rgba(2, 132, 199, 0.8)')
          : catColor.stroke;
      ctx.lineWidth = isSelected ? 2.5 : (isHovered ? 2 : 1.5);
      this._roundRect(ctx, fx, fy, fw, fh, r);
      ctx.stroke();

      // Top color indicator bar
      ctx.fillStyle = catColor.stroke;
      ctx.fillRect(fx + 2, fy + 2, Math.max(fw - 4, 1), 3);

      // Icon & Name rendering
      const minDim = Math.min(fw, fh);
      if (minDim >= 22) {
        const iconSize = Math.max(12, Math.min(24, minDim * 0.38));
        ctx.font = `${iconSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(item.icon || '📦', fx + fw / 2, fy + fh * 0.38);

        const nameSize = Math.max(8, Math.min(11, fw * 0.13));
        ctx.font = `600 ${nameSize}px Inter, sans-serif`;
        ctx.fillStyle = this.isDark ? '#f8fafc' : '#0f172a';
        ctx.fillText(item.name || '', fx + fw / 2, fy + fh * 0.65);
      }

      // Dimension tag
      if (fh > 36 && fw > 44) {
        const dimSize = Math.max(7, Math.min(9, fw * 0.1));
        ctx.font = `500 ${dimSize}px Inter, sans-serif`;
        ctx.fillStyle = this.isDark ? '#94a3b8' : '#64748b';
        ctx.fillText(`${item.width}×${item.height} ft`, fx + fw / 2, fy + fh * 0.82);
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

      // Hover dash box
      if (isHovered && !isSelected) {
        ctx.strokeStyle = catColor.glow;
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        this._roundRect(ctx, fx - 2, fy - 2, fw + 4, fh + 4, r + 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.restore();
    } catch (e) {
      console.warn('Furniture draw error:', e);
    }
  }

  _drawDimLabels(ctx) {
    if (!this.room) return;
    const rm = this.room;
    const s = this.scale;
    const ox = this.offsetX;
    const oy = this.offsetY;
    const rw = rm.width * s;
    const rh = rm.height * s;

    ctx.save();
    ctx.fillStyle = this.isDark ? '#64748b' : '#475569';
    ctx.strokeStyle = this.isDark ? 'rgba(148,163,184,0.3)' : 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.font = '600 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Top dimension
    const topY = oy - 28;
    ctx.beginPath();
    ctx.moveTo(ox, topY); ctx.lineTo(ox + rw, topY);
    ctx.moveTo(ox, topY - 4); ctx.lineTo(ox, topY + 4);
    ctx.moveTo(ox + rw, topY - 4); ctx.lineTo(ox + rw, topY + 4);
    ctx.stroke();
    ctx.fillText(`${rm.width} ft`, ox + rw / 2, topY - 10);

    // Left dimension
    const leftX = ox - 28;
    ctx.beginPath();
    ctx.moveTo(leftX, oy); ctx.lineTo(leftX, oy + rh);
    ctx.moveTo(leftX - 4, oy); ctx.lineTo(leftX + 4, oy);
    ctx.moveTo(leftX - 4, oy + rh); ctx.lineTo(leftX + 4, oy + rh);
    ctx.stroke();

    ctx.save();
    ctx.translate(leftX - 10, oy + rh / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${rm.height} ft`, 0, 0);
    ctx.restore();

    ctx.restore();
  }

  _roundRect(ctx, x, y, w, h, r) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  // ========================
  // Drag & Drop & Interaction Events
  // ========================

  _bindEvents() {
    const el = this.canvasEl;
    if (!el) return;

    // Prevent default HTML5 drag on canvas
    el.addEventListener('dragstart', (e) => e.preventDefault());

    // Mouse pointer down
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this._onPointerDown(e.offsetX, e.offsetY);
    });

    // Window-level mouse move & up
    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const rect = el.getBoundingClientRect();
        const cssX = e.clientX - rect.left;
        const cssY = e.clientY - rect.top;
        this._onPointerMove(cssX, cssY);
      } else {
        const rect = el.getBoundingClientRect();
        if (e.clientX >= rect.left && e.clientX <= rect.right &&
            e.clientY >= rect.top && e.clientY <= rect.bottom) {
          const cssX = e.clientX - rect.left;
          const cssY = e.clientY - rect.top;
          this._onPointerHover(cssX, cssY);
        }
      }
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this._onPointerUp();
      }
    });

    el.addEventListener('mouseleave', () => {
      if (!this.isDragging) {
        this.hoveredId = null;
        this._draw();
      }
    });

    // Touch events
    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = el.getBoundingClientRect();
      this._onPointerDown(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const t = e.touches[0];
      const rect = el.getBoundingClientRect();
      this._onPointerMove(t.clientX - rect.left, t.clientY - rect.top);
    }, { passive: false });

    el.addEventListener('touchend', () => this._onPointerUp());

    // Wheel zoom
    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 0.92 : 1.08;
      this.scale = Math.max(8, Math.min(this.scale * factor, 120));
      this._recenter();
      this._draw();
    }, { passive: false });
  }

  _onPointerDown(cx, cy) {
    try {
      const pt = this._toRoom(cx, cy);
      const hitId = this._hitTest(pt.x, pt.y);

      if (hitId) {
        this.selectedId = hitId;
        this.isDragging = true;
        const p = this.placements.find(p => p.id === hitId);
        if (p) {
          this.dragOffset = { x: pt.x - p.x, y: pt.y - p.y };
          this.dragStartPos = { x: p.x, y: p.y };
        }
        this.canvasEl.style.cursor = 'grabbing';
      } else {
        this.selectedId = null;
        this.isDragging = false;
      }
      this._draw();
    } catch (err) { console.warn(err); }
  }

  _onPointerMove(cx, cy) {
    try {
      if (!this.isDragging || !this.selectedId) return;
      const pt = this._toRoom(cx, cy);
      const p = this.placements.find(p => p.id === this.selectedId);
      if (p) {
        let newX = this._snap(pt.x - this.dragOffset.x);
        let newY = this._snap(pt.y - this.dragOffset.y);

        if (this.room) {
          newX = Math.max(0, Math.min(newX, this.room.width - p.width));
          newY = Math.max(0, Math.min(newY, this.room.height - p.height));
        }

        p.x = newX;
        p.y = newY;
        this._draw();

        // Trigger live placement moved callback
        if (this.onMoveCb) {
          this.onMoveCb(this.selectedId, newX, newY);
        }
      }
      this.canvasEl.style.cursor = 'grabbing';
    } catch (err) { console.warn(err); }
  }

  _onPointerHover(cx, cy) {
    try {
      const pt = this._toRoom(cx, cy);
      const hitId = this._hitTest(pt.x, pt.y);
      if (hitId !== this.hoveredId) {
        this.hoveredId = hitId;
        this._draw();
      }
      this.canvasEl.style.cursor = hitId ? 'grab' : 'default';
    } catch (err) { console.warn(err); }
  }

  _onPointerUp() {
    try {
      if (this.isDragging && this.selectedId && this.onMoveCb) {
        const p = this.placements.find(p => p.id === this.selectedId);
        if (p && this.dragStartPos && (p.x !== this.dragStartPos.x || p.y !== this.dragStartPos.y)) {
          this.onMoveCb(this.selectedId, p.x, p.y);
        }
      }
      this.isDragging = false;
      this.dragStartPos = null;
      this.canvasEl.style.cursor = this.hoveredId ? 'grab' : 'default';
      this._draw();
    } catch (err) { console.warn(err); }
  }

  _hitTest(rx, ry) {
    for (let i = this.placements.length - 1; i >= 0; i--) {
      const p = this.placements[i];
      const pw = p.width || 0;
      const ph = p.height || 0;
      if (rx >= p.x && rx <= p.x + pw && ry >= p.y && ry <= p.y + ph) {
        return p.id;
      }
    }
    return null;
  }
}

window.RoomCanvas = RoomCanvas;
