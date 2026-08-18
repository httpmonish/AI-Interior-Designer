import { useRef, useState, useCallback, useMemo } from 'react';
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { FurnitureItem, ActiveTool, Vec3 } from '../../types';

const S = 0.01; // cm to meters

interface Props {
  item: FurnitureItem;
  isSelected: boolean;
  onSelect: () => void;
  onMove: (pos: Vec3) => void;
  onMoveStart: () => void;
  activeTool: ActiveTool;
}

// Procedural furniture geometry generators
function createFurnitureMesh(item: FurnitureItem): React.ReactNode {
  const w = item.dimensions.width * S;
  const d = item.dimensions.depth * S;
  const h = item.dimensions.height * S;
  const color = item.color;
  const template = item.templateId;

  // Sofa
  if (template.includes('sofa')) {
    const seatH = h * 0.4;
    const backH = h * 0.6;
    const armW = w * 0.08;
    return (
      <group>
        {/* Seat */}
        <mesh position={[0, seatH / 2, 0]} castShadow>
          <boxGeometry args={[w, seatH, d]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Back */}
        <mesh position={[0, seatH + backH / 2, -d / 2 + d * 0.1]} castShadow>
          <boxGeometry args={[w, backH, d * 0.2]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Left arm */}
        <mesh position={[-w / 2 + armW / 2, seatH + backH * 0.3, 0]} castShadow>
          <boxGeometry args={[armW, backH * 0.6, d]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        {/* Right arm */}
        <mesh position={[w / 2 - armW / 2, seatH + backH * 0.3, 0]} castShadow>
          <boxGeometry args={[armW, backH * 0.6, d]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    );
  }

  // Armchair
  if (template.includes('armchair') || template.includes('office-chair')) {
    const seatH = h * 0.35;
    const backH = h * 0.65;
    return (
      <group>
        <mesh position={[0, seatH / 2, 0]} castShadow>
          <boxGeometry args={[w, seatH, d]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        <mesh position={[0, seatH + backH / 2, -d / 2 + d * 0.12]} castShadow>
          <boxGeometry args={[w * 0.9, backH, d * 0.15]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      </group>
    );
  }

  // Bed
  if (template.includes('bed')) {
    const baseH = h * 0.3;
    const mattH = h * 0.5;
    const headH = h * 1.2;
    return (
      <group>
        {/* Frame */}
        <mesh position={[0, baseH / 2, 0]} castShadow>
          <boxGeometry args={[w, baseH, d]} />
          <meshStandardMaterial color="#8B7355" roughness={0.7} />
        </mesh>
        {/* Mattress */}
        <mesh position={[0, baseH + mattH / 2, 0]} castShadow>
          <boxGeometry args={[w * 0.95, mattH, d * 0.95]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
        {/* Headboard */}
        <mesh position={[0, headH / 2, -d / 2 + 0.03]} castShadow>
          <boxGeometry args={[w, headH, 0.06]} />
          <meshStandardMaterial color="#6B5A45" roughness={0.6} />
        </mesh>
        {/* Pillows */}
        <mesh position={[-w * 0.2, baseH + mattH + 0.04, -d * 0.35]} castShadow>
          <boxGeometry args={[w * 0.25, 0.08, d * 0.18]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>
        <mesh position={[w * 0.2, baseH + mattH + 0.04, -d * 0.35]} castShadow>
          <boxGeometry args={[w * 0.25, 0.08, d * 0.18]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  // Table / desk
  if (template.includes('table') || template.includes('desk')) {
    const topH = 0.04;
    const legH = h - topH;
    const legW = 0.04;
    return (
      <group>
        {/* Top */}
        <mesh position={[0, h - topH / 2, 0]} castShadow>
          <boxGeometry args={[w, topH, d]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* Legs */}
        {[
          [-w / 2 + legW, legH / 2, -d / 2 + legW],
          [w / 2 - legW, legH / 2, -d / 2 + legW],
          [-w / 2 + legW, legH / 2, d / 2 - legW],
          [w / 2 - legW, legH / 2, d / 2 - legW],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[legW, legH, legW]} />
            <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
          </mesh>
        ))}
      </group>
    );
  }

  // TV Unit
  if (template.includes('tv-unit')) {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.1} />
        </mesh>
        {/* Drawers (lines) */}
        <mesh position={[0, h * 0.3, d / 2 + 0.002]}>
          <planeGeometry args={[w * 0.9, 0.003]} />
          <meshStandardMaterial color="#555" />
        </mesh>
      </group>
    );
  }

  // TV
  if (template.includes('tv-55')) {
    return (
      <group>
        {/* Screen */}
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.05} metalness={0.3} />
        </mesh>
        {/* Stand */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <boxGeometry args={[w * 0.3, 0.04, d * 2]} />
          <meshStandardMaterial color="#333" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>
    );
  }

  // Wardrobe / bookshelf / storage
  if (template.includes('wardrobe') || template.includes('bookshelf') || template.includes('dresser') ||
      template.includes('cabinet') || template.includes('shoe-rack')) {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.5} />
        </mesh>
        {/* Door line */}
        <mesh position={[0, h / 2, d / 2 + 0.002]}>
          <planeGeometry args={[0.003, h * 0.85]} />
          <meshStandardMaterial color="#666" />
        </mesh>
        {/* Handle */}
        <mesh position={[0.03, h * 0.5, d / 2 + 0.01]} castShadow>
          <boxGeometry args={[0.02, 0.06, 0.02]} />
          <meshStandardMaterial color="#999" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  // Plants
  if (template.includes('plant')) {
    const potH = h * 0.25;
    const foliageH = h * 0.6;
    return (
      <group>
        {/* Pot */}
        <mesh position={[0, potH / 2, 0]} castShadow>
          <cylinderGeometry args={[w * 0.4 * S / (w * S), w * 0.35 * S / (w * S) * w, potH, 8]} />
          <meshStandardMaterial color="#6B4226" roughness={0.8} />
        </mesh>
        {/* Foliage */}
        <mesh position={[0, potH + foliageH / 2, 0]} castShadow>
          <sphereGeometry args={[Math.min(w, d) / 2 * 1.2, 8, 8]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      </group>
    );
  }

  // Floor lamp
  if (template.includes('floor-lamp')) {
    return (
      <group>
        {/* Base */}
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[w * 0.35, w * 0.4, 0.04, 12]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Pole */}
        <mesh position={[0, h * 0.45, 0]} castShadow>
          <cylinderGeometry args={[0.015, 0.015, h * 0.85, 8]} />
          <meshStandardMaterial color="#888" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Shade */}
        <mesh position={[0, h * 0.88, 0]} castShadow>
          <cylinderGeometry args={[w * 0.25, w * 0.4, h * 0.18, 12]} />
          <meshStandardMaterial color="#F5E6C8" roughness={0.9} transparent opacity={0.8} />
        </mesh>
        {/* Light */}
        <pointLight position={[0, h * 0.85, 0]} intensity={0.3} color="#FFF5E0" distance={3} />
      </group>
    );
  }

  // Table lamp
  if (template.includes('table-lamp') || template.includes('lamp')) {
    return (
      <group>
        <mesh position={[0, 0.02, 0]} castShadow>
          <cylinderGeometry args={[w * 0.3, w * 0.35, 0.04, 8]} />
          <meshStandardMaterial color="#888" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, h * 0.3, 0]} castShadow>
          <cylinderGeometry args={[0.01, 0.01, h * 0.5, 6]} />
          <meshStandardMaterial color="#888" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, h * 0.7, 0]} castShadow>
          <cylinderGeometry args={[w * 0.15, w * 0.3, h * 0.35, 12]} />
          <meshStandardMaterial color="#F5E6C8" roughness={0.9} transparent opacity={0.8} />
        </mesh>
        <pointLight position={[0, h * 0.7, 0]} intensity={0.15} color="#FFF5E0" distance={2} />
      </group>
    );
  }

  // Rug
  if (template.includes('rug')) {
    return (
      <mesh position={[0, h / 2, 0]} receiveShadow>
        <boxGeometry args={[w, h, d]} />
        <meshStandardMaterial color={color} roughness={0.95} />
      </mesh>
    );
  }

  // Kitchen counter
  if (template.includes('counter') || template.includes('island') || template.includes('kitchen-sink')) {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.05} />
        </mesh>
        {/* Countertop */}
        <mesh position={[0, h + 0.01, 0]} castShadow>
          <boxGeometry args={[w + 0.02, 0.025, d + 0.02]} />
          <meshStandardMaterial color="#E8E0D8" roughness={0.25} metalness={0.05} />
        </mesh>
      </group>
    );
  }

  // Fridge
  if (template.includes('fridge')) {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Handle */}
        <mesh position={[-w * 0.38, h * 0.55, d / 2 + 0.01]} castShadow>
          <boxGeometry args={[0.02, h * 0.25, 0.02]} />
          <meshStandardMaterial color="#CCC" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    );
  }

  // Bathtub
  if (template.includes('bathtub')) {
    return (
      <group>
        {/* Outer */}
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.2} metalness={0.1} />
        </mesh>
        {/* Inner (slightly recessed) */}
        <mesh position={[0, h / 2 + 0.02, 0]}>
          <boxGeometry args={[w * 0.9, h * 0.8, d * 0.85]} />
          <meshStandardMaterial color="#E8F4F8" roughness={0.1} />
        </mesh>
      </group>
    );
  }

  // Toilet
  if (template.includes('toilet')) {
    return (
      <group>
        {/* Base */}
        <mesh position={[0, h * 0.25, 0]} castShadow>
          <boxGeometry args={[w, h * 0.5, d]} />
          <meshStandardMaterial color={color} roughness={0.15} />
        </mesh>
        {/* Tank */}
        <mesh position={[0, h * 0.55, -d * 0.3]} castShadow>
          <boxGeometry args={[w * 0.85, h * 0.45, d * 0.3]} />
          <meshStandardMaterial color={color} roughness={0.15} />
        </mesh>
      </group>
    );
  }

  // Nightstand / side table / small items
  if (template.includes('nightstand') || template.includes('side-table')) {
    return (
      <group>
        <mesh position={[0, h / 2, 0]} castShadow>
          <boxGeometry args={[w, h, d]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
        {/* Drawer */}
        <mesh position={[0, h * 0.35, d / 2 + 0.002]}>
          <planeGeometry args={[w * 0.8, 0.003]} />
          <meshStandardMaterial color="#666" />
        </mesh>
      </group>
    );
  }

  // Dining chair
  if (template.includes('dining-chair')) {
    const seatH = h * 0.4;
    const legW = 0.025;
    return (
      <group>
        {/* Seat */}
        <mesh position={[0, seatH, 0]} castShadow>
          <boxGeometry args={[w, 0.03, d]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* Back */}
        <mesh position={[0, (seatH + h) / 2, -d / 2 + 0.02]} castShadow>
          <boxGeometry args={[w * 0.85, h - seatH, 0.025]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
        {/* Legs */}
        {[
          [-w / 2 + legW, seatH / 2, -d / 2 + legW],
          [w / 2 - legW, seatH / 2, -d / 2 + legW],
          [-w / 2 + legW, seatH / 2, d / 2 - legW],
          [w / 2 - legW, seatH / 2, d / 2 - legW],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} castShadow>
            <boxGeometry args={[legW, seatH, legW]} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        ))}
      </group>
    );
  }

  // Default: simple box
  return (
    <mesh position={[0, h / 2, 0]} castShadow>
      <boxGeometry args={[w, h, d]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  );
}

