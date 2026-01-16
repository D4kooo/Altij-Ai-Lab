import { Suspense, useRef, useMemo, Component, ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Sparkles } from '@react-three/drei';
import * as THREE from 'three';

// Error boundary for WebGL crashes
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class WebGLErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('WebGL Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Constants
const MINT = new THREE.Color('#57C5B6');
const MINT_LIGHT = new THREE.Color('#2DD4BF');

interface WebGLCanvasProps {
  continuousProgress: number;
}

// Generate formations with proper shapes - all scaled to fit viewport
function generateFormations(count: number): Float32Array[] {
  const formations: Float32Array[] = [];
  const SCALE = 8; // Global scale factor - large formations filling the viewport

  // Formation 0: Sphere (Hero) - Fibonacci sphere for even distribution
  const sphere = new Float32Array(count * 3);
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const theta = 2 * Math.PI * i / goldenRatio;
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const radius = SCALE;

    sphere[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
    sphere[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
    sphere[i * 3 + 2] = radius * Math.cos(phi);
  }
  formations.push(sphere);

  // Formation 1: Connected Grid (Expertise) - 3D cube lattice
  const grid = new Float32Array(count * 3);
  const gridSize = Math.ceil(Math.cbrt(count));
  const gridSpacing = (SCALE * 2) / gridSize;
  for (let i = 0; i < count; i++) {
    const x = (i % gridSize) - gridSize / 2;
    const y = (Math.floor(i / gridSize) % gridSize) - gridSize / 2;
    const z = Math.floor(i / (gridSize * gridSize)) - gridSize / 2;

    grid[i * 3] = x * gridSpacing;
    grid[i * 3 + 1] = y * gridSpacing;
    grid[i * 3 + 2] = z * gridSpacing;
  }
  formations.push(grid);

  // Formation 2: Double Helix DNA (Enjeu Citoyen)
  const helix = new Float32Array(count * 3);
  const helixLength = SCALE * 2.5;
  const helixRadius = SCALE * 0.6;
  const turns = 3;
  for (let i = 0; i < count; i++) {
    const strand = i % 2;
    const idx = Math.floor(i / 2);
    const t = idx / (count / 2);
    const angle = t * Math.PI * 2 * turns + strand * Math.PI;

    helix[i * 3] = Math.cos(angle) * helixRadius;
    helix[i * 3 + 1] = t * helixLength - helixLength / 2;
    helix[i * 3 + 2] = Math.sin(angle) * helixRadius;
  }
  formations.push(helix);

  // Formation 3: Terrain/Map (Souveraineté) - Flat terrain map
  const terrain = new Float32Array(count * 3);
  const terrainSize = Math.ceil(Math.sqrt(count));
  for (let i = 0; i < count; i++) {
    const xi = i % terrainSize;
    const zi = Math.floor(i / terrainSize);
    const x = (xi / terrainSize - 0.5) * SCALE * 2;
    const z = (zi / terrainSize - 0.5) * SCALE * 2;

    // Create rolling hills terrain
    const height =
      Math.sin(x * 3) * Math.cos(z * 3) * 0.4 +
      Math.sin(x * 5) * Math.cos(z * 2) * 0.2;

    terrain[i * 3] = x;
    terrain[i * 3 + 1] = height;
    terrain[i * 3 + 2] = z;
  }
  formations.push(terrain);

  // Formation 4: Heart (Donation) - Classic 2D heart extruded
  const heart = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const layers = 8;
    const pointsPerLayer = Math.floor(count / layers);
    const layer = Math.floor(i / pointsPerLayer);
    const idx = i % pointsPerLayer;
    const t = (idx / pointsPerLayer) * Math.PI * 2;

    // 2D heart parametric equation
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    const z = (layer / layers - 0.5) * 2;

    const heartScale = SCALE * 0.08;
    heart[i * 3] = x * heartScale;
    heart[i * 3 + 1] = y * heartScale;
    heart[i * 3 + 2] = z * heartScale * 2;
  }
  formations.push(heart);

  // Formation 5: Converging Vortex (CTA) - Spiral pulling inward
  const vortex = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const angle = t * Math.PI * 8; // Multiple rotations
    const radius = (1 - t) * SCALE + 0.2; // Starts wide, converges
    const height = (t - 0.5) * SCALE;

    vortex[i * 3] = Math.cos(angle) * radius;
    vortex[i * 3 + 1] = height;
    vortex[i * 3 + 2] = Math.sin(angle) * radius;
  }
  formations.push(vortex);

  return formations;
}

