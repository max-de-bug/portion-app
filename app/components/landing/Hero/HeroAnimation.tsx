"use client";

import { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Text, Float } from "@react-three/drei";
import * as THREE from "three";

// Grid configuration
const GRID_SIZE = 12;
const SPACING = 2;

// Symbol Node Component
function SymbolNode({ x, y, symbol }: { x: number; y: number; symbol: string }) {
  const meshRef = useRef<THREE.Group>(null);
  const [active, setActive] = useState(false);

  // Trigger pulse effect
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => setActive(false), 500);
      return () => clearTimeout(timer);
    }
  }, [active]);

  useFrame((state) => {
    if (meshRef.current) {
        // Subtle drift
        meshRef.current.position.z = Math.sin(state.clock.elapsedTime + x + y) * 0.1;
    }
  });

  return (
    <group ref={meshRef} position={[x, y, 0]}>
      <Text
        fontSize={0.4}
        color={active ? "#00A3FF" : "#1e293b"}
        fillOpacity={active ? 1 : 0.4}
        font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
      >
        {symbol}
      </Text>
      {active && (
         <mesh>
            <ringGeometry args={[0.3, 0.35, 32]} />
            <meshBasicMaterial color="#00A3FF" transparent opacity={0.5} />
         </mesh>
      )}
    </group>
  );
}

// Payment Packet Component
function PaymentPacket({ path, color = "#00A3FF", delay = 0 }: { path: THREE.Vector3[]; color?: string; delay?: number }) {
  const trailRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(path, false, 'catmullrom', 0), [path]);
  
  useFrame((state) => {
    const time = (state.clock.elapsedTime * 0.3 + delay) % 1;
    const pos = curve.getPointAt(time);
    const posNext = curve.getPointAt(Math.min(time + 0.01, 1));
    
    if (headRef.current) {
        headRef.current.position.copy(pos);
    }

    if (trailRef.current) {
        // Look ahead to orient trail
        trailRef.current.position.copy(pos);
        trailRef.current.lookAt(posNext);
    }
  });

  return (
    <group>
      {/* Luminous Head */}
      <mesh ref={headRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} />
        <pointLight color={color} intensity={1} distance={2} />
      </mesh>
      
      {/* Packet Path Trace (The Tail) */}
      <mesh ref={trailRef} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.02, 0.005, 1, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// Background Grid of Symbols
function NodeGrid() {
  const nodes = useMemo(() => {
    const symbols = ["$", "+", "x", "○"];
    const n = [];
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        n.push({
          x: (i - GRID_SIZE / 2) * SPACING,
          y: (j - GRID_SIZE / 2) * SPACING,
          symbol: symbols[Math.floor(Math.random() * symbols.length)],
        });
      }
    }
    return n;
  }, []);

  return (
    <group>
      {nodes.map((node, i) => (
        <SymbolNode key={i} {...node} />
      ))}
    </group>
  );
}

function Scene() {
  // Define orthogonal paths that "snap" to the grid
  const paths = useMemo(() => [
      // Path 1
      [
          new THREE.Vector3(-8, 4, 0),
          new THREE.Vector3(-4, 4, 0),
          new THREE.Vector3(-4, -2, 0),
          new THREE.Vector3(2, -2, 0),
          new THREE.Vector3(2, -6, 0),
          new THREE.Vector3(8, -6, 0),
      ],
      // Path 2
      [
          new THREE.Vector3(-10, -6, 0),
          new THREE.Vector3(-10, -2, 0),
          new THREE.Vector3(-2, -2, 0),
          new THREE.Vector3(-2, 6, 0),
          new THREE.Vector3(6, 6, 0),
          new THREE.Vector3(6, 0, 0),
      ],
      // Path 3 (USDV theme)
      [
          new THREE.Vector3(0, 10, 0),
          new THREE.Vector3(0, 2, 0),
          new THREE.Vector3(8, 2, 0),
          new THREE.Vector3(8, -10, 0),
      ],
      // Diagonal Path (45 deg)
      [
          new THREE.Vector3(-12, 0, 0),
          new THREE.Vector3(-6, 0, 0),
          new THREE.Vector3(0, 6, 0),
          new THREE.Vector3(6, 6, 0),
          new THREE.Vector3(12, 0, 0),
      ],
  ], []);

  return (
    <>
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} color="#00A3FF" />
      
      <NodeGrid />
      
      {paths.map((path, i) => (
          <PaymentPacket key={i} path={path} delay={i * 0.2} color={i % 2 === 0 ? "#00A3FF" : "#10b981"} />
      ))}
      
      {/* Background Particles for depth */}
      <Points positions={new Float32Array(500 * 3).map(() => (Math.random() - 0.5) * 40)}>
         <PointMaterial transparent color="#00A3FF" size={0.03} opacity={0.1} />
      </Points>
    </>
  );
}

export function HeroAnimation() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="absolute inset-0 bg-[#0A0F1E]" />;

  return (
    <div className="absolute inset-0 bg-[#0A0F1E]">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
         <color attach="background" args={["#0A0F1E"]} />
         <Scene />
      </Canvas>
      
      {/* Intensity Vignette - Mercantill Style */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_200px_rgba(0,163,255,0.15)]" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1E] via-transparent to-[#0A0F1E] opacity-40 pointer-events-none" />
    </div>
  );
}
