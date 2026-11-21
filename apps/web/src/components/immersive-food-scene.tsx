"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { InstancedMesh, Mesh } from "three";

const RICE_COUNT = 420;

function Rice() {
  const grains = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    if (!grains.current) return;

    for (let i = 0; i < RICE_COUNT; i += 1) {
      const angle = i * 2.3999632297;
      const radius = 0.94 * Math.sqrt(((i * 73) % RICE_COUNT) / RICE_COUNT);
      dummy.position.set(
        Math.cos(angle) * radius,
        0.2 + ((i * 19) % 11) * 0.0015,
        Math.sin(angle) * radius,
      );
      dummy.rotation.set(
        ((i * 17) % 20) / 18,
        angle,
        ((i * 13) % 14) / 14,
      );
      const length = 0.65 + ((i * 29) % 10) / 25;
      dummy.scale.set(0.46, 0.62, length);
      dummy.updateMatrix();
      grains.current.setMatrixAt(i, dummy.matrix);
    }
    grains.current.instanceMatrix.needsUpdate = true;
  }, [dummy]);

  return (
    <instancedMesh ref={grains} args={[undefined, undefined, RICE_COUNT]} castShadow>
      <sphereGeometry args={[0.035, 7, 5]} />
      <meshStandardMaterial color="#fff4d8" roughness={0.83} />
    </instancedMesh>
  );
}

function Bowl({
  position,
  soup,
  garnish,
}: {
  position: [number, number, number];
  soup: string;
  garnish: string;
}) {
  return (
    <group position={position}>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.58, 48, 32]} />
        <meshStandardMaterial color="#f7eee0" roughness={0.24} metalness={0.1} />
      </mesh>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.49, 0.47, 0.045, 48]} />
        <meshStandardMaterial color={soup} roughness={0.32} />
      </mesh>
      <mesh position={[0, 0.247, 0]}>
        <torusGeometry args={[0.49, 0.023, 10, 56]} />
        <meshStandardMaterial color="#fff4df" roughness={0.2} metalness={0.12} />
      </mesh>
      {[[-0.13, -0.09], [0.12, 0.08], [0.2, -0.14], [-0.04, 0.16]].map(
        ([x, z], index) => (
          <mesh key={`${x}-${z}`} position={[x, 0.255, z]} rotation={[0.2, index, 0.7]}>
            <sphereGeometry args={[0.055, 12, 8]} />
            <meshStandardMaterial color={garnish} roughness={0.47} />
          </mesh>
        ),
      )}
    </group>
  );
}