// Smooth easing for transitions
function smootherstep(x: number): number {
  const t = Math.max(0, Math.min(1, x));
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Main particle system with smooth morphing
function ParticleField({ continuousProgress }: { continuousProgress: number }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 2500;

  const { formations, colors, initialPositions } = useMemo(() => {
    const forms = generateFormations(particleCount);

    // Colors
    const cols = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = Math.random();
      const color = MINT.clone().lerp(MINT_LIGHT, t);
      cols[i * 3] = color.r;
      cols[i * 3 + 1] = color.g;
      cols[i * 3 + 2] = color.b;
    }

    return {
      formations: forms,
      colors: cols,
      initialPositions: new Float32Array(forms[0]),
    };
  }, []);

  // Animated positions
  const positions = useRef(new Float32Array(initialPositions));

  useFrame((state) => {
    if (!pointsRef.current) return;

    const time = state.clock.getElapsedTime();
    const geometry = pointsRef.current.geometry;
    const positionAttr = geometry.attributes.position;

    // Calculate which formations to blend between
    const sectionCount = formations.length;
    const currentSection = Math.min(Math.floor(continuousProgress), sectionCount - 1);
    const nextSection = Math.min(currentSection + 1, sectionCount - 1);

    // Get fractional part for transition (0-1 within current section)
    const sectionProgress = continuousProgress - currentSection;

    // The scroll hook now handles all transition timing
    // Here we just smoothly morph based on the fractional progress
    // The hold zone (0.05) in the scroll hook means sectionProgress stays at ~0.05 for 80% of scroll
    // Only when it goes above 0.1 do we start morphing
    let morphProgress = 0;
    if (sectionProgress > 0.1) {
      // Apply smootherstep for cinematic easing
      morphProgress = smootherstep((sectionProgress - 0.1) / 0.9);
    }

    const currentFormation = formations[currentSection];
    const nextFormation = formations[nextSection];

    // Update positions with smooth interpolation
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Lerp between formations
      const x = currentFormation[i3] + (nextFormation[i3] - currentFormation[i3]) * morphProgress;
      const y = currentFormation[i3 + 1] + (nextFormation[i3 + 1] - currentFormation[i3 + 1]) * morphProgress;
      const z = currentFormation[i3 + 2] + (nextFormation[i3 + 2] - currentFormation[i3 + 2]) * morphProgress;

      // Add subtle floating motion (reduced for cleaner look)
      const offset = i * 0.01;
      const floatX = Math.sin(time * 0.4 + offset) * 0.05;
      const floatY = Math.cos(time * 0.25 + offset) * 0.05;
      const floatZ = Math.sin(time * 0.3 + offset * 2) * 0.03;

      positions.current[i3] = x + floatX;
      positions.current[i3 + 1] = y + floatY;
      positions.current[i3 + 2] = z + floatZ;
    }

    // Update buffer
    positionAttr.array.set(positions.current);
    positionAttr.needsUpdate = true;

    // Slow rotation for subtle movement
    pointsRef.current.rotation.y = time * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={initialPositions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={0.75}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Smooth camera controller
function SmoothCamera({ continuousProgress }: { continuousProgress: number }) {
  const { camera } = useThree();
  const targetRef = useRef({ x: 0, y: 0, z: 24, lookY: 0 });

  useFrame(() => {
    // Camera positions for each section - optimized for large formations
    const cameraStates = [
      { x: 0, y: 0, z: 24, lookY: 0 },       // Hero: sphere frontal
      { x: 0, y: 0, z: 24, lookY: 0 },       // Expertise: grid frontal
      { x: 4, y: 3, z: 24, lookY: 0 },       // Enjeu: helix angled
      { x: 0, y: 12, z: 20, lookY: -3 },     // Souveraineté: terrain top view
      { x: 0, y: 0, z: 20, lookY: 0 },       // Donation: heart centered
      { x: 0, y: 3, z: 24, lookY: 0 },       // CTA: vortex centered
    ];

    const sectionCount = cameraStates.length;
    const currentIndex = Math.min(Math.floor(continuousProgress), sectionCount - 1);
    const nextIndex = Math.min(currentIndex + 1, sectionCount - 1);

    // Get fractional part for transition
    const sectionProgress = continuousProgress - currentIndex;

    // Same gradual transition timing as particles (synced with scroll hook)
    let t = 0;
    if (sectionProgress > 0.1) {
      t = smootherstep((sectionProgress - 0.1) / 0.9);
    }

    const current = cameraStates[currentIndex];
    const next = cameraStates[nextIndex];

    targetRef.current.x = current.x + (next.x - current.x) * t;
    targetRef.current.y = current.y + (next.y - current.y) * t;
    targetRef.current.z = current.z + (next.z - current.z) * t;
    targetRef.current.lookY = current.lookY + (next.lookY - current.lookY) * t;

    // Smoother camera follow
    const smoothness = 0.08;
    camera.position.x += (targetRef.current.x - camera.position.x) * smoothness;
    camera.position.y += (targetRef.current.y - camera.position.y) * smoothness;
    camera.position.z += (targetRef.current.z - camera.position.z) * smoothness;

    camera.lookAt(0, targetRef.current.lookY, 0);
  });

  return null;
}

// Wireframe rings for hero
function DataRingLogo({ progress }: { progress: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const opacity = Math.max(0, 1 - progress * 2);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.z = state.clock.getElapsedTime() * 0.06;
  });

  if (opacity <= 0.01) return null;

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, (i * Math.PI * 2) / 3]}>
          <torusGeometry args={[6.5 + i * 0.8, 0.03, 16, 100]} />
          <meshBasicMaterial
            color={MINT}
            transparent
            opacity={opacity * (0.3 - i * 0.07)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// Ambient particles
function AmbientParticles() {
  return (
    <Sparkles
      count={80}
      scale={40}
      size={2}
      speed={0.08}
      opacity={0.2}
      color={MINT}
    />
  );
}

// Main scene
function Scene({ continuousProgress }: { continuousProgress: number }) {
  return (
    <>
      <PerspectiveCamera makeDefault position={[0, 0, 24]} fov={50} />
      <SmoothCamera continuousProgress={continuousProgress} />

      <ambientLight intensity={0.5} />
      <pointLight position={[20, 20, 20]} intensity={1.2} color="#57C5B6" />
      <pointLight position={[-20, -15, -20]} intensity={0.7} color="#2DD4BF" />

      <ParticleField continuousProgress={continuousProgress} />
      <DataRingLogo progress={continuousProgress} />
      <AmbientParticles />

      <fog attach="fog" args={['#0A0A0B', 30, 70]} />
    </>
  );
}

// Fallback component for when WebGL crashes
function WebGLFallback() {
  return (
    <div className="webgl-fixed-canvas flex items-center justify-center">
      <div className="text-landing-accent/30 text-center">
        <div className="w-16 h-16 border-2 border-landing-accent/20 rounded-full mx-auto mb-4 animate-pulse" />
      </div>
    </div>
  );
}

export function WebGLCanvas({ continuousProgress }: WebGLCanvasProps) {
  return (
    <WebGLErrorBoundary fallback={<WebGLFallback />}>
      <div className="webgl-fixed-canvas">
        <Canvas
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
        >
          <Suspense fallback={null}>
            <Scene continuousProgress={continuousProgress} />
          </Suspense>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}

export default WebGLCanvas;
