import { useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

function MouseTracker({ children }: { children: React.ReactNode }) {
  const groupRef = useRef<THREE.Group>(null);
  const { viewport } = useThree();

  useFrame(({ pointer }) => {
    if (groupRef.current) {
      const targetY = pointer.x * viewport.width * 0.05 * 0.15;
      const targetX = -pointer.y * viewport.height * 0.05 * 0.15;
      groupRef.current.rotation.y += (targetY - groupRef.current.rotation.y) * 0.02;
      groupRef.current.rotation.x += (targetX - groupRef.current.rotation.x) * 0.02;
    }
  });

  return <group ref={groupRef}>{children}</group>;
}

function FloatingShape({
  position,
  scale,
  geometry,
  color,
  speed = 1,
  rotationSpeed = [0.3, 0, 0.15],
  floatOffset = 0,
}: {
  position: [number, number, number];
  scale: number;
  geometry: React.ReactNode;
  color: string;
  speed?: number;
  rotationSpeed?: [number, number, number];
  floatOffset?: number;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const baseY = position[1];

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.getElapsedTime() * speed;
      ref.current.rotation.x = t * rotationSpeed[0];
      ref.current.rotation.y = t * rotationSpeed[1];
      ref.current.rotation.z = t * rotationSpeed[2];
      ref.current.position.y = baseY + Math.sin(t + floatOffset) * 0.2;
    }
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      {geometry}
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.6}
        roughness={0.1}
        metalness={0.8}
      />
    </mesh>
  );
}

function Particles() {
  const count = 50;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 6,
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return temp;
  }, []);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    particles.forEach((p, i) => {
      dummy.position.set(
        p.x + Math.sin(t * p.speed + p.offset) * 0.3,
        p.y + Math.cos(t * p.speed + p.offset) * 0.2,
        p.z
      );
      dummy.scale.setScalar(0.02 + Math.sin(t * 2 + p.offset) * 0.01);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#a78bfa" transparent opacity={0.4} />
    </instancedMesh>
  );
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <directionalLight position={[-3, -3, 2]} intensity={0.4} />
      <pointLight position={[3, 3, 3]} intensity={2} color="#a78bfa" />
      <pointLight position={[-3, -2, 2]} intensity={1.5} color="#60a5fa" />

      <MouseTracker>
        <FloatingShape
          position={[-2.8, 1.2, 0]}
          scale={0.55}
          color="#a78bfa"
          rotationSpeed={[0.3, 0, 0.15]}
          geometry={<torusGeometry args={[1, 0.4, 32, 64]} />}
        />
        <FloatingShape
          position={[2.5, -0.8, -1]}
          scale={0.7}
          color="#60a5fa"
          speed={0.8}
          rotationSpeed={[0.1, 0.2, 0]}
          floatOffset={1}
          geometry={<sphereGeometry args={[1, 64, 64]} />}
        />
        <FloatingShape
          position={[0.2, 1.8, -0.5]}
          scale={0.5}
          color="#f472b6"
          rotationSpeed={[0.2, 0.4, 0]}
          floatOffset={2}
          geometry={<octahedronGeometry args={[1, 0]} />}
        />
        <FloatingShape
          position={[-1.5, -1.5, 0.5]}
          scale={0.45}
          color="#34d399"
          rotationSpeed={[0, 0.25, 0.3]}
          floatOffset={3}
          geometry={<icosahedronGeometry args={[1, 0]} />}
        />
        <FloatingShape
          position={[3.2, 1.5, -2]}
          scale={0.35}
          color="#60a5fa"
          speed={0.6}
          rotationSpeed={[0.15, 0.1, 0.2]}
          floatOffset={4}
          geometry={<sphereGeometry args={[1, 32, 32]} />}
        />
        <FloatingShape
          position={[-3, -0.5, -1.5]}
          scale={0.3}
          color="#fbbf24"
          rotationSpeed={[0.35, 0.2, 0]}
          floatOffset={5}
          geometry={<octahedronGeometry args={[1, 0]} />}
        />
        <Particles />
      </MouseTracker>
    </>
  );
}

export default function FloatingScene() {
  const onCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    gl.setClearColor(0x000000, 0);
  }, []);

  return (
    <div className="absolute inset-0 -z-10">
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        dpr={[1, 1.5]}
        onCreated={onCreated}
        style={{ background: 'transparent' }}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