function Flatbread({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[-Math.PI / 2, 0, rotation]}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.6, 0.055, 64]} />
        <meshStandardMaterial color="#e7b76a" roughness={0.8} />
      </mesh>
      {[
        [-0.18, 0.12],
        [0.14, 0.23],
        [0.28, -0.08],
        [-0.29, -0.16],
        [0.02, -0.26],
      ].map(([x, z], index) => (
        <mesh key={`${x}-${z}`} position={[x, 0.031, z]}>
          <sphereGeometry args={[0.055 + (index % 2) * 0.018, 12, 8]} />
          <meshStandardMaterial color={index % 2 ? "#c67b3c" : "#f3d59f"} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Thali() {
  return (
    <group rotation={[-0.12, 0, 0.03]}>
      <mesh position={[0, -0.01, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[2.34, 2.2, 0.18, 112]} />
        <meshStandardMaterial color="#c29a5d" metalness={0.78} roughness={0.23} />
      </mesh>
      <mesh position={[0, 0.09, 0]} receiveShadow>
        <cylinderGeometry args={[2.16, 2.14, 0.09, 112]} />
        <meshStandardMaterial color="#f7f0df" metalness={0.14} roughness={0.21} />
      </mesh>
      <mesh position={[0, 0.143, 0]}>
        <torusGeometry args={[2.19, 0.035, 12, 112]} />
        <meshStandardMaterial color="#e1ba75" metalness={0.72} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.145, 0]}>
        <torusGeometry args={[1.99, 0.012, 8, 112]} />
        <meshStandardMaterial color="#d5bf99" metalness={0.45} roughness={0.3} />
      </mesh>
      <Rice />
      <Bowl position={[-1.28, 0.12, -0.93]} soup="#d99c32" garnish="#2f7045" />
      <Bowl position={[1.25, 0.12, -0.9]} soup="#799146" garnish="#f4d584" />
      <Bowl position={[1.25, 0.12, 0.85]} soup="#ad4b32" garnish="#eab853" />
      <Flatbread position={[-1.17, 0.19, 1.03]} rotation={0.12} />
      <Flatbread position={[-1.44, 0.23, 0.78]} rotation={0.4} />
      <mesh position={[-0.18, 0.205, 1.55]} rotation={[-Math.PI / 2, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.32, 0.34, 0.038, 48]} />
        <meshStandardMaterial color="#d8a34c" roughness={0.75} />
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, 0.23, 1.55]}>
          <sphereGeometry args={[0.045, 10, 8]} />
          <meshStandardMaterial color="#4c733d" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function Scene() {
  const plate = useRef<Mesh>(null);
  const { pointer } = useThree();
  const reducedMotion = useRef(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedMotion.current = query.matches;
    const update = (event: MediaQueryListEvent) => {
      reducedMotion.current = event.matches;
    };
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useFrame((state, delta) => {
    if (!plate.current || reducedMotion.current) return;
    plate.current.rotation.y = THREE.MathUtils.damp(
      plate.current.rotation.y,
      pointer.x * 0.12 + Math.sin(state.clock.elapsedTime * 0.16) * 0.025,
      2,
      delta,
    );
    plate.current.rotation.x = THREE.MathUtils.damp(
      plate.current.rotation.x,
      -0.11 + pointer.y * 0.045,
      2,
      delta,
    );
    plate.current.position.y = 0.06 + Math.sin(state.clock.elapsedTime * 0.7) * 0.045;
  });

  return (
    <>
      <ambientLight intensity={1.15} />
      <directionalLight position={[4, 7, 5]} intensity={2.8} castShadow shadow-mapSize={[1024, 1024]} />
      <pointLight position={[-4, 2, -2]} intensity={110} color="#e77d37" distance={9} />
      <pointLight position={[4, 3, 3]} intensity={80} color="#f6d88e" distance={9} />
      <group ref={plate} position={[0, 0.06, 0]}>
        <Thali />
      </group>
      <Float speed={0.8} rotationIntensity={0.16} floatIntensity={0.22}>
        <mesh position={[-2.45, 0.75, 0.3]} rotation={[0.4, 0.1, 0.6]}>
          <torusGeometry args={[0.2, 0.025, 10, 36]} />
          <meshStandardMaterial color="#e9ad48" metalness={0.72} roughness={0.2} emissive="#5c3711" />
        </mesh>
      </Float>
      <Float speed={1.05} rotationIntensity={0.2} floatIntensity={0.25}>
        <mesh position={[2.45, 0.25, -0.1]} rotation={[0.2, 0.5, 0.1]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshStandardMaterial color="#e47755" roughness={0.35} metalness={0.12} />
        </mesh>
      </Float>
      <Float speed={0.7} rotationIntensity={0.1} floatIntensity={0.18}>
        <mesh position={[1.95, 1.05, 0.2]}>
          <sphereGeometry args={[0.075, 20, 20]} />
          <meshStandardMaterial color="#f6d88e" emissive="#8a541d" emissiveIntensity={0.45} />
        </mesh>
      </Float>
    </>
  );
}

export default function ImmersiveFoodScene() {
  const [webglReady, setWebglReady] = useState(false);

  return (
    <div
      className={`immersive-canvas${webglReady ? " has-webgl" : ""}`}
      aria-hidden="true"
    >
      <div className="scene-fallback">
        <div className="scene-fallback-shadow" />
        <div className="scene-fallback-plate">
          <div className="scene-fallback-inner">
            <div className="scene-fallback-rice">
              {Array.from({ length: 92 }, (_, index) => (
                <i
                  key={index}
                  style={
                    {
                      "--grain-angle": `${(index * 137.5) % 360}deg`,
                      "--grain-distance": `${8 + ((index * 37) % 45)}%`,
                    } as React.CSSProperties
                  }
                />
              ))}
            </div>
            <span className="scene-fallback-bowl scene-fallback-bowl-one">
              <i />
            </span>
            <span className="scene-fallback-bowl scene-fallback-bowl-two">
              <i />
            </span>
            <span className="scene-fallback-bowl scene-fallback-bowl-three">
              <i />
            </span>
            <span className="scene-fallback-naan scene-fallback-naan-one" />
            <span className="scene-fallback-naan scene-fallback-naan-two" />
            <span className="scene-fallback-herb scene-fallback-herb-one" />
            <span className="scene-fallback-herb scene-fallback-herb-two" />
          </div>
        </div>
        <span className="scene-fallback-orbit scene-fallback-orbit-one" />
        <span className="scene-fallback-orbit scene-fallback-orbit-two" />
      </div>
      <Canvas
        camera={{ position: [0, 5.2, 7.1], fov: 39 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        fallback={null}
        onCreated={() => setWebglReady(true)}
      >
        <Scene />
      </Canvas>
    </div>
  );
}
