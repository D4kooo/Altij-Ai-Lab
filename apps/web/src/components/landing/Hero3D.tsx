import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Constants
const PRIMARY_COLOR = "#21B2AA";
const ACCENT_COLOR = "#5EEAD4";
const THREAT_COLOR = "#ef4444"; // Red for malicious trackers

function Shield({ color = PRIMARY_COLOR }) {
  const shieldRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // 1. Slower Shield Rotation
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (shieldRef.current) {
      shieldRef.current.rotation.y = t * 0.02;
    }
    // Pulse effect
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1.02 + Math.sin(t * 1.5) * 0.01);
    }
  });

  return (
    <group ref={shieldRef} position={[0, -1, 0]}>
      {/* Core Shield Glass */}
      <mesh>
        <sphereGeometry args={[2.8, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.1}
          metalness={0.1}
          transmission={0.6}
          thickness={0.5}
          side={THREE.DoubleSide}
          transparent={true}
          opacity={0.3}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>

      {/* Wireframe overlay */}
      <mesh>
        <sphereGeometry args={[2.81, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={ACCENT_COLOR}
          wireframe
          transparent
          opacity={0.05}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Outer Glow / Force Field Edge */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.85, 64, 64, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Base Rings */}
      <group position={[0, 0, 0]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05 * i, 0]}>
            <ringGeometry args={[2.9 + i * 0.2, 2.92 + i * 0.2, 64]} />
            <meshBasicMaterial
              color={ACCENT_COLOR}
              transparent
              opacity={0.3 - i * 0.1}
              side={THREE.DoubleSide}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function ProtectedCity() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={[0, -1, 0]}>
      {/* Base Platform Removed */}

      {/* Central Tower (Core Data) */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.8, 2, 0.8]} />
        <meshStandardMaterial color="#ffffff" emissive={PRIMARY_COLOR} emissiveIntensity={0.2} />
      </mesh>

      {/* Surrounding Buildings (Personal Data/Users) */}
      {[...Array(6)].map((_, i) => {
        const radius = 1.2;
        const angle = (i / 6) * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        return (
          <mesh key={i} position={[x, 0.6, z]}>
            <boxGeometry args={[0.5, 1.2, 0.5]} />
            <meshStandardMaterial color={PRIMARY_COLOR} />
          </mesh>
        );
      })}

      {/* Data Flow Lines */}
      {[...Array(3)].map((_, i) => (
        <mesh key={`ring-${i}`} position={[0, 0.5 + i * 0.5, 0]}>
          <torusGeometry args={[1.5, 0.02, 16, 100]} />
          <meshBasicMaterial color={ACCENT_COLOR} transparent opacity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function ExternalThreats() {
  const count = 40;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = new THREE.Object3D();

  // Initial positions outside the shield
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      const direction = new THREE.Vector3(
        (Math.random() - 0.5),
        (Math.random() * 0.5 + 0.1), // Coming more from top/sides
        (Math.random() - 0.5)
      ).normalize();

      return {
        direction,
        distance: 5 + Math.random() * 5,
        speed: 0.005 + Math.random() * 0.01,
        rotationSpeed: Math.random() * 0.1
      };
    });
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    particles.forEach((p, i) => {
      // Update distance
      p.distance -= p.speed;

      // If hits shield (radius approx 2.8), reset
      if (p.distance < 2.9) {
        p.distance = 8 + Math.random() * 2;
        // Optional: visual flair on impact
      }

      // Calculate position
      const pos = p.direction.clone().multiplyScalar(p.distance);

      // Update matrix
      tempObject.position.copy(pos);
      tempObject.lookAt(0, 0, 0); // Point towards center
      tempObject.rotateZ(state.clock.elapsedTime * 0.5 + i); // spin slower
      tempObject.scale.setScalar(1 - (p.distance - 3) * 0.1);
      if (tempObject.scale.x < 0.2) tempObject.scale.setScalar(0.2);

      tempObject.updateMatrix();
      meshRef.current!.setMatrixAt(i, tempObject.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <tetrahedronGeometry args={[0.15, 0]} />
      <meshBasicMaterial color={THREAT_COLOR} />
    </instancedMesh>
  );
}

function FloatingPixels() {
  return (
    <Sparkles
      count={50}
      scale={6}
      size={3}
      speed={0.2}
      opacity={0.3}
      color={ACCENT_COLOR}
      position={[0, 2, 0]}
    />
  );
}

function Scene() {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={45} />

      <ambientLight intensity={0.5} color="#ffffff" />
      <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />

      {/* Light coming from the "safe core" */}
      <pointLight position={[0, 2, 0]} intensity={2} color={PRIMARY_COLOR} distance={10} />

      <Shield />
      <ProtectedCity />
      <ExternalThreats />
      <FloatingPixels />

      <fog attach="fog" args={['#ffffff', 5, 25]} />
    </>
  );
}

export function Hero3D() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <Canvas
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        style={{ pointerEvents: 'none' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}

export default Hero3D;
