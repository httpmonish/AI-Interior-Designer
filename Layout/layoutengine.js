/**
 * layoutEngine.js
 * -----------------------------------------------------------------------
 * Constraint-based spatial optimizer + auditor for a hackathon room
 * designer. Given a room's dimensions, wall features (doors/windows) and
 * a furniture list, generateLayout() proposes a placement for every piece
 * of furniture, and auditRoom() scores how livable that layout is.
 *
 * Environment support:
 *   - Pure vanilla JavaScript. No TypeScript, no external libraries, no
 *     npm imports.
 *   - Runs unmodified in Node.js and in the browser.
 *   - Every exported function is defensive: malformed input is sanitized
 *     rather than thrown on, so generateLayout() / auditRoom() should
 *     never raise an exception.
 *
 * Coordinate system:
 *   - Origin (0, 0) is the room's north-west corner.
 *   - x grows eastward, from 0 to room.width.
 *   - y grows southward, from 0 to room.length.
 *   - A Placement's (x, y) is the top-left corner of the furniture's
 *     bounding box AFTER rotation has been applied (see getFootprint()).
 *
 * Node self-test:
 *   Run `node layoutEngine.js` directly to see a worked example printed
 *   to the console, including an ASCII floor plan. Importing this file
 *   (from Node or a bundler) never triggers the self-test.
 *
 * Module format:
 *   This file ends with a named ES module export (`export { ... }`), as
 *   requested. That means `node layoutEngine.js` needs Node to treat the
 *   file as an ES module — e.g. a nearby package.json with
 *   `"type": "module"`, or a `.mjs` extension. See the accompanying notes
 *   for details.
 * -----------------------------------------------------------------------
 */

/* ------------------------------------------------------------------ *
 * Data contracts (JSDoc only — this is plain JS, not TypeScript)
 * ------------------------------------------------------------------ */

/**
 * @typedef {Object} RoomFeature
 * @property {string} id
 * @property {'door'|'window'} type
 * @property {'north'|'south'|'east'|'west'} wall
 * @property {number} offset  Distance in meters from the wall's start
 *   corner to the feature's near edge (see getFeatureCenter).
 * @property {number} width   Width of the opening, in meters.
 */

/**
 * @typedef {Object} FurnitureItem
 * @property {string} id
 * @property {string} name
 * @property {number} width
 * @property {number} depth
 * @property {boolean} [tall]  True for furniture that can block a
 *   window's sightline (bookshelves, wardrobes, tall lamps, ...).
 */

/**
 * @typedef {Object} RoomInput
 * @property {number} width   Room width in meters (east-west extent).
 * @property {number} length  Room length in meters (north-south extent).
 * @property {RoomFeature[]} features
 * @property {FurnitureItem[]} furniture
 */

/**
 * @typedef {Object} Placement
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {0|90|180|270} rotation
 */

/**
 * @typedef {Object} AuditReport
 * @property {number} overallScore
 * @property {number} trafficFlow
 * @property {number} doorClearance
 * @property {number} windowAccess
 * @property {string[]} pros
 * @property {string[]} warnings
 * @property {string[]} traces
 */

/**
 * @typedef {Object} LayoutResult
 * @property {Placement[]} placements
 * @property {AuditReport} audit
 */

/* ------------------------------------------------------------------ *
 * Tunable constants
 * ------------------------------------------------------------------ */

const EPS = 1e-6;                    // floating point tolerance
const SLIDE_STEP = 0.15;             // meters, per the spec
const DOOR_CLEARANCE_RADIUS = 0.9;   // meters, per the spec
// The spec requires a "rectangular area directly in front of" each
// window to stay clear of tall furniture, but doesn't pin an exact
// depth. 0.6m is a reasonable stand-in for "don't block the sill/sightline"
// without eating the whole room.
const WINDOW_CLEARANCE_DEPTH = 0.6;
const NEAR_WALL_THRESHOLD = 0.1;     // meters, for the traffic-flow audit
const WALL_ORDER = ['north', 'east', 'south', 'west'];
const ROTATIONS_TO_TRY = [0, 90];
// Safety cap so a pathological room.width/length (e.g. a bad upstream
// value of 1e9) can't turn the slide search into a near-infinite loop.
// 2000 steps at 0.15m covers a 300m wall — far beyond any real room.
const MAX_SLIDE_ITERATIONS = 2000;
// Small ring of offsets tried around the room's center when no wall spot
// works, in case the exact center collides with something already placed.
const CENTER_SEARCH_OFFSETS = [
  [0, 0],
  [0.3, 0], [-0.3, 0], [0, 0.3], [0, -0.3],
  [0.3, 0.3], [-0.3, 0.3], [0.3, -0.3], [-0.3, -0.3],
  [0.6, 0], [-0.6, 0], [0, 0.6], [0, -0.6]
];

