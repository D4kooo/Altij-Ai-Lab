import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

function Torus() {
  const meshRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    // Slow Y rotation (~35s/tour)
    meshRef.current.rotation.y += 0.003;

    // Gentle X oscillation
    meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.15;

    // Floating Y
    meshRef.current.position.y = Math.sin(time * 0.8) * 0.12;

    // Subtle mouse tilt (max 0.1 rad)
    const targetTiltX = -mouseRef.current.y * 0.1;
    const targetTiltZ = mouseRef.current.x * 0.1;
    meshRef.current.rotation.x += (targetTiltX - meshRef.current.rotation.x) * 0.02;
    meshRef.current.rotation.z += (targetTiltZ - meshRef.current.rotation.z) * 0.02;
  });

  return (
    <mesh ref={meshRef}>
      <torusGeometry args={[2.2, 0.35, 64, 128]} />
      <meshPhysicalMaterial
        color="#57C5B6"
        roughness={0.15}
        metalness={0.1}
        transmission={0.3}
        thickness={0.5}
        clearcoat={1.0}
        clearcoatRoughness={0.1}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} color="#fffaf0" />
      <directionalLight position={[5, 8, 5]} intensity={1.0} />
      <directionalLight position={[-3, -2, 3]} intensity={0.3} />
      <Torus />
      <Environment preset="city" />
    </>
  );
}

export function Hero3D() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border-[12px] border-landing-accent/30 bg-landing-accent/5" />
      </div>
    );
  }

  return (
    <Canvas
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 7], fov: 45 }}
      style={{ background: 'transparent' }}
    >
      <Scene />
    </Canvas>
  );
}

export default Hero3D;
