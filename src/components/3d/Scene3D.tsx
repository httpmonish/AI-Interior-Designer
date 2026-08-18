import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Grid, Html } from '@react-three/drei';
import { useRef, useEffect, useCallback } from 'react';
import * as THREE from 'three';
import { useRoomStore } from '../../store/useRoomStore';
import Room from './Room';
import FurnitureObject from './FurnitureObject';
import WalkingPaths from './WalkingPaths';

function CameraManager() {
  const controlsRef = useRef<any>(null);
  const cameraView = useRoomStore(s => s.cameraView);
  const rooms = useRoomStore(s => s.rooms);

  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    // Calculate scene center based on all rooms
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (const room of rooms) {
      minX = Math.min(minX, room.position.x);
      maxX = Math.max(maxX, room.position.x + room.dimensions.width);
      minZ = Math.min(minZ, room.position.z);
      maxZ = Math.max(maxZ, room.position.z + room.dimensions.length);
    }
    const cx = ((minX + maxX) / 2) * 0.01;
    const cz = ((minZ + maxZ) / 2) * 0.01;
    const size = Math.max(maxX - minX, maxZ - minZ) * 0.01;
    const dist = size * 1.2;

    controls.target.set(cx, 0, cz);

    switch (cameraView) {
      case 'isometric':
        controls.object.position.set(cx + dist, dist * 0.8, cz + dist);
        break;
      case 'top':
        controls.object.position.set(cx, dist * 1.5, cz + 0.01);
        break;
      case 'front':
        controls.object.position.set(cx, dist * 0.3, cz + dist * 1.5);
        break;
      case 'right':
        controls.object.position.set(cx + dist * 1.5, dist * 0.3, cz);
        break;
      case 'free':
        // Don't change position for free mode
        break;
    }

    controls.update();
  }, [cameraView, rooms]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={1}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2.05}
      mouseButtons={{
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      }}
    />
  );
}

function SceneLighting() {
  return (
    <>
      <ambientLight intensity={0.5} color="#f5f0e8" />
      <directionalLight
        position={[10, 15, 8]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      <directionalLight position={[-5, 8, -3]} intensity={0.3} color="#b8cff5" />
      <pointLight position={[0, 5, 0]} intensity={0.2} color="#ffeedd" />
    </>
  );
}

function SceneContent() {
  const rooms = useRoomStore(s => s.rooms);
  const furniture = useRoomStore(s => s.furniture);
  const selectedFurnitureId = useRoomStore(s => s.selectedFurnitureId);
  const selectFurniture = useRoomStore(s => s.selectFurniture);
  const updateFurniture = useRoomStore(s => s.updateFurniture);
  const pushUndo = useRoomStore(s => s.pushUndo);
  const showWalkingPaths = useRoomStore(s => s.showWalkingPaths);
  const activeTool = useRoomStore(s => s.activeTool);

  const handleBackgroundClick = useCallback((e: any) => {
    if (e.object?.userData?.isFurniture) return;
    selectFurniture(null);
  }, [selectFurniture]);

  return (
    <group>
      {/* Ground plane for click deselect */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleBackgroundClick}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1d2e" transparent opacity={0} />
      </mesh>

      {/* Rooms */}
      {rooms.map(room => (
        <Room key={room.id} room={room} />
      ))}

      {/* Furniture */}
      {furniture.map(item => (
        <FurnitureObject
          key={item.id}
          item={item}
          isSelected={item.id === selectedFurnitureId}
          onSelect={() => selectFurniture(item.id)}
          onMove={(pos) => {
            updateFurniture(item.id, { position: pos });
          }}
          onMoveStart={() => pushUndo()}
          activeTool={activeTool}
        />
      ))}

      {/* Walking Paths */}
      {showWalkingPaths && <WalkingPaths />}

      {/* Grid */}
      <Grid
        args={[30, 30]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#2a2d3e"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#353850"
        fadeDistance={20}
        fadeStrength={1}
        position={[0, -0.005, 0]}
      />

      <ContactShadows
        position={[0, -0.005, 0]}
        opacity={0.4}
        scale={30}
        blur={2}
        far={8}
      />
    </group>
  );
}

export default function Scene3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [8, 6, 8], fov: 45, near: 0.1, far: 100 }}
      style={{ width: '100%', height: '100%' }}
      onPointerMissed={() => {
        useRoomStore.getState().selectFurniture(null);
      }}
    >
      <color attach="background" args={['#1a1d2e']} />
      <fog attach="fog" args={['#1a1d2e', 15, 35]} />

      <SceneLighting />
      <CameraManager />
      <SceneContent />

      <Environment preset="apartment" background={false} />
    </Canvas>
  );
}