/* ------------------------------------------------------------------ *
 * Defensive input sanitation — nothing below this point should throw
 * just because the caller passed something malformed.
 * ------------------------------------------------------------------ */

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function isValidFeature(f) {
  return !!(
    f &&
    typeof f === 'object' &&
    (f.type === 'door' || f.type === 'window') &&
    WALL_ORDER.includes(f.wall) &&
    isFiniteNumber(f.offset) &&
    isFiniteNumber(f.width) &&
    Number(f.width) >= 0
  );
}

function normalizeFeature(f, index) {
  return {
    id: f.id !== undefined && f.id !== null ? String(f.id) : `feature-${index}`,
    type: f.type,
    wall: f.wall,
    offset: Number(f.offset),
    width: Number(f.width)
  };
}

function isValidFurniture(item) {
  return !!(
    item &&
    typeof item === 'object' &&
    item.id !== undefined &&
    item.id !== null &&
    isFiniteNumber(item.width) &&
    isFiniteNumber(item.depth) &&
    Number(item.width) > 0 &&
    Number(item.depth) > 0
  );
}

function normalizeFurniture(item) {
  return {
    id: String(item.id),
    name: typeof item.name === 'string' && item.name.trim() ? item.name.trim() : `Item ${item.id}`,
    width: Number(item.width),
    depth: Number(item.depth),
    tall: item.tall === true
  };
}

/**
 * Normalizes a possibly-malformed RoomInput into one every function
 * below can safely assume is well-formed. Never throws.
 * @param {*} room
 * @returns {RoomInput}
 */
function sanitizeRoom(room) {
  const src = room && typeof room === 'object' ? room : {};
  const width = Number(src.width);
  const length = Number(src.length);
  const features = Array.isArray(src.features) ? src.features.filter(isValidFeature).map(normalizeFeature) : [];
  const furniture = Array.isArray(src.furniture) ? src.furniture.filter(isValidFurniture).map(normalizeFurniture) : [];

  return {
    width: Number.isFinite(width) && width > 0 ? width : 4,
    length: Number.isFinite(length) && length > 0 ? length : 4,
    features,
    furniture
  };
}

/* ------------------------------------------------------------------ *
 * Small pure geometry utilities
 * ------------------------------------------------------------------ */

function clamp(value, min, max) {
  if (min > max) return min;
  return Math.max(min, Math.min(max, value));
}

function footprintArea(item) {
  const w = Number(item && item.width) || 0;
  const d = Number(item && item.depth) || 0;
  return w * d;
}

/**
 * Returns the axis-aligned footprint {w, h} of a furniture item once its
 * rotation has been applied. 0/180 keep the item's natural orientation;
 * 90/270 swap width and depth.
 * @param {FurnitureItem} item
 * @param {number} rotation
 */
function getFootprint(item, rotation) {
  const w = Number(item && item.width) || 0;
  const d = Number(item && item.depth) || 0;
  const normalized = ((Number(rotation) % 360) + 360) % 360;
  return (normalized === 90 || normalized === 270) ? { w: d, h: w } : { w, h: d };
}

/** @returns {{x:number,y:number,w:number,h:number}} */
function getPlacementRect(placement, item) {
  const { w, h } = getFootprint(item, placement.rotation);
  return { x: placement.x, y: placement.y, w, h };
}

function rectWithinBounds(rect, room) {
  return (
    rect.x >= -EPS &&
    rect.y >= -EPS &&
    rect.x + rect.w <= room.width + EPS &&
    rect.y + rect.h <= room.length + EPS
  );
}

