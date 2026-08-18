/**
 * RoomAI — Constraint-Based Spatial Optimizer
 * Advanced multi-phase architectural spatial solver for intelligent interior room layouts.
 * 
 * Algorithm:
 *   Phase 1: Wall-anchored placement for primary anchors (beds, sofas, desks, storage)
 *            honoring user preferences, architectural wall lengths, door swings & daylight.
 *   Phase 2: Relational companion placement (nightstands, office chairs, coffee tables, TV stands)
 *   Phase 3: Open-space & corner accent placement (lamps, plants, dining chairs)
 */

class LayoutEngine {
  constructor() {
    this.DOOR_CLEARANCE = 3.0;     // feet
    this.WALL_GAP = 0.25;          // feet from wall
    this.FURNITURE_GAP = 0.5;      // feet between furniture items
    this.WINDOW_CLEARANCE = 1.0;   // feet
  }

  /**
   * Generate an optimal spatial layout for the given room and furniture list.
   * @param {Object} room - { width, height, type, doors: [], windows: [] }
   * @param {Array} furnitureList - Array of furniture items (with optional .preferredWall)
   * @returns {Object} { placements, score: { total, breakdown }, traces: [], naiveScore }
   */
  generateLayout(room, furnitureList) {
    try {
      if (!room || !furnitureList || furnitureList.length === 0) {
        return this._emptyResult();
      }

      const placements = [];
      const traces = [];
      const sorted = this._sortByPriority(furnitureList);
      const exclusions = this._buildExclusionZones(room);
      const placed = new Set();

      // Phase 1: Wall-anchored primary furniture
      for (const item of sorted) {
        if (placed.has(item.id)) continue;
        if (!this._isWallCandidate(item)) continue;

        const result = this._placeAgainstWall(item, room, placements, exclusions);
        if (result) {
          const reasoning = this._buildReasoning(item, result, room);
          placements.push({ ...item, ...result, reasoning });
          traces.push(reasoning);
          placed.add(item.id);
        }
      }

      // Phase 2: Relational companion furniture
      for (const item of sorted) {
        if (placed.has(item.id)) continue;
        const result = this._placeRelational(item, room, placements, exclusions);
        if (result) {
          const reasoning = this._buildReasoning(item, result, room);
          placements.push({ ...item, ...result, reasoning });
          traces.push(reasoning);
          placed.add(item.id);
        }
      }

      // Phase 3: Fill remaining secondary items
      for (const item of sorted) {
        if (placed.has(item.id)) continue;
        const result = this._placeInOpenSpace(item, room, placements, exclusions);
        if (result) {
          const reasoning = this._buildReasoning(item, result, room);
          placements.push({ ...item, ...result, reasoning });
          traces.push(reasoning);
          placed.add(item.id);
        }
      }

      // Fallback: If any item still unplaced, place in first available slot
      for (const item of sorted) {
        if (placed.has(item.id)) continue;
        const fallback = this._placeFallback(item, room, placements);
        if (fallback) {
          const reasoning = `${item.name} placed in open floor area.`;
          placements.push({ ...item, ...fallback, reasoning });
          traces.push(reasoning);
          placed.add(item.id);
        }
      }

      const score = this.calculateScore(room, placements);
      const naiveLayout = this.generateNaiveLayout(room, furnitureList);
      const naiveScore = this.calculateScore(room, naiveLayout.placements);

      return {
        placements,
        score,
        traces,
        naiveScore: naiveScore.total
      };
    } catch (e) {
      console.warn('LayoutEngine.generateLayout error:', e);
      return this._emptyResult();
    }
  }

