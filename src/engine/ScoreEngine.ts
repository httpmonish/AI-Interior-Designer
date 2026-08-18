// ============================================================
// RoomMind AI — Score Engine
// ============================================================
import { Room, FurnitureItem, RoomWindow, Door, DesignMetrics, LifestyleProfile } from '../types';

const CM_TO_M = 0.01;

/**
 * Calculate the overall design score for a room with placed furniture.
 */
export function calculateDesignScore(
  rooms: Room[],
  furniture: FurnitureItem[],
  lifestyle: LifestyleProfile
): DesignMetrics {
  const spaceEfficiency = calcSpaceEfficiency(rooms, furniture);
  const walkability = calcWalkability(rooms, furniture);
  const functionality = calcFunctionality(rooms, furniture, lifestyle);
  const naturalLight = calcNaturalLight(rooms, furniture);
  const balance = calcBalance(rooms, furniture);

  const overall = Math.round(
    spaceEfficiency * 0.2 +
    walkability * 0.25 +
    functionality * 0.25 +
    naturalLight * 0.15 +
    balance * 0.15
  );

  return { spaceEfficiency, walkability, functionality, naturalLight, balance, overall };
}

/**
 * Space Efficiency: ratio of used floor area vs total floor area.
 * Good: 30-60% usage. Too low = wasted, too high = cramped.
 */
function calcSpaceEfficiency(rooms: Room[], furniture: FurnitureItem[]): number {
  let totalFloor = 0;
  let totalFurnitureArea = 0;

  for (const room of rooms) {
    const roomFloor = room.dimensions.width * room.dimensions.length * CM_TO_M * CM_TO_M;
    totalFloor += roomFloor;

    const roomFurniture = furniture.filter(f => f.roomId === room.id);
    for (const f of roomFurniture) {
      totalFurnitureArea += f.dimensions.width * f.dimensions.depth * CM_TO_M * CM_TO_M;
    }
  }

  if (totalFloor === 0) return 50;
  const ratio = totalFurnitureArea / totalFloor;

  // Sweet spot: 0.25-0.45
  if (ratio >= 0.25 && ratio <= 0.45) return Math.round(90 + (1 - Math.abs(ratio - 0.35) / 0.1) * 10);
  if (ratio < 0.25) return Math.round(60 + ratio / 0.25 * 30);
  if (ratio > 0.45) return Math.round(Math.max(40, 90 - (ratio - 0.45) / 0.3 * 50));
  return 70;
}

/**
 * Walkability: checks clearance between furniture, to doors, and to windows.
 */
