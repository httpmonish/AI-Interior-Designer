// ============================================================
// RoomMind AI — Layout Engine (Deterministic AI Optimizer)
// ============================================================
import { Room, FurnitureItem, LifestyleProfile, AILayout, FurnitureMove, LayoutVariant, Vec3 } from '../types';
import { calculateDesignScore } from './ScoreEngine';
import { furnitureAABB, aabbOverlap, aabbDistance } from './CollisionEngine';

const MIN_WALL_GAP = 5;      // cm
const MIN_CLEARANCE = 60;     // cm
const DOOR_ZONE = 100;        // cm
const WINDOW_ZONE = 50;       // cm

/**
 * Generate 3 optimized layout variants.
 */
export function generateLayouts(
  rooms: Room[],
  furniture: FurnitureItem[],
  lifestyle: LifestyleProfile
): AILayout[] {
  return [
    optimizeLayout(rooms, furniture, lifestyle, 'smart-balance'),
    optimizeLayout(rooms, furniture, lifestyle, 'open-space'),
    optimizeLayout(rooms, furniture, lifestyle, 'lifestyle-focus'),
  ];
}

function optimizeLayout(
  rooms: Room[],
  furniture: FurnitureItem[],
  lifestyle: LifestyleProfile,
  variant: LayoutVariant
): AILayout {
  const optimized = JSON.parse(JSON.stringify(furniture)) as FurnitureItem[];
  const moves: FurnitureMove[] = [];

  for (const room of rooms) {
    const roomFurn = optimized.filter(f => f.roomId === room.id);
    const rX = room.position.x;
    const rZ = room.position.z;
    const rW = room.dimensions.width;
    const rL = room.dimensions.length;

    // Sort furniture by importance
    const sorted = sortByImportance(roomFurn, lifestyle, variant);

    for (const f of sorted) {
      const oldPos = { ...f.position };
      const oldRot = { ...f.rotation };

      // Determine ideal position based on variant
      const idealPos = getIdealPosition(f, room, lifestyle, variant, optimized);

      // Ensure the furniture stays within room bounds
      const clampedPos = clampToRoom(idealPos, f.dimensions.width, f.dimensions.depth, rX, rZ, rW, rL);

      // Resolve collisions
      const resolvedPos = resolveCollisions(clampedPos, f, optimized.filter(o => o.id !== f.id && o.roomId === room.id), rX, rZ, rW, rL);

      // Determine ideal rotation
      const idealRot = getIdealRotation(f, room, variant, lifestyle);

      // Apply
      f.position = resolvedPos;
      f.rotation = idealRot;

      // Update in the optimized array
      const idx = optimized.findIndex(o => o.id === f.id);
      if (idx >= 0) {
        optimized[idx] = { ...f };
      }

      // Record move if significant
      const dist = Math.sqrt(
        (resolvedPos.x - oldPos.x) ** 2 +
        (resolvedPos.z - oldPos.z) ** 2
      );

      if (dist > 10 || Math.abs(idealRot.y - oldRot.y) > 5) {
        moves.push({
          furnitureId: f.id,
          furnitureName: f.name,
          fromPosition: oldPos,
          toPosition: resolvedPos,
          fromRotation: oldRot,
          toRotation: idealRot,
          reason: generateReason(f, room, oldPos, resolvedPos, idealRot, oldRot, lifestyle, variant),
        });
      }
    }
  }

  const metrics = calculateDesignScore(rooms, optimized, lifestyle);

  const names: Record<LayoutVariant, string> = {
    'smart-balance': 'Smart Balance',
    'open-space': 'Open Space',
    'lifestyle-focus': 'Lifestyle Focus',
  };

  const descriptions: Record<LayoutVariant, string> = {
    'smart-balance': 'Best overall combination of walkability, functionality, and aesthetics.',
    'open-space': 'Maximum movement and openness, prioritizing clear floor space.',
    'lifestyle-focus': `Optimized around your ${lifestyle.activities.join(', ')} lifestyle.`,
  };

  return {
    id: `layout-${variant}`,
    variant,
    name: names[variant],
    description: descriptions[variant],
    furniture: optimized,
    metrics,
    moves,
  };
}