export default function FurnitureObject({ item, isSelected, onSelect, onMove, onMoveStart, activeTool }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; z: number } | null>(null);
  const itemStartRef = useRef<{ x: number; z: number } | null>(null);

  const w = item.dimensions.width * S;
  const d = item.dimensions.depth * S;
  const h = item.dimensions.height * S;
  const px = item.position.x * S;
  const py = item.position.y * S;
  const pz = item.position.z * S;
  const ry = (item.rotation.y || 0) * (Math.PI / 180);

  const controls = useThree(state => state.controls) as any;

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (activeTool !== 'select' && activeTool !== 'move') return;
    e.stopPropagation();
    onSelect();

    if (activeTool === 'move' || activeTool === 'select') {
      if (controls) controls.enabled = false;
      setIsDragging(true);
      onMoveStart();
      dragStartRef.current = { x: e.point.x, z: e.point.z };
      itemStartRef.current = { x: item.position.x, z: item.position.z };
      (e.target as HTMLElement)?.setPointerCapture?.(e.pointerId);
    }
  }, [activeTool, onSelect, onMoveStart, item.position.x, item.position.z, controls]);

  const handlePointerMove = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (!isDragging || !dragStartRef.current || !itemStartRef.current) return;
    e.stopPropagation();

    const dx = (e.point.x - dragStartRef.current.x) / S;
    const dz = (e.point.z - dragStartRef.current.z) / S;

    // Snap to grid (10cm increments)
    const snapSize = 10;
    const newX = Math.round((itemStartRef.current.x + dx) / snapSize) * snapSize;
    const newZ = Math.round((itemStartRef.current.z + dz) / snapSize) * snapSize;

    onMove({ x: newX, y: item.position.y, z: newZ });
  }, [isDragging, onMove, item.position.y]);

  const handlePointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (controls) controls.enabled = true;
    setIsDragging(false);
    dragStartRef.current = null;
    itemStartRef.current = null;
  }, [controls]);

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  const furnitureMesh = useMemo(() => createFurnitureMesh(item), [item.templateId, item.color, item.dimensions]);

  return (
    <group
      ref={groupRef}
      position={[px + w / 2, py, pz + d / 2]}
      rotation={[0, ry, 0]}
      userData={{ isFurniture: true, furnitureId: item.id }}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerOver={(e) => { e.stopPropagation(); setIsHovered(true); }}
      onPointerOut={() => setIsHovered(false)}
    >
      {furnitureMesh}

      {/* Selection / hover outline */}
      {(isSelected || isHovered) && (
        <mesh position={[0, h / 2, 0]}>
          <boxGeometry args={[w + 0.04, h + 0.04, d + 0.04]} />
          <meshBasicMaterial
            color={isSelected ? '#8b5cf6' : '#60a5fa'}
            wireframe
            transparent
            opacity={isSelected ? 0.6 : 0.3}
          />
        </mesh>
      )}

      {/* Selection glow */}
      {isSelected && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[w + 0.1, d + 0.1]} />
          <meshBasicMaterial color="#8b5cf6" transparent opacity={0.15} />
        </mesh>
      )}

      {/* Label */}
      {(isSelected || isHovered) && (
        <Html
          position={[0, h + 0.15, 0]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background: 'rgba(15, 17, 23, 0.9)',
            border: '1px solid rgba(139, 92, 246, 0.4)',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            color: '#f0f0f5',
            whiteSpace: 'nowrap',
            fontFamily: 'Inter, sans-serif',
            backdropFilter: 'blur(8px)',
          }}>
            {item.name}
          </div>
        </Html>
      )}
    </group>
  );
}