function calcWalkability(rooms: Room[], furniture: FurnitureItem[]): number {
  let score = 100;

  for (const room of rooms) {
    const roomFurniture = furniture.filter(f => f.roomId === room.id);
    const rX = room.position.x;
    const rZ = room.position.z;
    const rW = room.dimensions.width;
    const rL = room.dimensions.length;

    // Check door clearance
    for (const door of room.doors) {
      const doorPos = getDoorWorldPosition(door, room);
      for (const f of roomFurniture) {
        const dist = distToFurniture(doorPos.x, doorPos.z, f);
        if (dist < 75) score -= 8;       // too close to door
        else if (dist < 100) score -= 3;
      }
    }

    // Check furniture-to-furniture clearance
    for (let i = 0; i < roomFurniture.length; i++) {
      for (let j = i + 1; j < roomFurniture.length; j++) {
        const dist = furnitureDistance(roomFurniture[i], roomFurniture[j]);
        if (dist < 40) score -= 6;       // collision/too tight
        else if (dist < 60) score -= 2;
      }
    }

    // Check edge clearance (furniture too close to walls)
    for (const f of roomFurniture) {
      const margins = getWallMargins(f, rX, rZ, rW, rL);
      for (const m of margins) {
        if (m < 5) score -= 4; // touching wall (might be ok for some pieces)
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Functionality: checks if lifestyle needs are met by furniture presence/placement.
 */
function calcFunctionality(rooms: Room[], furniture: FurnitureItem[], lifestyle: LifestyleProfile): number {
  let score = 80;

  const categories = furniture.map(f => f.category);
  const templates = furniture.map(f => f.templateId);

  // Check activities
  for (const activity of lifestyle.activities) {
    switch (activity) {
      case 'relaxing':
        if (categories.includes('seating')) score += 3;
        break;
      case 'sleeping':
        if (categories.includes('beds')) score += 3;
        break;
      case 'studying':
      case 'working':
        if (categories.includes('desks')) score += 3;
        break;
      case 'gaming':
        if (categories.includes('desks') && categories.includes('tv-media')) score += 3;
        break;
      case 'watching-tv':
        if (categories.includes('tv-media') && categories.includes('seating')) score += 3;
        break;
      case 'entertaining':
        if (categories.includes('seating') && categories.includes('tables')) score += 3;
        break;
      case 'dining':
        if (templates.includes('dining-table')) score += 3;
        break;
    }
  }

  // Check priorities
  for (const priority of lifestyle.priorities) {
    switch (priority) {
      case 'natural-light':
        // Check if furniture doesn't block windows
        score += calcNaturalLight(rooms, furniture) > 80 ? 2 : -2;
        break;
      case 'open-space':
        score += calcSpaceEfficiency(rooms, furniture) > 85 ? 2 : -1;
        break;
      case 'storage':
        if (categories.includes('storage')) score += 2;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Natural Light: checks if furniture blocks windows.
 */
function calcNaturalLight(rooms: Room[], furniture: FurnitureItem[]): number {
  let score = 100;

  for (const room of rooms) {
    const roomFurniture = furniture.filter(f => f.roomId === room.id);
    for (const win of room.windows) {
      const winPos = getWindowWorldPosition(win, room);
      for (const f of roomFurniture) {
        const dist = distToFurniture(winPos.x, winPos.z, f);
        if (dist < 30 && f.dimensions.height > win.sillHeight) {
          score -= 12; // blocking window
        } else if (dist < 60 && f.dimensions.height > win.sillHeight) {
          score -= 5;
        }
      }
    }
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Balance: checks if furniture is evenly distributed across the room.
 */
function calcBalance(rooms: Room[], furniture: FurnitureItem[]): number {
  let totalScore = 0;
  let roomCount = 0;

  for (const room of rooms) {
    const roomFurniture = furniture.filter(f => f.roomId === room.id);
    if (roomFurniture.length === 0) continue;

    const rX = room.position.x;
    const rZ = room.position.z;
    const rW = room.dimensions.width;
    const rL = room.dimensions.length;
    const cx = rX + rW / 2;
    const cz = rZ + rL / 2;

    // Calculate center of mass of furniture
    let totalMass = 0;
    let massX = 0;
    let massZ = 0;
    for (const f of roomFurniture) {
      const area = f.dimensions.width * f.dimensions.depth;
      massX += f.position.x * area;
      massZ += f.position.z * area;
      totalMass += area;
    }

    if (totalMass > 0) {
      massX /= totalMass;
      massZ /= totalMass;

      // How far is center of mass from room center (normalized)
      const dx = Math.abs(massX - cx) / (rW / 2);
      const dz = Math.abs(massZ - cz) / (rL / 2);
      const offset = Math.sqrt(dx * dx + dz * dz);

      // 0 offset = perfect balance (100), 1 = all in corner (50)
      totalScore += Math.round(100 - offset * 50);
      roomCount++;
    }
  }

  return roomCount > 0 ? Math.max(0, Math.min(100, Math.round(totalScore / roomCount))) : 80;
}

// ============================================================
// Helpers
// ============================================================
function getDoorWorldPosition(door: Door, room: Room): { x: number; z: number } {
  const rX = room.position.x;
  const rZ = room.position.z;
  const rW = room.dimensions.width;
  const rL = room.dimensions.length;

  switch (door.wall) {
    case 'north': return { x: rX + door.position, z: rZ };
    case 'south': return { x: rX + door.position, z: rZ + rL };
    case 'east':  return { x: rX + rW, z: rZ + door.position };
    case 'west':  return { x: rX, z: rZ + door.position };
  }
}

function getWindowWorldPosition(win: RoomWindow, room: Room): { x: number; z: number } {
  const rX = room.position.x;
  const rZ = room.position.z;
  const rW = room.dimensions.width;
  const rL = room.dimensions.length;

  switch (win.wall) {
    case 'north': return { x: rX + win.position, z: rZ };
    case 'south': return { x: rX + win.position, z: rZ + rL };
    case 'east':  return { x: rX + rW, z: rZ + win.position };
    case 'west':  return { x: rX, z: rZ + win.position };
  }
}

function distToFurniture(px: number, pz: number, f: FurnitureItem): number {
  const fx = f.position.x + f.dimensions.width / 2;
  const fz = f.position.z + f.dimensions.depth / 2;
  const dx = Math.abs(px - fx) - f.dimensions.width / 2;
  const dz = Math.abs(pz - fz) - f.dimensions.depth / 2;
  return Math.sqrt(Math.max(0, dx) ** 2 + Math.max(0, dz) ** 2);
}

function furnitureDistance(a: FurnitureItem, b: FurnitureItem): number {
  const ax = a.position.x + a.dimensions.width / 2;
  const az = a.position.z + a.dimensions.depth / 2;
  const bx = b.position.x + b.dimensions.width / 2;
  const bz = b.position.z + b.dimensions.depth / 2;

  const dx = Math.abs(ax - bx) - (a.dimensions.width + b.dimensions.width) / 2;
  const dz = Math.abs(az - bz) - (a.dimensions.depth + b.dimensions.depth) / 2;
  return Math.sqrt(Math.max(0, dx) ** 2 + Math.max(0, dz) ** 2);
}

function getWallMargins(f: FurnitureItem, rX: number, rZ: number, rW: number, rL: number): number[] {
  return [
    f.position.x - rX,                                            // west margin
    (rX + rW) - (f.position.x + f.dimensions.width),             // east margin
    f.position.z - rZ,                                            // north margin
    (rZ + rL) - (f.position.z + f.dimensions.depth),             // south margin
  ];
}

export { furnitureDistance, distToFurniture, getDoorWorldPosition, getWindowWorldPosition, getWallMargins };