/**
 * Checks if two axis-aligned rectangles intersect. Rectangles that only
 * touch along an edge (flush placement, e.g. two sofas pushed together)
 * do NOT count as overlapping.
 * @param {{x:number,y:number,w:number,h:number}} a
 * @param {{x:number,y:number,w:number,h:number}} b
 */
function rectsOverlap(a, b) {
  const separate =
    a.x + a.w <= b.x + EPS ||
    b.x + b.w <= a.x + EPS ||
    a.y + a.h <= b.y + EPS ||
    b.y + b.h <= a.y + EPS;
  return !separate;
}

/** The point on a wall where a door/window is centered, in room coordinates. */
function getFeatureCenter(feature, room) {
  const offset = Number(feature.offset) || 0;
  const width = Number(feature.width) || 0;
  const mid = offset + width / 2;
  switch (feature.wall) {
    case 'north': return { x: mid, y: 0 };
    case 'south': return { x: mid, y: room.length };
    case 'west': return { x: 0, y: mid };
    case 'east': return { x: room.width, y: mid };
    default: return { x: 0, y: 0 };
  }
}

/**
 * Distance from an arbitrary point to the center of a door opening.
 * @param {number} px
 * @param {number} py
 * @param {RoomFeature} door
 * @param {RoomInput} room
 */
function distToDoor(px, py, door, room) {
  const center = getFeatureCenter(door, room);
  return Math.hypot(px - center.x, py - center.y);
}

/** Shortest distance from a rectangle's edge to a door's center point. */
function distanceFromRectToDoor(rect, door, room) {
  const center = getFeatureCenter(door, room);
  const closestX = clamp(center.x, rect.x, rect.x + rect.w);
  const closestY = clamp(center.y, rect.y, rect.y + rect.h);
  return distToDoor(closestX, closestY, door, room);
}

/** The rectangular no-go zone directly in front of a window. */
function getWindowClearZone(win, room) {
  const offset = Number(win.offset) || 0;
  const width = Number(win.width) || 0;
  const depth = WINDOW_CLEARANCE_DEPTH;
  switch (win.wall) {
    case 'north': return { x: offset, y: 0, w: width, h: depth };
    case 'south': return { x: offset, y: room.length - depth, w: width, h: depth };
    case 'west': return { x: 0, y: offset, w: depth, h: width };
    case 'east': return { x: room.width - depth, y: offset, w: depth, h: width };
    default: return { x: 0, y: 0, w: 0, h: 0 };
  }
}

/* ------------------------------------------------------------------ *
 * Constraint checks
 * ------------------------------------------------------------------ */

/**
 * True if placing the item at `placement` would put it within the 0.9m
 * clear radius in front of any door.
 * @param {Placement} placement
 * @param {Object.<string, FurnitureItem>} furnitureMap
 * @param {RoomFeature[]} features
 * @param {RoomInput} room
 */
function blocksDoor(placement, furnitureMap, features, room) {
  try {
    const item = furnitureMap && furnitureMap[placement.id];
    if (!item) return false;
    const rect = getPlacementRect(placement, item);
    const doors = (features || []).filter(f => f && f.type === 'door');

    for (const door of doors) {
      if (distanceFromRectToDoor(rect, door, room) < DOOR_CLEARANCE_RADIUS - EPS) return true;
    }
    return false;
  } catch (err) {
    return false; // never let a constraint check crash the engine
  }
}

/**
 * True if the item is tall AND its placement overlaps the clear zone in
 * front of any window. Short items always return false.
 * @param {Placement} placement
 * @param {Object.<string, FurnitureItem>} furnitureMap
 * @param {RoomFeature[]} features
 * @param {RoomInput} room
 */