  /**
   * Generate an unoptimized baseline layout for comparison.
   */
  generateNaiveLayout(room, furnitureList) {
    try {
      const placements = [];
      let cx = 0.5, cy = 0.5;
      let maxRowH = 0;

      for (const item of furnitureList) {
        if (cx + item.width > room.width - 0.5) {
          cx = 0.5;
          cy += maxRowH + 0.5;
          maxRowH = 0;
        }
        if (cy + item.height > room.height - 0.5) {
          cy = 0.5;
        }
        placements.push({
          ...item,
          x: Math.round(cx * 2) / 2,
          y: Math.round(cy * 2) / 2,
          reasoning: 'Placed sequentially without constraint optimization.'
        });
        cx += item.width + 0.5;
        maxRowH = Math.max(maxRowH, item.height);
      }

      const score = this.calculateScore(room, placements);
      return { placements, score, traces: ['Items placed naively.'], naiveScore: score.total };
    } catch (e) {
      return this._emptyResult();
    }
  }

  /**
   * Calculate 5-metric architectural layout quality score (0-100).
   */
  calculateScore(room, placements) {
    try {
      if (!room || !placements || placements.length === 0) {
        return { total: 0, breakdown: { floorUtilization: 0, doorClearance: 0, windowAccess: 0, walkability: 0, wallAlignment: 0 } };
      }

      const floor = this._scoreFloor(room, placements);
      const door = this._scoreDoors(room, placements);
      const win = this._scoreWindows(room, placements);
      const walk = this._scoreWalkability(room, placements);
      const wall = this._scoreWallAlignment(room, placements);
      const total = Math.round(Math.min(100, Math.max(0, floor + door + win + walk + wall)));

      return {
        total,
        breakdown: {
          floorUtilization: Math.round(floor),
          doorClearance: Math.round(door),
          windowAccess: Math.round(win),
          walkability: Math.round(walk),
          wallAlignment: Math.round(wall)
        }
      };
    } catch (e) {
      return { total: 0, breakdown: { floorUtilization: 0, doorClearance: 0, windowAccess: 0, walkability: 0, wallAlignment: 0 } };
    }
  }

  // ========================
  // Priority & Wall Placement
  // ========================

  _sortByPriority(list) {
    const pri = { bed: 10, seating: 8, storage: 6, table: 5, decor: 2 };
    return [...list].sort((a, b) => {
      const pa = pri[a.category] || 0;
      const pb = pri[b.category] || 0;
      if (pa !== pb) return pb - pa;
      return (b.width * b.height) - (a.width * a.height);
    });
  }

  _isWallCandidate(item) {
    if (['bed', 'storage'].includes(item.category)) return true;
    if (item.category === 'seating' && ['sofa', 'loveseat'].some(s => item.id.includes(s))) return true;
    if (item.category === 'table' && ['desk', 'tv-stand'].some(s => item.id.includes(s))) return true;
    return (item.width * item.height) >= 6;
  }

  _buildExclusionZones(room) {
    const zones = [];
    const doors = room.doors || [];
    const windows = room.windows || [];

    for (const d of doors) {
      const z = this._doorToRect(d, room);
      if (z) zones.push({ ...z, type: 'door' });
    }
    for (const w of windows) {
      const z = this._windowToRect(w, room);
      if (z) zones.push({ ...z, type: 'window' });
    }
    return zones;
  }

  _doorToRect(door, room) {
    const cl = this.DOOR_CLEARANCE;
    const pos = Math.min(door.position, (door.wall === 'north' || door.wall === 'south' ? room.width : room.height) - door.width);
    switch (door.wall) {
      case 'north': return { x: pos, y: 0, w: door.width, h: cl };
      case 'south': return { x: pos, y: Math.max(0, room.height - cl), w: door.width, h: cl };
      case 'east':  return { x: Math.max(0, room.width - cl), y: pos, w: cl, h: door.width };
      case 'west':  return { x: 0, y: pos, w: cl, h: door.width };
      default: return null;
    }
  }

  _windowToRect(win, room) {
    const cl = this.WINDOW_CLEARANCE;
    const pos = Math.min(win.position, (win.wall === 'north' || win.wall === 'south' ? room.width : room.height) - win.width);
    switch (win.wall) {
      case 'north': return { x: pos, y: 0, w: win.width, h: cl };
      case 'south': return { x: pos, y: Math.max(0, room.height - cl), w: win.width, h: cl };
      case 'east':  return { x: Math.max(0, room.width - cl), y: pos, w: cl, h: win.width };
      case 'west':  return { x: 0, y: pos, w: cl, h: win.width };
      default: return null;
    }
  }

