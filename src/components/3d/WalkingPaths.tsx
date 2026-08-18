import { useRoomStore } from '../../store/useRoomStore';
import * as THREE from 'three';

const S = 0.01;

export default function WalkingPaths() {
  const rooms = useRoomStore(s => s.rooms);
  const walkingPaths = useRoomStore(s => s.walkingPaths);

  if (walkingPaths.length === 0) return null;

  return (
    <group>
      {walkingPaths.map((path, i) => {
        if (path.points.length < 2) return null;

        const points = path.points.map(p => new THREE.Vector3(p.x * S, 0.02, p.z * S));
        const color = path.isNarrow ? '#f87171' : '#34d399';

        return (
          <group key={i}>
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array(points.flatMap(p => [p.x, p.y, p.z])), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color={color} linewidth={2} transparent opacity={0.6} />
            </line>

            {/* Dots at endpoints */}
            {points.map((p, j) => (
              <mesh key={j} position={p}>
                <sphereGeometry args={[0.03, 8, 8]} />
                <meshBasicMaterial color={color} transparent opacity={0.6} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
}