function blocksWindow(placement, furnitureMap, features, room) {
  try {
    const item = furnitureMap && furnitureMap[placement.id];
    if (!item || !item.tall) return false;
    const rect = getPlacementRect(placement, item);
    const windows = (features || []).filter(f => f && f.type === 'window');

    for (const win of windows) {
      if (rectsOverlap(rect, getWindowClearZone(win, room))) return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

/**
 * All-in-one gate used while searching for a spot: bounds + overlap with
 * already-placed furniture + door clearance + (if tall) window access.
 */
function isValidPlacement(candidate, item, room, placedSoFar, furnitureMap) {
  try {
    const rect = getPlacementRect(candidate, item);
    if (!rectWithinBounds(rect, room)) return false;

    for (const other of placedSoFar) {
      const otherItem = furnitureMap[other.id];
      if (!otherItem) continue;
      if (rectsOverlap(rect, getPlacementRect(other, otherItem))) return false;
    }

    if (blocksDoor(candidate, furnitureMap, room.features, room)) return false;
    if (item.tall && blocksWindow(candidate, furnitureMap, room.features, room)) return false;

    return true;
  } catch (err) {
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Placement search
 * ------------------------------------------------------------------ */

function buildFurnitureMap(furniture) {
  const map = {};
  for (const item of furniture || []) {
    if (item && item.id !== undefined) map[item.id] = item;
  }
  return map;
}

/**
 * Slides `item` along one wall, corner to corner, in SLIDE_STEP
 * increments. At every step it tries rotation 0 then rotation 90 and
 * returns the first combination that clears every constraint.
 * @returns {{x:number, y:number, rotation:0|90} | null}
 */
function trySlideAlongWall(item, wall, room, placedSoFar, furnitureMap) {
  const wallLength = (wall === 'north' || wall === 'south') ? room.width : room.length;
  const stepCount = Math.min(Math.ceil(wallLength / SLIDE_STEP) + 1, MAX_SLIDE_ITERATIONS);

  for (let i = 0; i <= stepCount; i++) {
    const spot = i * SLIDE_STEP;

    for (const rotation of ROTATIONS_TO_TRY) {
      const { w: effW, h: effH } = getFootprint(item, rotation);
      if (effW > room.width + EPS || effH > room.length + EPS) continue;

      let x, y;
      if (wall === 'north' || wall === 'south') {
        x = Math.min(spot, room.width - effW);
        y = wall === 'north' ? 0 : room.length - effH;
      } else {
        y = Math.min(spot, room.length - effH);
        x = wall === 'west' ? 0 : room.width - effW;
      }

      const candidate = { id: item.id, x, y, rotation };
      if (isValidPlacement(candidate, item, room, placedSoFar, furnitureMap)) {
        return { x, y, rotation };
      }
    }
  }
  return null;
}

/**
 * Fallback #1: try the center of the room (and a small ring around it,
 * in case the exact center collides with something), avoiding doors,
 * overlaps, and — for tall items — windows.
 * @returns {{x:number, y:number, rotation:0|90} | null}
 */
function tryCenterPlacement(item, room, placedSoFar, furnitureMap) {
  for (const rotation of ROTATIONS_TO_TRY) {
    const { w, h } = getFootprint(item, rotation);
    if (w > room.width + EPS || h > room.length + EPS) continue;

    const baseX = (room.width - w) / 2;
    const baseY = (room.length - h) / 2;

    for (const [dx, dy] of CENTER_SEARCH_OFFSETS) {
      const x = clamp(baseX + dx, 0, Math.max(0, room.width - w));
      const y = clamp(baseY + dy, 0, Math.max(0, room.length - h));
      const candidate = { id: item.id, x, y, rotation };
      if (isValidPlacement(candidate, item, room, placedSoFar, furnitureMap)) {
        return { x, y, rotation };
      }
    }
  }
  return null;
}

function buildWallTrace(item, wall, placement, room) {
  try {
    const rect = getPlacementRect(placement, item);
    const doors = (room.features || []).filter(f => f && f.type === 'door');

    let distanceNote = '';
    if (doors.length > 0) {
      let nearest = Infinity;
      for (const door of doors) {
        const d = distanceFromRectToDoor(rect, door, room);
        if (d < nearest) nearest = d;
      }
      if (Number.isFinite(nearest)) distanceNote = `, ${nearest.toFixed(1)}m from the nearest door`;
    }

    const rotationNote = placement.rotation ? ` (rotated ${placement.rotation}°)` : '';
    return `${item.name} placed along the ${wall} wall${rotationNote}${distanceNote}.`;
  } catch (err) {
    return `${item && item.name ? item.name : 'Item'} placed along the ${wall} wall.`;
  }
}

/**
 * Finds a spot for one furniture item: walls first (N, E, S, W), then
 * the center of the room, then a guaranteed corner fallback. Never
 * throws — the worst case is an explicit FALLBACK trace.
 * @returns {{placement: Placement, trace: string}}
 */
function placeItem(item, room, placedSoFar, furnitureMap) {
  for (const wall of WALL_ORDER) {
    const spot = trySlideAlongWall(item, wall, room, placedSoFar, furnitureMap);
    if (spot) {
      const placement = { id: item.id, x: spot.x, y: spot.y, rotation: spot.rotation };
      return { placement, trace: buildWallTrace(item, wall, placement, room) };
    }
  }

  const centerSpot = tryCenterPlacement(item, room, placedSoFar, furnitureMap);
  if (centerSpot) {
    const placement = { id: item.id, x: centerSpot.x, y: centerSpot.y, rotation: centerSpot.rotation };
    return {
      placement,
      trace: `${item.name} didn't fit against any wall, so it was placed near the center of the room instead.`
    };
  }

  const placement = { id: item.id, x: 0.1, y: 0.1, rotation: 0 };
  return {
    placement,
    trace: `FALLBACK: no valid position found for ${item.name} — placed at (0.1, 0.1) as a last resort. Manual adjustment recommended.`
  };
}

/* ------------------------------------------------------------------ *
 * Public API #1 — generateLayout
 * ------------------------------------------------------------------ */

/**
 * Generates a full furniture layout for a room using a greedy,
 * constraint-based heuristic: largest items first, walls before the
 * center, corner-fallback before giving up. Never throws.
 * @param {RoomInput} room
 * @returns {LayoutResult}
 */
function generateLayout(room) {
  try {
    const safeRoom = sanitizeRoom(room);
    const furnitureMap = buildFurnitureMap(safeRoom.furniture);
    const orderedFurniture = [...safeRoom.furniture].sort((a, b) => footprintArea(b) - footprintArea(a));

    const placements = [];
    const traces = [];

    for (const item of orderedFurniture) {
      try {
        const { placement, trace } = placeItem(item, safeRoom, placements, furnitureMap);
        placements.push(placement);
        traces.push(trace);
      } catch (itemErr) {
        placements.push({ id: item.id, x: 0.1, y: 0.1, rotation: 0 });
        traces.push(`FALLBACK: ${item.name} placed at (0.1, 0.1) after an unexpected error (${itemErr && itemErr.message ? itemErr.message : 'unknown error'}).`);
      }
    }

    const audit = auditRoom(safeRoom, placements, traces);
    return { placements, audit };
  } catch (err) {
    return {
      placements: [],
      audit: {
        overallScore: 0,
        trafficFlow: 0,
        doorClearance: 0,
        windowAccess: 0,
        pros: [],
        warnings: [`Layout generation failed unexpectedly: ${err && err.message ? err.message : String(err)}`],
        traces: []
      }
    };
  }
}

/* ------------------------------------------------------------------ *
 * Public API #2 — auditRoom
 * ------------------------------------------------------------------ */

function isNearWall(placement, item, room) {
  try {
    const { w, h } = getFootprint(item, placement.rotation);
    const nearNorth = placement.y <= NEAR_WALL_THRESHOLD;
    const nearWest = placement.x <= NEAR_WALL_THRESHOLD;
    const nearSouth = (room.length - (placement.y + h)) <= NEAR_WALL_THRESHOLD;
    const nearEast = (room.width - (placement.x + w)) <= NEAR_WALL_THRESHOLD;
    return nearNorth || nearSouth || nearWest || nearEast;
  } catch (err) {
    return true; // fail-safe: don't penalize traffic flow on unexpected data
  }
}

/**
 * Scores a proposed layout on door clearance, window access, and
 * traffic flow, then combines them into a weighted overall score. Can
 * be called independently of generateLayout (e.g. after a user manually
 * drags furniture around). Never throws.
 * @param {RoomInput} room
 * @param {Placement[]} placements
 * @param {string[]} traces
 * @returns {AuditReport}
 */
function auditRoom(room, placements, traces) {
  try {
    const safeRoom = sanitizeRoom(room);
    const furnitureMap = buildFurnitureMap(safeRoom.furniture);
    const safePlacements = Array.isArray(placements) ? placements : [];
    const safeTraces = Array.isArray(traces) ? traces : [];

    let doorBlockCount = 0;
    let windowBlockCount = 0;
    let floatingCount = 0;

    for (const placement of safePlacements) {
      const item = furnitureMap[placement && placement.id];
      if (!item) continue;

      if (blocksDoor(placement, furnitureMap, safeRoom.features, safeRoom)) doorBlockCount++;
      if (item.tall && blocksWindow(placement, furnitureMap, safeRoom.features, safeRoom)) windowBlockCount++;
      if (!isNearWall(placement, item, safeRoom)) floatingCount++;
    }

    const doorClearance = clamp(100 - doorBlockCount * 20, 0, 100);
    const windowAccess = clamp(100 - windowBlockCount * 15, 0, 100);
    const trafficFlow = clamp(100 - floatingCount * 5, 0, 100);
    const overallScore = Math.round(doorClearance * 0.4 + windowAccess * 0.3 + trafficFlow * 0.3);

    const pros = [];
    const warnings = [];

    if (safePlacements.length === 0) {
      pros.push('No furniture to audit — the room is currently empty.');
    } else {
      if (doorClearance > 80) pros.push('All doorways remain clear for easy access.');
      else if (doorClearance < 60) warnings.push(`${doorBlockCount} item(s) block a door's swing — keep at least ${DOOR_CLEARANCE_RADIUS}m clear in front of each door.`);

      if (windowAccess > 80) pros.push('Tall furniture stays clear of the windows, preserving light and sightlines.');
      else if (windowAccess < 60) warnings.push(`${windowBlockCount} tall item(s) block window access — consider relocating them or using shorter pieces there.`);

      if (trafficFlow > 80) pros.push('Furniture hugs the walls, leaving the floor open for foot traffic.');
      else if (trafficFlow < 60) warnings.push(`${floatingCount} item(s) are floating away from the walls, which may crowd the walking paths.`);

      if (overallScore >= 90) pros.push('Overall, this is a highly functional layout with minimal spatial conflicts.');
      else if (overallScore < 50) warnings.push('Overall layout has significant spatial issues and should be revised.');
    }

    if (safeTraces.some(t => typeof t === 'string' && t.toUpperCase().includes('FALLBACK'))) {
      warnings.push('One or more items could not be placed ideally and were positioned as a fallback — manual adjustment is recommended.');
    }

    return { overallScore, trafficFlow, doorClearance, windowAccess, pros, warnings, traces: safeTraces };
  } catch (err) {
    return {
      overallScore: 0,
      trafficFlow: 0,
      doorClearance: 0,
      windowAccess: 0,
      pros: [],
      warnings: [`Audit failed unexpectedly: ${err && err.message ? err.message : String(err)}`],
      traces: Array.isArray(traces) ? traces : []
    };
  }
}

/* ------------------------------------------------------------------ *
 * Demo-only helper: a plain-text top-down floor plan. Used exclusively
 * by the self-test below; not part of the public API.
 * ------------------------------------------------------------------ */

function renderFloorPlanAscii(room, placements, furnitureMap) {
  const CELL = 0.25;
  const cols = Math.max(1, Math.round(room.width / CELL));
  const rows = Math.max(1, Math.round(room.length / CELL));
  const grid = Array.from({ length: rows }, () => new Array(cols).fill('·'));

  for (const feature of room.features || []) {
    const mark = feature.type === 'door' ? 'D' : 'W';
    const startCell = Math.floor((Number(feature.offset) || 0) / CELL);
    const spanCells = Math.max(1, Math.round((Number(feature.width) || 0) / CELL));
    for (let i = 0; i < spanCells; i++) {
      if (feature.wall === 'north' || feature.wall === 'south') {
        const c = clamp(startCell + i, 0, cols - 1);
        grid[feature.wall === 'north' ? 0 : rows - 1][c] = mark;
      } else {
        const r = clamp(startCell + i, 0, rows - 1);
        grid[r][feature.wall === 'west' ? 0 : cols - 1] = mark;
      }
    }
  }

  for (const placement of placements) {
    const item = furnitureMap[placement.id];
    if (!item) continue;
    const { w, h } = getFootprint(item, placement.rotation);
    const symbol = ((item.name || '?').trim().charAt(0) || '?').toUpperCase();
    const c0 = clamp(Math.floor(placement.x / CELL), 0, cols - 1);
    const c1 = clamp(Math.ceil((placement.x + w) / CELL) - 1, 0, cols - 1);
    const r0 = clamp(Math.floor(placement.y / CELL), 0, rows - 1);
    const r1 = clamp(Math.ceil((placement.y + h) / CELL) - 1, 0, rows - 1);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) grid[r][c] = symbol;
    }
  }

  const border = '+' + '-'.repeat(cols) + '+';
  return [border, ...grid.map(row => '|' + row.join('') + '|'), border].join('\n');
}

/* ------------------------------------------------------------------ *
 * Cross-environment self-test.
 * Runs only when this file is executed directly with `node
 * layoutEngine.js`; importing it (from Node or a browser bundle) never
 * triggers this block.
 * ------------------------------------------------------------------ */
if (typeof process !== 'undefined' && process.argv[1] && process.argv[1].toLowerCase().includes('layoutengine')) {
  const demoRoom = {
    width: 5,
    length: 4,
    features: [
      { id: 'door-1', type: 'door', wall: 'south', offset: 1.8, width: 0.9 },
      { id: 'window-1', type: 'window', wall: 'north', offset: 1.0, width: 1.5 }
    ],
    furniture: [
      { id: 'sofa', name: 'Sofa', width: 2.0, depth: 0.9 },
      { id: 'armchair', name: 'Armchair', width: 0.85, depth: 0.85 },
      { id: 'tv-stand', name: 'TV Stand', width: 1.6, depth: 0.4 },
      { id: 'coffee-table', name: 'Coffee Table', width: 1.0, depth: 0.55 },
      { id: 'bookshelf', name: 'Bookshelf', width: 0.9, depth: 0.3, tall: true },
      { id: 'side-table', name: 'Side Table', width: 0.45, depth: 0.45 },
      { id: 'floor-lamp', name: 'Floor Lamp', width: 0.35, depth: 0.35, tall: true }
    ]
  };

  const rule = '='.repeat(62);
  const thinRule = '-'.repeat(62);
  const furnitureMap = buildFurnitureMap(demoRoom.furniture);

  console.log(rule);
  console.log('  LAYOUT ENGINE — SELF TEST');
  console.log(rule);
  console.log(`  Room:      ${demoRoom.width}m x ${demoRoom.length}m`);
  console.log(`  Features:  ${demoRoom.features.map(f => `${f.type} (${f.wall})`).join(', ')}`);
  console.log(`  Furniture: ${demoRoom.furniture.length} items`);

  const result = generateLayout(demoRoom);

  console.log('\n' + thinRule);
  console.log('  PLACEMENTS');
  console.log(thinRule);
  for (const p of result.placements) {
    const item = furnitureMap[p.id] || { name: p.id };
    console.log(`  • ${item.name.padEnd(14)} x=${p.x.toFixed(2)}  y=${p.y.toFixed(2)}  rot=${p.rotation}°`);
  }

  console.log('\n' + thinRule);
  console.log('  TRACES');
  console.log(thinRule);
  result.audit.traces.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));

  console.log('\n' + thinRule);
  console.log('  TOP-DOWN FLOOR PLAN   (D = door, W = window)');
  console.log(thinRule);
  console.log(renderFloorPlanAscii(demoRoom, result.placements, furnitureMap));

  console.log('\n' + rule);
  console.log('  AUDIT REPORT');
  console.log(rule);
  console.log(`  Overall Score:   ${result.audit.overallScore} / 100`);
  console.log(`  Door Clearance:  ${result.audit.doorClearance} / 100`);
  console.log(`  Window Access:   ${result.audit.windowAccess} / 100`);
  console.log(`  Traffic Flow:    ${result.audit.trafficFlow} / 100`);

  if (result.audit.pros.length) {
    console.log('\n  Pros:');
    result.audit.pros.forEach(p => console.log(`    ✓ ${p}`));
  }
  if (result.audit.warnings.length) {
    console.log('\n  Warnings:');
    result.audit.warnings.forEach(w => console.log(`    ⚠ ${w}`));
  }

  console.log('\n' + rule);
  console.log('  Self-test complete.');
  console.log(rule);
}

export { generateLayout, auditRoom };