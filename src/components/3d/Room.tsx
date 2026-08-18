import { useMemo } from 'react';
import * as THREE from 'three';
import type { Room as RoomType } from '../../types';

const S = 0.01; // cm to meters
const WALL_THICKNESS = 0.08;

interface Props {
  room: RoomType;
}

export default function Room({ room }: Props) {
  const { dimensions, position, doors, windows, floorMaterial, wallMaterial } = room;
  const w = dimensions.width * S;
  const l = dimensions.length * S;
  const h = dimensions.height * S;
  const px = position.x * S;
  const pz = position.z * S;

  const floorColor = floorMaterial.color;
  const wallColor = wallMaterial.color;

  // Build wall shapes with door/window cutouts
  const walls = useMemo(() => {
    const wallData: {
      position: [number, number, number];
      size: [number, number, number];
      rotation?: [number, number, number];
      color: string;
    }[] = [];

    // Helper: determine openings on each wall
    const getOpenings = (wallSide: string) => {
      const wallDoors = doors.filter(d => d.wall === wallSide);
      const wallWindows = windows.filter(wi => wi.wall === wallSide);

      return { wallDoors, wallWindows };
    };

    // Build each wall as segments (full wall minus openings)
    const buildWall = (
      wallSide: string,
      wallPos: [number, number, number],
      wallW: number,
      wallH: number,
      isXAxis: boolean,
    ) => {
      const { wallDoors, wallWindows } = getOpenings(wallSide);

      // Simple approach: if no openings, one full wall
      if (wallDoors.length === 0 && wallWindows.length === 0) {
        wallData.push({
          position: wallPos,
          size: isXAxis
            ? [wallW, wallH, WALL_THICKNESS]
            : [WALL_THICKNESS, wallH, wallW],
          color: wallColor,
        });
        return;
      }

      // With openings: create wall segments
      // Sort openings by position
      const openings: { start: number; end: number; bottomY: number; topY: number }[] = [];

      for (const d of wallDoors) {
        openings.push({
          start: d.position * S,
          end: (d.position + d.width) * S,
          bottomY: 0,
          topY: d.height * S,
        });
      }
      for (const wi of wallWindows) {
        openings.push({
          start: wi.position * S,
          end: (wi.position + wi.width) * S,
          bottomY: wi.sillHeight * S,
          topY: (wi.sillHeight + wi.height) * S,
        });
      }

      openings.sort((a, b) => a.start - b.start);

      // Create segments between openings (simplified: bottom, top, between)
      let cursor = 0;
      for (const op of openings) {
        // Segment before opening
        if (op.start > cursor) {
          const segW = op.start - cursor;
          const segCenter = cursor + segW / 2;
          const basePos = isXAxis
            ? [wallPos[0] - wallW / 2 + segCenter, wallPos[1], wallPos[2]] as [number, number, number]
            : [wallPos[0], wallPos[1], wallPos[2] - wallW / 2 + segCenter] as [number, number, number];

          wallData.push({
            position: basePos,
            size: isXAxis
              ? [segW, wallH, WALL_THICKNESS]
              : [WALL_THICKNESS, wallH, segW],
            color: wallColor,
          });
        }

        // Wall above opening
        if (op.topY < wallH) {
          const segW = op.end - op.start;
          const segH = wallH - op.topY;
          const segCenter = op.start + segW / 2;
          const basePos = isXAxis
            ? [wallPos[0] - wallW / 2 + segCenter, op.topY + segH / 2, wallPos[2]] as [number, number, number]
            : [wallPos[0], op.topY + segH / 2, wallPos[2] - wallW / 2 + segCenter] as [number, number, number];

          wallData.push({
            position: basePos,
            size: isXAxis
              ? [segW, segH, WALL_THICKNESS]
              : [WALL_THICKNESS, segH, segW],
            color: wallColor,
          });
        }

        // Wall below opening (for windows)
        if (op.bottomY > 0) {
          const segW = op.end - op.start;
          const segH = op.bottomY;
          const segCenter = op.start + segW / 2;
          const basePos = isXAxis
            ? [wallPos[0] - wallW / 2 + segCenter, segH / 2, wallPos[2]] as [number, number, number]
            : [wallPos[0], segH / 2, wallPos[2] - wallW / 2 + segCenter] as [number, number, number];

          wallData.push({
            position: basePos,
            size: isXAxis
              ? [segW, segH, WALL_THICKNESS]
              : [WALL_THICKNESS, segH, segW],
            color: wallColor,
          });
        }

        cursor = op.end;
      }

      // Final segment after last opening
      if (cursor < wallW) {
        const segW = wallW - cursor;
        const segCenter = cursor + segW / 2;
        const basePos = isXAxis
          ? [wallPos[0] - wallW / 2 + segCenter, wallPos[1], wallPos[2]] as [number, number, number]
          : [wallPos[0], wallPos[1], wallPos[2] - wallW / 2 + segCenter] as [number, number, number];

        wallData.push({
          position: basePos,
          size: isXAxis
            ? [segW, wallH, WALL_THICKNESS]
            : [WALL_THICKNESS, wallH, segW],
          color: wallColor,
        });
      }
    };

    // North wall (z = 0 of room)
    buildWall('north', [px + w / 2, h / 2, pz], w, h, true);
    // South wall
    buildWall('south', [px + w / 2, h / 2, pz + l], w, h, true);
    // West wall
    buildWall('west', [px, h / 2, pz + l / 2], l, h, false);
    // East wall
    buildWall('east', [px + w, h / 2, pz + l / 2], l, h, false);

    return wallData;
  }, [dimensions, position, doors, windows, wallColor]);

  // Window glass panes
  const windowPanes = useMemo(() => {
    return windows.map(win => {
      const winW = win.width * S;
      const winH = win.height * S;
      const sillH = win.sillHeight * S;
      const winPos = win.position * S;

      let pos: [number, number, number];
      let size: [number, number, number];

      switch (win.wall) {
        case 'north':
          pos = [px + winPos + winW / 2, sillH + winH / 2, pz];
          size = [winW, winH, 0.02];
          break;
        case 'south':
          pos = [px + winPos + winW / 2, sillH + winH / 2, pz + l];
          size = [winW, winH, 0.02];
          break;
        case 'east':
          pos = [px + w, sillH + winH / 2, pz + winPos + winW / 2];
          size = [0.02, winH, winW];
          break;
        case 'west':
          pos = [px, sillH + winH / 2, pz + winPos + winW / 2];
          size = [0.02, winH, winW];
          break;
        default:
          pos = [0, 0, 0];
          size = [0, 0, 0];
      }

      return { pos, size, id: win.id };
    });
  }, [windows, px, pz, w, l]);

  // Door frames
  const doorFrames = useMemo(() => {
    return doors.map(door => {
      const dW = door.width * S;
      const dH = door.height * S;
      const dPos = door.position * S;
      const frameW = 0.04;

      let pos: [number, number, number];
      let leftFrame: [number, number, number];
      let rightFrame: [number, number, number];
      let topFrame: [number, number, number];
      let isXAxis: boolean;

      switch (door.wall) {
        case 'north':
          pos = [px + dPos + dW / 2, dH / 2, pz];
          leftFrame = [px + dPos, dH / 2, pz];
          rightFrame = [px + dPos + dW, dH / 2, pz];
          topFrame = [px + dPos + dW / 2, dH, pz];
          isXAxis = true;
          break;
        case 'south':
          pos = [px + dPos + dW / 2, dH / 2, pz + l];
          leftFrame = [px + dPos, dH / 2, pz + l];
          rightFrame = [px + dPos + dW, dH / 2, pz + l];
          topFrame = [px + dPos + dW / 2, dH, pz + l];
          isXAxis = true;
          break;
        case 'east':
          pos = [px + w, dH / 2, pz + dPos + dW / 2];
          leftFrame = [px + w, dH / 2, pz + dPos];
          rightFrame = [px + w, dH / 2, pz + dPos + dW];
          topFrame = [px + w, dH, pz + dPos + dW / 2];
          isXAxis = false;
          break;
        case 'west':
        default:
          pos = [px, dH / 2, pz + dPos + dW / 2];
          leftFrame = [px, dH / 2, pz + dPos];
          rightFrame = [px, dH / 2, pz + dPos + dW];
          topFrame = [px, dH, pz + dPos + dW / 2];
          isXAxis = false;
          break;
      }

      return { id: door.id, pos, leftFrame, rightFrame, topFrame, dW, dH, isXAxis, frameW };
    });
  }, [doors, px, pz, w, l]);

  const isBalcony = room.type === 'custom' && room.name.toLowerCase().includes('balcon');

  return (
    <group>
      {/* Floor */}
      <mesh
        position={[px + w / 2, 0, pz + l / 2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[w, l]} />
        <meshStandardMaterial
          color={floorColor}
          roughness={floorMaterial.roughness}
          metalness={floorMaterial.metalness}
        />
      </mesh>

      {/* Walls (with cutouts) */}
      {walls.map((wall, i) => (
        <mesh key={`wall-${i}`} position={wall.position} castShadow receiveShadow>
          <boxGeometry args={wall.size} />
          <meshStandardMaterial
            color={wall.color}
            roughness={0.85}
            metalness={0}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* Window glass */}
      {windowPanes.map(win => (
        <mesh key={win.id} position={win.pos}>
          <boxGeometry args={win.size} />
          <meshPhysicalMaterial
            color="#87CEEB"
            transparent
            opacity={0.3}
            roughness={0.05}
            metalness={0.1}
            transmission={0.6}
          />
        </mesh>
      ))}

      {/* Door frames */}
      {doorFrames.map(frame => (
        <group key={frame.id}>
          {/* Left frame */}
          <mesh position={frame.leftFrame} castShadow>
            <boxGeometry args={frame.isXAxis
              ? [frame.frameW, frame.dH, WALL_THICKNESS + 0.02]
              : [WALL_THICKNESS + 0.02, frame.dH, frame.frameW]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} />
          </mesh>
          {/* Right frame */}
          <mesh position={frame.rightFrame} castShadow>
            <boxGeometry args={frame.isXAxis
              ? [frame.frameW, frame.dH, WALL_THICKNESS + 0.02]
              : [WALL_THICKNESS + 0.02, frame.dH, frame.frameW]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} />
          </mesh>
          {/* Top frame */}
          <mesh position={frame.topFrame} castShadow>
            <boxGeometry args={frame.isXAxis
              ? [frame.dW + frame.frameW * 2, frame.frameW, WALL_THICKNESS + 0.02]
              : [WALL_THICKNESS + 0.02, frame.frameW, frame.dW + frame.frameW * 2]} />
            <meshStandardMaterial color="#8B7355" roughness={0.6} />
          </mesh>
        </group>
      ))}

      {/* Balcony railing */}
      {isBalcony && (
        <group>
          {/* Low wall / railing on north side */}
          <mesh position={[px + w / 2, h / 2, pz]} castShadow>
            <boxGeometry args={[w, h, 0.04]} />
            <meshStandardMaterial color="#B8B8B0" roughness={0.5} transparent opacity={0.6} />
          </mesh>
        </group>
      )}
    </group>
  );
}