function sortByImportance(
  furniture: FurnitureItem[],
  lifestyle: LifestyleProfile,
  variant: LayoutVariant
): FurnitureItem[] {
  const priority: Record<string, number> = {};

  for (const f of furniture) {
    let score = 0;

    // Large furniture first (they're harder to place)
    score += (f.dimensions.width * f.dimensions.depth) / 10000;

    // Category importance
    if (f.category === 'beds') score += 10;
    if (f.category === 'desks' && lifestyle.activities.includes('studying')) score += 9;
    if (f.category === 'seating') score += 8;
    if (f.category === 'tv-media') score += 7;
    if (f.category === 'storage') score += 6;
    if (f.category === 'tables') score += 5;

    if (variant === 'lifestyle-focus') {
      if (lifestyle.activities.includes('working') && f.category === 'desks') score += 5;
      if (lifestyle.activities.includes('gaming') && f.category === 'tv-media') score += 5;
      if (lifestyle.activities.includes('relaxing') && f.category === 'seating') score += 5;
    }

    priority[f.id] = score;
  }

  return [...furniture].sort((a, b) => (priority[b.id] || 0) - (priority[a.id] || 0));
}

function getIdealPosition(
  f: FurnitureItem,
  room: Room,
  lifestyle: LifestyleProfile,
  variant: LayoutVariant,
  allFurniture: FurnitureItem[]
): Vec3 {
  const rX = room.position.x;
  const rZ = room.position.z;
  const rW = room.dimensions.width;
  const rL = room.dimensions.length;
  const cx = rX + rW / 2;
  const cz = rZ + rL / 2;

  // Find window walls for natural light
  const windowWalls = room.windows.map(w => w.wall);
  // Find door walls to avoid
  const doorWalls = room.doors.map(d => d.wall);

  switch (f.category) {
    case 'beds': {
      // Bed against a wall, opposite to door if possible
      const bestWall = findBestWall(room, doorWalls, windowWalls, 'opposite-door');
      return positionAgainstWall(bestWall, rX, rZ, rW, rL, f.dimensions.width, f.dimensions.depth, 0.5);
    }

    case 'desks': {
      if (lifestyle.priorities.includes('natural-light') && windowWalls.length > 0) {
        // Desk near window
        const winWall = windowWalls[0];
        return positionNearWall(winWall, rX, rZ, rW, rL, f.dimensions.width, f.dimensions.depth, 0.5, 30);
      }
      // Desk against a non-door wall
      const bestWall = findBestWall(room, doorWalls, windowWalls, 'near-window');
      return positionAgainstWall(bestWall, rX, rZ, rW, rL, f.dimensions.width, f.dimensions.depth, 0.3);
    }

    case 'seating': {
      if (f.templateId?.includes('sofa')) {
        if (variant === 'open-space') {
          // Sofa against longest wall
          const longWall = rW >= rL ? 'south' : 'east';
          return positionAgainstWall(longWall, rX, rZ, rW, rL, f.dimensions.width, f.dimensions.depth, 0.5);
        }
        // Sofa facing TV or center
        const tvItem = allFurniture.find(o => o.category === 'tv-media' && o.roomId === room.id && o.templateId?.includes('tv-unit'));
        if (tvItem) {
          // Position facing TV with distance
          return {
            x: tvItem.position.x + (tvItem.dimensions.width - f.dimensions.width) / 2,
            y: 0,
            z: tvItem.position.z + tvItem.dimensions.depth + 180,
          };
        }
        // Center-ish position
        return { x: cx - f.dimensions.width / 2, y: 0, z: cz + 30 };
      }
      if (f.templateId?.includes('armchair')) {
        // Armchair: complement to sofa, offset to the side
        const sofa = allFurniture.find(o => o.templateId?.includes('sofa') && o.roomId === room.id);
        if (sofa) {
          return {
            x: sofa.position.x + sofa.dimensions.width + 40,
            y: 0,
            z: sofa.position.z - 20,
          };
        }
        return { x: cx + 100, y: 0, z: cz };
      }
      // Other seating: keep near tables
      return { x: f.position.x, y: 0, z: f.position.z };
    }

    case 'tv-media': {
      if (f.templateId?.includes('tv-unit') || f.templateId?.includes('tv-55')) {
        // TV against wall, away from windows (reduce glare)
        const noWinWall = findBestWall(room, windowWalls, [], 'no-match');
        return positionAgainstWall(noWinWall, rX, rZ, rW, rL, f.dimensions.width, f.dimensions.depth, 0.5);
      }
      return { x: f.position.x, y: f.position.y, z: f.position.z };
    }

    case 'storage': {
      // Storage against longest available wall
      const bestWall = findBestWall(room, doorWalls, windowWalls, 'longest');
      return positionAgainstWall(bestWall, rX, rZ, rW, rL, f.dimensions.width, f.dimensions.depth, 0.8);
    }

    case 'tables': {
      if (f.templateId?.includes('coffee')) {
        // Coffee table centered between seating
        const sofa = allFurniture.find(o => o.templateId?.includes('sofa') && o.roomId === room.id);
        if (sofa) {
          return {
            x: sofa.position.x + (sofa.dimensions.width - f.dimensions.width) / 2,
            y: 0,
            z: sofa.position.z - f.dimensions.depth - 45,
          };
        }
        return { x: cx - f.dimensions.width / 2, y: 0, z: cz - f.dimensions.depth / 2 };
      }
      if (f.templateId?.includes('dining')) {
        // Dining table with space around it
        return { x: cx - f.dimensions.width / 2, y: 0, z: cz - f.dimensions.depth / 2 };
      }
      return { x: f.position.x, y: f.position.y, z: f.position.z };
    }

    case 'lighting': {
      // Floor lamps: corner placement
      if (f.templateId?.includes('floor')) {
        return { x: rX + 20, y: 0, z: rZ + 20 };
      }
      return { x: f.position.x, y: f.position.y, z: f.position.z };
    }

    case 'plants': {
      // Plants near windows or in corners
      if (windowWalls.length > 0) {
        const ww = windowWalls[windowWalls.length - 1]; // use last window
        return positionNearWall(ww, rX, rZ, rW, rL, f.dimensions.width, f.dimensions.depth, 0.9, 20);
      }
      // Corner
      return { x: rX + rW - f.dimensions.width - 15, y: 0, z: rZ + 15 };
    }

    case 'decor': {
      if (f.templateId?.includes('rug')) {
        // Rug centered in room
        return { x: cx - f.dimensions.width / 2, y: 0, z: cz - f.dimensions.depth / 2 };
      }
      return { x: f.position.x, y: f.position.y, z: f.position.z };
    }

    default:
      return { x: f.position.x, y: f.position.y, z: f.position.z };
  }
}

