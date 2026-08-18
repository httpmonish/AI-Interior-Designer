// ============================================================
// RoomMind AI — Collision Engine
// ============================================================
import { FurnitureItem, Room, RoomHealthCheck, ClearanceWarning, WalkingPath, Vec2 } from '../types';
import { getDoorWorldPosition, getWindowWorldPosition } from './ScoreEngine';

const MIN_CLEARANCE = 60;   // cm
const REC_CLEARANCE = 75;   // cm
const DOOR_CLEARANCE = 90;  // cm
const WINDOW_CLEARANCE = 50; // cm
const MIN_PASSAGE = 70;     // cm

interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function furnitureAABB(f: FurnitureItem): AABB {
  return {
    minX: f.position.x,
    maxX: f.position.x + f.dimensions.width,
    minZ: f.position.z,
    maxZ: f.position.z + f.dimensions.depth,
  };
}

function aabbOverlap(a: AABB, b: AABB): boolean {
  return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
}

function aabbDistance(a: AABB, b: AABB): number {
  const dx = Math.max(0, Math.max(a.minX - b.maxX, b.minX - a.maxX));
  const dz = Math.max(0, Math.max(a.minZ - b.maxZ, b.minZ - a.maxZ));
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Check all clearance warnings between furniture pairs
 */
export function getClearanceWarnings(furniture: FurnitureItem[]): ClearanceWarning[] {
  const warnings: ClearanceWarning[] = [];

  for (let i = 0; i < furniture.length; i++) {
    for (let j = i + 1; j < furniture.length; j++) {
      if (furniture[i].roomId !== furniture[j].roomId) continue;

      const aBox = furnitureAABB(furniture[i]);
      const bBox = furnitureAABB(furniture[j]);
      const dist = aabbDistance(aBox, bBox);

      if (dist < REC_CLEARANCE) {
        warnings.push({
          furnitureId: furniture[i].id,
          furnitureName: furniture[i].name,
          nearObjectId: furniture[j].id,
          nearObjectName: furniture[j].name,
          distance: Math.round(dist),
          recommended: REC_CLEARANCE,
        });
      }
    }
  }

  return warnings;
}

/**
 * Check for actual collisions
 */
export function getCollisions(furniture: FurnitureItem[]): Array<{ a: string; b: string }> {
  const collisions: Array<{ a: string; b: string }> = [];

  for (let i = 0; i < furniture.length; i++) {
    for (let j = i + 1; j < furniture.length; j++) {
      if (furniture[i].roomId !== furniture[j].roomId) continue;

      const aBox = furnitureAABB(furniture[i]);
      const bBox = furnitureAABB(furniture[j]);

      if (aabbOverlap(aBox, bBox)) {
        collisions.push({ a: furniture[i].id, b: furniture[j].id });
      }
    }
  }

  return collisions;
}

/**
 * Check if furniture is outside room bounds
 */
export function getOutOfBounds(furniture: FurnitureItem[], rooms: Room[]): string[] {
  const outIds: string[] = [];

  for (const f of furniture) {
    const room = rooms.find(r => r.id === f.roomId);
    if (!room) continue;

    const rMinX = room.position.x;
    const rMaxX = room.position.x + room.dimensions.width;
    const rMinZ = room.position.z;
    const rMaxZ = room.position.z + room.dimensions.length;

    const fBox = furnitureAABB(f);

    if (fBox.minX < rMinX - 5 || fBox.maxX > rMaxX + 5 || fBox.minZ < rMinZ - 5 || fBox.maxZ > rMaxZ + 5) {
      outIds.push(f.id);
    }
  }

  return outIds;
}

/**
 * Perform comprehensive room health checks
 */
export function checkRoomHealth(rooms: Room[], furniture: FurnitureItem[]): RoomHealthCheck[] {
  const checks: RoomHealthCheck[] = [];

  for (const room of rooms) {
    const roomFurniture = furniture.filter(f => f.roomId === room.id);

    // Door access
    for (const door of room.doors) {
      const doorPos = getDoorWorldPosition(door, room);
      let blocked = false;
      let closeFurnitureId: string | undefined;

      for (const f of roomFurniture) {
        const fBox = furnitureAABB(f);
        const dist = pointToAABBDistance(doorPos.x, doorPos.z, fBox);
        if (dist < DOOR_CLEARANCE) {
          blocked = true;
          closeFurnitureId = f.id;
          break;
        }
      }

      checks.push({
        id: `health-door-${door.id}`,
        label: 'Door access',
        status: blocked ? 'warning' : 'ok',
        message: blocked ? `${roomFurniture.find(f => f.id === closeFurnitureId)?.name || 'Furniture'} too close to door` : 'Door area clear',
        furnitureId: closeFurnitureId,
      });
    }

    // Window access
    for (const win of room.windows) {
      const winPos = getWindowWorldPosition(win, room);
      let blocked = false;
      let closeFurnitureId: string | undefined;

      for (const f of roomFurniture) {
        const fBox = furnitureAABB(f);
        const dist = pointToAABBDistance(winPos.x, winPos.z, fBox);
        if (dist < WINDOW_CLEARANCE && f.dimensions.height > win.sillHeight) {
          blocked = true;
          closeFurnitureId = f.id;
          break;
        }
      }

      checks.push({
        id: `health-window-${win.id}`,
        label: 'Window access',
        status: blocked ? 'warning' : 'ok',
        message: blocked ? `${roomFurniture.find(f => f.id === closeFurnitureId)?.name || 'Furniture'} blocks window` : 'Window area clear',
        furnitureId: closeFurnitureId,
      });
    }

    // Walkability - check passages between furniture
    const clearanceWarnings = getClearanceWarnings(roomFurniture);
    const narrowPassages = clearanceWarnings.filter(w => w.distance < MIN_PASSAGE);

    checks.push({
      id: `health-walk-${room.id}`,
      label: 'Walkability',
      status: narrowPassages.length > 0 ? 'warning' : 'ok',
      message: narrowPassages.length > 0 ? `${narrowPassages.length} narrow passage(s) detected` : 'All passages adequate',
    });

    // Furniture clearance
    const tightClearances = clearanceWarnings.filter(w => w.distance < MIN_CLEARANCE);
    checks.push({
      id: `health-clearance-${room.id}`,
      label: 'Furniture clearance',
      status: tightClearances.length > 0 ? 'warning' : 'ok',
      message: tightClearances.length > 0 ? `${tightClearances.length} items too close together` : 'All clearances adequate',
      furnitureId: tightClearances[0]?.furnitureId,
    });

    // Room balance
    const centerX = room.position.x + room.dimensions.width / 2;
    const centerZ = room.position.z + room.dimensions.length / 2;

    if (roomFurniture.length > 0) {
      let totalArea = 0;
      let massX = 0;
      let massZ = 0;
      for (const f of roomFurniture) {
        const area = f.dimensions.width * f.dimensions.depth;
        massX += (f.position.x + f.dimensions.width / 2) * area;
        massZ += (f.position.z + f.dimensions.depth / 2) * area;
        totalArea += area;
      }
      massX /= totalArea;
      massZ /= totalArea;

      const dx = Math.abs(massX - centerX) / (room.dimensions.width / 2);
      const dz = Math.abs(massZ - centerZ) / (room.dimensions.length / 2);
      const offset = Math.sqrt(dx * dx + dz * dz);

      checks.push({
        id: `health-balance-${room.id}`,
        label: 'Room balance',
        status: offset > 0.5 ? 'warning' : 'ok',
        message: offset > 0.5 ? 'Furniture distribution is uneven' : 'Good furniture distribution',
      });
    }
  }

  return checks;
}

/**
 * Generate walking paths through the room
 */
export function generateWalkingPaths(room: Room, furniture: FurnitureItem[]): WalkingPath[] {
  const paths: WalkingPath[] = [];
  const rX = room.position.x;
  const rZ = room.position.z;
  const rW = room.dimensions.width;
  const rL = room.dimensions.length;

  // Generate paths from each door to center and to other doors
  const doorPositions: Vec2[] = [];
  for (const door of room.doors) {
    const pos = getDoorWorldPosition(door, room);
    doorPositions.push({ x: pos.x, z: pos.z });
  }

  const center: Vec2 = { x: rX + rW / 2, z: rZ + rL / 2 };

  // Door to center paths
  for (const doorPos of doorPositions) {
    const width = calculatePathWidth(doorPos, center, furniture.filter(f => f.roomId === room.id));

    paths.push({
      points: [doorPos, center],
      width,
      isNarrow: width < MIN_PASSAGE,
      label: `Main Route — ${Math.round(width)} cm`,
    });
  }

  // Door to door paths
  for (let i = 0; i < doorPositions.length; i++) {
    for (let j = i + 1; j < doorPositions.length; j++) {
      const width = calculatePathWidth(doorPositions[i], doorPositions[j], furniture.filter(f => f.roomId === room.id));

      paths.push({
        points: [doorPositions[i], doorPositions[j]],
        width,
        isNarrow: width < MIN_PASSAGE,
        label: `Cross Route — ${Math.round(width)} cm`,
      });
    }
  }

  return paths;
}

function calculatePathWidth(start: Vec2, end: Vec2, furniture: FurnitureItem[]): number {
  let minClearance = 500; // start with a large number

  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const length = Math.sqrt(dx * dx + dz * dz);

  if (length === 0) return minClearance;

  // Sample points along the path
  const steps = Math.max(5, Math.ceil(length / 20));

  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const px = start.x + dx * t;
    const pz = start.z + dz * t;

    for (const f of furniture) {
      const fBox = furnitureAABB(f);
      const dist = pointToAABBDistance(px, pz, fBox);
      minClearance = Math.min(minClearance, dist * 2); // both sides
    }
  }

  return Math.round(minClearance);
}

function pointToAABBDistance(px: number, pz: number, box: AABB): number {
  const dx = Math.max(0, Math.max(box.minX - px, px - box.maxX));
  const dz = Math.max(0, Math.max(box.minZ - pz, pz - box.maxZ));
  return Math.sqrt(dx * dx + dz * dz);
}

export { furnitureAABB, aabbOverlap, aabbDistance, pointToAABBDistance };