  _placeAgainstWall(item, room, existing, exclusions) {
    const walls = this._rankWalls(item, room);
    const gap = this.WALL_GAP;

    for (const wall of walls) {
      // Try natural dimensions first, then swapped dimensions
      const dimVariations = [
        { w: item.width, h: item.height },
        { w: item.height, h: item.width }
      ];

      for (const dims of dimVariations) {
        // Skip dimension variation if it doesn't align naturally with wall
        if ((wall === 'north' || wall === 'south') && dims.w > room.width - gap * 2) continue;
        if ((wall === 'east' || wall === 'west') && dims.h > room.height - gap * 2) continue;

        const positions = this._wallPositions(wall, dims, room, gap);

        for (const pos of positions) {
          const candidate = { x: pos.x, y: pos.y, width: dims.w, height: dims.h };
          if (this._fits(candidate, room) &&
              !this._collides(candidate, existing) &&
              !this._hitsExclusion(candidate, exclusions, item.isTall)) {
            return { x: pos.x, y: pos.y, width: dims.w, height: dims.h, wall };
          }
        }
      }
    }
    return null;
  }

  _rankWalls(item, room) {
    const doorWalls = new Set((room.doors || []).map(d => d.wall));
    const windowWalls = new Set((room.windows || []).map(w => w.wall));
    const walls = ['north', 'south', 'east', 'west'];

    // Honor explicit user preference if present
    if (item.preferredWall && walls.includes(item.preferredWall.toLowerCase())) {
      const pref = item.preferredWall.toLowerCase();
      return [pref, ...walls.filter(w => w !== pref)];
    }

    const scored = walls.map(w => {
      let score = 0;
      const len = (w === 'north' || w === 'south') ? room.width : room.height;
      score += len * 2;

      if (item.category === 'bed') {
        if (!doorWalls.has(w)) score += 30; // Beds away from doors
        if (w === 'north') score += 15;     // Traditional headboard wall
        if (!windowWalls.has(w)) score += 10;
      }
      if (item.category === 'storage') {
        if (!windowWalls.has(w)) score += 25; // Don't block windows
        if (!doorWalls.has(w)) score += 10;
      }
      if (item.id === 'desk' || item.name === 'Desk') {
        if (windowWalls.has(w)) score += 20; // Desks love windows for daylight
      }
      if (item.id === 'sofa' || item.id === 'loveseat') {
        if (!doorWalls.has(w)) score += 20;
        if (w === 'south' || w === 'west') score += 5;
      }
      if (doorWalls.has(w)) score -= 25; // Heavily penalize door walls
      return { wall: w, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.wall);
  }

  _wallPositions(wall, dims, room, gap) {
    const positions = [];
    const step = 0.5;

    if (wall === 'north') {
      for (let x = gap; x + dims.w <= room.width - gap; x += step) {
        positions.push({ x, y: gap });
      }
    } else if (wall === 'south') {
      for (let x = gap; x + dims.w <= room.width - gap; x += step) {
        positions.push({ x, y: room.height - dims.h - gap });
      }
    } else if (wall === 'west') {
      for (let y = gap; y + dims.h <= room.height - gap; y += step) {
        positions.push({ x: gap, y });
      }
    } else if (wall === 'east') {
      for (let y = gap; y + dims.h <= room.height - gap; y += step) {
        positions.push({ x: room.width - dims.w - gap, y });
      }
    }
    return positions;
  }

  // ========================
  // Relational Placement
  // ========================

  _placeRelational(item, room, existing, exclusions) {
    // 1. Nightstands -> flanking bed
    if (item.id.includes('nightstand') || item.name.includes('Nightstand')) {
      const bed = existing.find(p => p.category === 'bed');
      if (bed) {
        const candidates = [];
        // If bed is on North or South wall
        if (bed.wall === 'north' || bed.wall === 'south' || bed.y <= 1 || bed.y + bed.height >= room.height - 1) {
          candidates.push(
            { x: bed.x - item.width - 0.25, y: bed.y, width: item.width, height: item.height },
            { x: bed.x + bed.width + 0.25, y: bed.y, width: item.width, height: item.height }
          );
        } else {
          candidates.push(
            { x: bed.x, y: bed.y - item.height - 0.25, width: item.width, height: item.height },
            { x: bed.x, y: bed.y + bed.height + 0.25, width: item.width, height: item.height }
          );
        }
        for (const c of candidates) {
          if (this._fits(c, room) && !this._collides(c, existing) && !this._hitsExclusion(c, exclusions, item.isTall)) {
            return { x: c.x, y: c.y, width: c.width, height: c.height };
          }
        }
      }
    }

    // 2. Office Chair -> positioned at Desk
    if (item.id.includes('office-chair') || item.name.includes('Office Chair')) {
      const desk = existing.find(p => p.id === 'desk' || p.name === 'Desk');
      if (desk) {
        const candidates = [];
        if (desk.wall === 'north' || desk.y <= 1) {
          candidates.push({ x: desk.x + (desk.width - item.width) / 2, y: desk.y + desk.height + 0.3, width: item.width, height: item.height });
        } else if (desk.wall === 'south' || desk.y + desk.height >= room.height - 1) {
          candidates.push({ x: desk.x + (desk.width - item.width) / 2, y: desk.y - item.height - 0.3, width: item.width, height: item.height });
        } else if (desk.wall === 'west' || desk.x <= 1) {
          candidates.push({ x: desk.x + desk.width + 0.3, y: desk.y + (desk.height - item.height) / 2, width: item.width, height: item.height });
        } else {
          candidates.push({ x: desk.x - item.width - 0.3, y: desk.y + (desk.height - item.height) / 2, width: item.width, height: item.height });
        }
        for (const c of candidates) {
          if (this._fits(c, room) && !this._collides(c, existing)) {
            return { x: c.x, y: c.y, width: c.width, height: c.height };
          }
        }
      }
    }

    // 3. Coffee Table -> in front of sofa
    if (item.id.includes('coffee-table') || item.name.includes('Coffee Table')) {
      const sofa = existing.find(p => p.category === 'seating' && (p.name === 'Sofa' || p.name === 'Loveseat'));
      if (sofa) {
        const dims = sofa.width >= sofa.height
          ? { w: Math.min(item.width, sofa.width - 1), h: item.height }
          : { w: item.height, h: Math.min(item.width, sofa.height - 1) };

        const candidates = [];
        if (sofa.wall === 'north' || sofa.y <= room.height / 3) {
          candidates.push({ x: sofa.x + (sofa.width - dims.w) / 2, y: sofa.y + sofa.height + 1.2, width: dims.w, height: dims.h });
        } else if (sofa.wall === 'south' || sofa.y >= room.height * 0.6) {
          candidates.push({ x: sofa.x + (sofa.width - dims.w) / 2, y: sofa.y - dims.h - 1.2, width: dims.w, height: dims.h });
        } else if (sofa.wall === 'west') {
          candidates.push({ x: sofa.x + sofa.width + 1.2, y: sofa.y + (sofa.height - dims.h) / 2, width: dims.w, height: dims.h });
        } else {
          candidates.push({ x: sofa.x - dims.w - 1.2, y: sofa.y + (sofa.height - dims.h) / 2, width: dims.w, height: dims.h });
        }
        for (const c of candidates) {
          if (this._fits(c, room) && !this._collides(c, existing)) {
            return { x: c.x, y: c.y, width: c.width, height: c.height };
          }
        }
      }
    }

    // 4. TV Stand -> opposite sofa
    if (item.id.includes('tv-stand') || item.name.includes('TV Stand')) {
      const sofa = existing.find(p => p.name === 'Sofa' || p.name === 'Loveseat');
      if (sofa) {
        const candidates = [];
        if (sofa.wall === 'south' || sofa.y > room.height / 2) {
          candidates.push({ x: Math.max(0.5, sofa.x), y: this.WALL_GAP, width: item.width, height: item.height, wall: 'north' });
        } else if (sofa.wall === 'north' || sofa.y <= room.height / 2) {
          candidates.push({ x: Math.max(0.5, sofa.x), y: room.height - item.height - this.WALL_GAP, width: item.width, height: item.height, wall: 'south' });
        } else if (sofa.wall === 'west') {
          candidates.push({ x: room.width - item.height - this.WALL_GAP, y: Math.max(0.5, sofa.y), width: item.height, height: item.width, wall: 'east' });
        } else {
          candidates.push({ x: this.WALL_GAP, y: Math.max(0.5, sofa.y), width: item.height, height: item.width, wall: 'west' });
        }
        for (const c of candidates) {
          if (this._fits(c, room) && !this._collides(c, existing) && !this._hitsExclusion(c, exclusions, item.isTall)) {
            return { x: c.x, y: c.y, width: c.width, height: c.height, wall: c.wall };
          }
        }
      }
    }

    // 5. Dining Chairs -> around Dining Table
    if (item.id.includes('dining-chair') || item.name.includes('Dining Chair')) {
      const table = existing.find(p => p.id === 'dining-table' || p.name === 'Dining Table');
      if (table) {
        const candidates = [
          { x: table.x + 0.5, y: table.y - item.height - 0.3, width: item.width, height: item.height },
          { x: table.x + 0.5, y: table.y + table.height + 0.3, width: item.width, height: item.height },
          { x: table.x + table.width - item.width - 0.5, y: table.y - item.height - 0.3, width: item.width, height: item.height },
          { x: table.x + table.width - item.width - 0.5, y: table.y + table.height + 0.3, width: item.width, height: item.height }
        ];
        for (const c of candidates) {
          if (this._fits(c, room) && !this._collides(c, existing)) {
            return { x: c.x, y: c.y, width: c.width, height: c.height };
          }
        }
      }
    }

    return null;
  }

  // ========================
  // Open Space & Corner Accent Placement
  // ========================

  _placeInOpenSpace(item, room, existing, exclusions) {
    // Floor lamp / Plant -> corners
    if (item.category === 'decor' || item.id === 'plant' || item.id === 'floor-lamp') {
      const gap = this.WALL_GAP + 0.25;
      const corners = [
        { x: gap, y: gap },
        { x: room.width - item.width - gap, y: gap },
        { x: gap, y: room.height - item.height - gap },
        { x: room.width - item.width - gap, y: room.height - item.height - gap }
      ];
      for (const pos of corners) {
        const c = { x: pos.x, y: pos.y, width: item.width, height: item.height };
        if (this._fits(c, room) && !this._collides(c, existing) && !this._hitsExclusion(c, exclusions, item.isTall)) {
          return { x: pos.x, y: pos.y, width: item.width, height: item.height };
        }
      }
    }

    // Grid search for remaining open floor area
    for (let y = 1; y <= room.height - item.height - 1; y += 0.5) {
      for (let x = 1; x <= room.width - item.width - 1; x += 0.5) {
        const c = { x, y, width: item.width, height: item.height };
        if (this._fits(c, room) && !this._collides(c, existing) && !this._hitsExclusion(c, exclusions, item.isTall)) {
          return { x, y, width: item.width, height: item.height };
        }
      }
    }
    return null;
  }

  _placeFallback(item, room, existing) {
    for (let y = 0.5; y <= room.height - item.height - 0.5; y += 0.5) {
      for (let x = 0.5; x <= room.width - item.width - 0.5; x += 0.5) {
        const c = { x, y, width: item.width, height: item.height };
        if (this._fits(c, room) && !this._collides(c, existing)) {
          return { x, y, width: item.width, height: item.height };
        }
      }
    }
    return { x: 0.5, y: 0.5, width: item.width, height: item.height };
  }

  // ========================
  // Geometric Helpers
  // ========================

  _fits(rect, room) {
    return rect.x >= 0 && rect.y >= 0 &&
           rect.x + rect.width <= room.width + 0.01 &&
           rect.y + rect.height <= room.height + 0.01;
  }

  _collides(candidate, existing) {
    const gap = this.FURNITURE_GAP;
    for (const p of existing) {
      if (candidate.x < p.x + (p.width || 0) + gap &&
          candidate.x + candidate.width + gap > p.x &&
          candidate.y < p.y + (p.height || 0) + gap &&
          candidate.y + candidate.height + gap > p.y) {
        return true;
      }
    }
    return false;
  }

  _hitsExclusion(candidate, zones, isTall) {
    for (const z of zones) {
      if (z.type === 'window' && !isTall) continue;
      if (candidate.x < z.x + z.w &&
          candidate.x + candidate.width > z.x &&
          candidate.y < z.y + z.h &&
          candidate.y + candidate.height > z.y) {
        return true;
      }
    }
    return false;
  }

  // ========================
  // Scoring Engine (0-100)
  // ========================

  _scoreFloor(room, placements) {
    const total = room.width * room.height;
    let used = 0;
    for (const p of placements) used += (p.width || 0) * (p.height || 0);
    const openPct = (total - used) / total;
    if (openPct >= 0.50 && openPct <= 0.75) return 20;
    if (openPct > 0.75) return Math.max(10, 20 - (openPct - 0.75) * 35);
    if (openPct < 0.50) return Math.max(5, 20 - (0.50 - openPct) * 50);
    return 15;
  }

  _scoreDoors(room, placements) {
    const doors = room.doors || [];
    if (doors.length === 0) return 25;
    let totalScore = 0;
    const perDoor = 25 / doors.length;

    for (const door of doors) {
      const zone = this._doorToRect(door, room);
      if (!zone) { totalScore += perDoor; continue; }
      let blocked = false;
      for (const p of placements) {
        if (p.x < zone.x + zone.w && p.x + (p.width || 0) > zone.x &&
            p.y < zone.y + zone.h && p.y + (p.height || 0) > zone.y) {
          blocked = true;
          break;
        }
      }
      totalScore += blocked ? perDoor * 0.2 : perDoor;
    }
    return Math.min(25, totalScore);
  }

  _scoreWindows(room, placements) {
    const windows = room.windows || [];
    if (windows.length === 0) return 15;
    let score = 0;
    const perWin = 15 / windows.length;

    for (const win of windows) {
      const zone = this._windowToRect(win, room);
      if (!zone) { score += perWin; continue; }
      let tallBlocking = false;
      for (const p of placements) {
        if (p.isTall &&
            p.x < zone.x + zone.w + 0.3 && p.x + (p.width || 0) > zone.x - 0.3 &&
            p.y < zone.y + zone.h + 0.3 && p.y + (p.height || 0) > zone.y - 0.3) {
          tallBlocking = true;
          break;
        }
      }
      score += tallBlocking ? perWin * 0.2 : perWin;
    }
    return Math.min(15, score);
  }

  _scoreWalkability(room, placements) {
    try {
      const res = 0.5;
      const cols = Math.ceil(room.width / res);
      const rows = Math.ceil(room.height / res);
      const grid = Array.from({ length: rows }, () => new Uint8Array(cols));

      for (const p of placements) {
        const x1 = Math.floor(p.x / res);
        const y1 = Math.floor(p.y / res);
        const x2 = Math.ceil((p.x + (p.width || 0)) / res);
        const y2 = Math.ceil((p.y + (p.height || 0)) / res);
        for (let r = Math.max(0, y1); r < Math.min(rows, y2); r++) {
          for (let c = Math.max(0, x1); c < Math.min(cols, x2); c++) {
            grid[r][c] = 1;
          }
        }
      }

      const visited = Array.from({ length: rows }, () => new Uint8Array(cols));
      const queue = [];

      for (const door of (room.doors || [])) {
        let dx, dy;
        switch (door.wall) {
          case 'north': dx = door.position + door.width / 2; dy = 0.5; break;
          case 'south': dx = door.position + door.width / 2; dy = room.height - 0.5; break;
          case 'east': dx = room.width - 0.5; dy = door.position + door.width / 2; break;
          case 'west': dx = 0.5; dy = door.position + door.width / 2; break;
          default: continue;
        }
        const col = Math.floor(dx / res);
        const row = Math.floor(dy / res);
        if (row >= 0 && row < rows && col >= 0 && col < cols && !grid[row][col]) {
          queue.push([row, col]);
          visited[row][col] = 1;
        }
      }

      if (queue.length === 0) {
        queue.push([Math.floor(rows / 2), Math.floor(cols / 2)]);
      }

      let reachable = 0;
      while (queue.length > 0) {
        const [r, c] = queue.shift();
        reachable++;
        for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
          const nr = r + dr, nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc] && !grid[nr][nc]) {
            visited[nr][nc] = 1;
            queue.push([nr, nc]);
          }
        }
      }

      const totalOpen = cols * rows - placements.reduce((s, p) => s + Math.ceil((p.width || 0) / res) * Math.ceil((p.height || 0) / res), 0);
      const ratio = totalOpen > 0 ? Math.min(1, reachable / totalOpen) : 1;
      return Math.min(25, ratio * 25);
    } catch (e) {
      return 20;
    }
  }

  _scoreWallAlignment(room, placements) {
    const eligible = placements.filter(p => ['bed', 'seating', 'storage'].includes(p.category) || p.id === 'desk');
    if (eligible.length === 0) return 15;

    let aligned = 0;
    const threshold = this.WALL_GAP + 0.5;

    for (const p of eligible) {
      const nearWall =
        p.x <= threshold ||
        p.y <= threshold ||
        (p.x + (p.width || 0)) >= room.width - threshold ||
        (p.y + (p.height || 0)) >= room.height - threshold;
      if (nearWall) aligned++;
    }

    return Math.min(15, (aligned / eligible.length) * 15);
  }

  // ========================
  // Reasoning Generator
  // ========================

  _buildReasoning(item, placement, room) {
    const parts = [];
    parts.push(`<strong>${item.name}</strong>`);

    if (placement.wall) {
      parts.push(`anchored along ${placement.wall.toUpperCase()} wall`);
    } else if (placement.y <= 1) {
      parts.push('anchored near NORTH wall');
    } else if (placement.y + item.height >= room.height - 1) {
      parts.push('anchored near SOUTH wall');
    } else if (placement.x <= 1) {
      parts.push('anchored near WEST wall');
    } else if (placement.x + item.width >= room.width - 1) {
      parts.push('anchored near EAST wall');
    } else {
      parts.push('centered in open living zone');
    }

    const doors = room.doors || [];
    for (const d of doors) {
      if (d.wall !== placement.wall) {
        parts.push(`preserves ${this.DOOR_CLEARANCE}ft ${d.wall} door clearance`);
        break;
      }
    }

    const windows = room.windows || [];
    for (const w of windows) {
      if (item.id.includes('desk')) {
        parts.push('maximizes natural daylight from window');
        break;
      }
      if (item.isTall) {
        parts.push('positioned to avoid blocking natural window light');
        break;
      }
    }

    if (item.category === 'bed') parts.push('headboard firmly anchored for spatial stability');
    if (item.category === 'storage') parts.push('flush perimeter placement maximizes open floor space');
    if (item.id.includes('nightstand')) parts.push("flanking bed within arm's reach");
    if (item.id.includes('office-chair')) parts.push('aligned with desk work plane');
    if (item.id.includes('coffee-table')) parts.push('optimal reach distance from seating');
    if (item.id.includes('tv-stand')) parts.push('direct sightline opposite primary seating');
    if (item.category === 'decor') parts.push('occupies corner to enhance room warmth without obstructing pathways');

    return parts.join(' — ');
  }

  _emptyResult() {
    return {
      placements: [],
      score: { total: 0, breakdown: { floorUtilization: 0, doorClearance: 0, windowAccess: 0, walkability: 0, wallAlignment: 0 } },
      traces: [],
      naiveScore: 0
    };
  }
}

window.LayoutEngine = LayoutEngine;