function getIdealRotation(
  f: FurnitureItem,
  room: Room,
  _variant: LayoutVariant,
  _lifestyle: LifestyleProfile
): Vec3 {
  // Most furniture faces the center or stays axis-aligned
  const rX = room.position.x;
  const rZ = room.position.z;
  const rW = room.dimensions.width;
  const rL = room.dimensions.length;

  // Check which wall the furniture is closest to
  const margins = [
    { wall: 'north', dist: f.position.z - rZ },
    { wall: 'south', dist: (rZ + rL) - (f.position.z + f.dimensions.depth) },
    { wall: 'east', dist: (rX + rW) - (f.position.x + f.dimensions.width) },
    { wall: 'west', dist: f.position.x - rX },
  ].sort((a, b) => a.dist - b.dist);

  const nearestWall = margins[0].wall;

  // Furniture against a wall should face away from it
  switch (nearestWall) {
    case 'north': return { x: 0, y: 0, z: 0 };   // facing south (into room)
    case 'south': return { x: 0, y: 180, z: 0 };  // facing north
    case 'east':  return { x: 0, y: -90, z: 0 };  // facing west
    case 'west':  return { x: 0, y: 90, z: 0 };   // facing east
  }

  return f.rotation;
}

function findBestWall(
  room: Room,
  avoidWalls: string[],
  preferWalls: string[],
  strategy: 'opposite-door' | 'near-window' | 'longest' | 'no-match'
): string {
  const walls = ['north', 'south', 'east', 'west'];
  const available = walls.filter(w => !avoidWalls.includes(w));

  if (strategy === 'near-window' && preferWalls.length > 0) {
    const preferred = available.filter(w => preferWalls.includes(w));
    if (preferred.length > 0) return preferred[0];
  }

  if (strategy === 'no-match') {
    // avoid preferWalls too
    const none = available.filter(w => !preferWalls.includes(w));
    if (none.length > 0) return none[0];
  }

  if (strategy === 'longest') {
    const rW = room.dimensions.width;
    const rL = room.dimensions.length;
    if (rW >= rL) {
      if (available.includes('north')) return 'north';
      if (available.includes('south')) return 'south';
    } else {
      if (available.includes('east')) return 'east';
      if (available.includes('west')) return 'west';
    }
  }

  if (strategy === 'opposite-door') {
    const doorWalls = room.doors.map(d => d.wall);
    const opposite: Record<string, string> = { north: 'south', south: 'north', east: 'west', west: 'east' };
    for (const dw of doorWalls) {
      const opp = opposite[dw];
      if (available.includes(opp)) return opp;
    }
  }

  return available[0] || 'north';
}

function positionAgainstWall(
  wall: string,
  rX: number, rZ: number, rW: number, rL: number,
  fW: number, fD: number,
  along: number // 0-1, where along the wall
): Vec3 {
  const offset = MIN_WALL_GAP;

  switch (wall) {
    case 'north':
      return { x: rX + (rW - fW) * along, y: 0, z: rZ + offset };
    case 'south':
      return { x: rX + (rW - fW) * along, y: 0, z: rZ + rL - fD - offset };
    case 'east':
      return { x: rX + rW - fW - offset, y: 0, z: rZ + (rL - fD) * along };
    case 'west':
      return { x: rX + offset, y: 0, z: rZ + (rL - fD) * along };
  }

  return { x: rX + (rW - fW) / 2, y: 0, z: rZ + (rL - fD) / 2 };
}

function positionNearWall(
  wall: string,
  rX: number, rZ: number, rW: number, rL: number,
  fW: number, fD: number,
  along: number,
  gap: number
): Vec3 {
  switch (wall) {
    case 'north':
      return { x: rX + (rW - fW) * along, y: 0, z: rZ + gap };
    case 'south':
      return { x: rX + (rW - fW) * along, y: 0, z: rZ + rL - fD - gap };
    case 'east':
      return { x: rX + rW - fW - gap, y: 0, z: rZ + (rL - fD) * along };
    case 'west':
      return { x: rX + gap, y: 0, z: rZ + (rL - fD) * along };
  }
  return { x: rX + (rW - fW) / 2, y: 0, z: rZ + (rL - fD) / 2 };
}

function clampToRoom(pos: Vec3, fW: number, fD: number, rX: number, rZ: number, rW: number, rL: number): Vec3 {
  return {
    x: Math.max(rX + MIN_WALL_GAP, Math.min(rX + rW - fW - MIN_WALL_GAP, pos.x)),
    y: pos.y,
    z: Math.max(rZ + MIN_WALL_GAP, Math.min(rZ + rL - fD - MIN_WALL_GAP, pos.z)),
  };
}

function resolveCollisions(
  pos: Vec3,
  self: FurnitureItem,
  others: FurnitureItem[],
  rX: number, rZ: number, rW: number, rL: number
): Vec3 {
  let resolved = { ...pos };
  const step = 5;
  const maxIters = 20;

  for (let iter = 0; iter < maxIters; iter++) {
    let hasCollision = false;
    let pushX = 0;
    let pushZ = 0;

    const selfBox = {
      minX: resolved.x,
      maxX: resolved.x + self.dimensions.width,
      minZ: resolved.z,
      maxZ: resolved.z + self.dimensions.depth,
    };

    for (const other of others) {
      const otherBox = furnitureAABB(other);
      const expandedBox = {
        minX: otherBox.minX - MIN_CLEARANCE,
        maxX: otherBox.maxX + MIN_CLEARANCE,
        minZ: otherBox.minZ - MIN_CLEARANCE,
        maxZ: otherBox.maxZ + MIN_CLEARANCE,
      };

      if (aabbOverlap(selfBox, expandedBox)) {
        hasCollision = true;

        const pr = expandedBox.maxX - selfBox.minX;
        const pl = selfBox.maxX - expandedBox.minX;
        const pd = expandedBox.maxZ - selfBox.minZ;
        const pu = selfBox.maxZ - expandedBox.minZ;

        const minPush = Math.min(pr, pl, pd, pu);

        if (minPush === pr) pushX += step;
        else if (minPush === pl) pushX -= step;
        else if (minPush === pd) pushZ += step;
        else pushZ -= step;
      }
    }

    if (!hasCollision) break;

    resolved.x += pushX;
    resolved.z += pushZ;

    // Clamp after each push so we don't wander off into infinity
    resolved = clampToRoom(resolved, self.dimensions.width, self.dimensions.depth, rX, rZ, rW, rL);
    
    // If pushing against a wall but another object is trapping us, we might just stop.
    if (pushX === 0 && pushZ === 0) break;
  }

  return resolved;
}

function generateReason(
  f: FurnitureItem,
  room: Room,
  oldPos: Vec3,
  newPos: Vec3,
  newRot: Vec3,
  oldRot: Vec3,
  lifestyle: LifestyleProfile,
  variant: LayoutVariant
): string {
  const dx = Math.round(Math.abs(newPos.x - oldPos.x));
  const dz = Math.round(Math.abs(newPos.z - oldPos.z));
  const dist = Math.round(Math.sqrt(dx * dx + dz * dz));
  const rotated = Math.abs(newRot.y - oldRot.y) > 5;

  // Determine context
  const nearWindow = room.windows.some(w => {
    const wall = w.wall;
    switch (wall) {
      case 'north': return newPos.z < room.position.z + 80;
      case 'south': return newPos.z + f.dimensions.depth > room.position.z + room.dimensions.length - 80;
      case 'east': return newPos.x + f.dimensions.width > room.position.x + room.dimensions.width - 80;
      case 'west': return newPos.x < room.position.x + 80;
    }
    return false;
  });

  const nearDoor = room.doors.some(d => {
    const wall = d.wall;
    switch (wall) {
      case 'north': return oldPos.z < room.position.z + 120;
      case 'south': return oldPos.z + f.dimensions.depth > room.position.z + room.dimensions.length - 120;
      case 'east': return oldPos.x + f.dimensions.width > room.position.x + room.dimensions.width - 120;
      case 'west': return oldPos.x < room.position.x + 120;
    }
    return false;
  });

  if (f.category === 'desks' && nearWindow && lifestyle.priorities.includes('natural-light')) {
    return `Moved next to the window because natural light was selected as a priority.`;
  }

  if (f.category === 'seating' && f.templateId?.includes('sofa') && nearDoor) {
    return `Moved ${dist} cm away from the entrance to improve circulation.`;
  }

  if (f.category === 'tv-media') {
    return `Aligned with the primary seating position for optimal viewing.`;
  }

  if (f.category === 'storage') {
    return `Moved against the longest wall to preserve usable floor space.`;
  }

  if (f.templateId?.includes('coffee')) {
    return `Centered between seating while maintaining recommended clearance.`;
  }

  if (f.category === 'plants' && nearWindow) {
    return `Positioned near the window for natural light exposure.`;
  }

  if (variant === 'open-space') {
    return `Repositioned to maximize open floor space (moved ${dist} cm).`;
  }

  if (variant === 'lifestyle-focus') {
    return `Adjusted to better support your ${lifestyle.activities[0] || 'daily'} activities.`;
  }

  if (rotated && dist > 5) {
    return `Moved ${dist} cm and rotated for better room flow and accessibility.`;
  }

  if (dist > 5) {
    return `Repositioned ${dist} cm to improve overall room balance and clearance.`;
  }

  return `Fine-tuned position for optimal placement.`;
}

/**
 * Fix a specific health issue by moving the problematic furniture
 */
export function fixHealthIssue(
  furnitureId: string,
  rooms: Room[],
  furniture: FurnitureItem[]
): FurnitureItem[] {
  const updated = JSON.parse(JSON.stringify(furniture)) as FurnitureItem[];
  const target = updated.find(f => f.id === furnitureId);
  if (!target) return updated;

  const room = rooms.find(r => r.id === target.roomId);
  if (!room) return updated;

  const rX = room.position.x;
  const rZ = room.position.z;
  const rW = room.dimensions.width;
  const rL = room.dimensions.length;

  // Try to find a non-colliding position
  const others = updated.filter(f => f.id !== furnitureId && f.roomId === room.id);

  // Strategy: move furniture in the direction with most space
  const bestPos = resolveCollisions(
    target.position,
    target,
    others,
    rX, rZ, rW, rL
  );

  target.position = bestPos;
  return updated;
}

/**
 * Process a "what-if" scenario and return impact
 */
export function whatIfAddFurniture(
  templateId: string,
  name: string,
  dimensions: { width: number; depth: number; height: number },
  roomId: string,
  rooms: Room[],
  furniture: FurnitureItem[],
  lifestyle: LifestyleProfile
): { newFurniture: FurnitureItem[]; furnitureId: string } {
  const room = rooms.find(r => r.id === roomId);
  if (!room) return { newFurniture: furniture, furnitureId: '' };

  const rX = room.position.x;
  const rZ = room.position.z;
  const rW = room.dimensions.width;
  const rL = room.dimensions.length;

  // Find the best position for the new furniture
  const newId = `whatif-${Date.now()}`;
  const newItem: FurnitureItem = {
    id: newId,
    templateId,
    name,
    category: 'desks', // will be inferred from template
    dimensions,
    position: { x: rX + rW / 2 - dimensions.width / 2, y: 0, z: rZ + rL / 2 - dimensions.depth / 2 },
    rotation: { x: 0, y: 0, z: 0 },
    color: '#A0856E',
    material: { id: 'mat-new', name: 'Default', category: 'furniture', color: '#A0856E', roughness: 0.7, metalness: 0 },
    roomId,
    locked: false,
  };

  const allFurn = [...furniture, newItem];

  // Resolve collisions for the new item
  const resolved = resolveCollisions(
    newItem.position,
    newItem,
    furniture.filter(f => f.roomId === roomId),
    rX, rZ, rW, rL
  );
  newItem.position = resolved;

  return { newFurniture: allFurn, furnitureId: newId };
}
