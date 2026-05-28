import { useRef, useState, useCallback } from "react";
import { Canvas, useFrame, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Text, Grid, Environment } from "@react-three/drei";
import * as THREE from "three";
import type { Zone } from "../api/client";

// ── Zona 3D individual ────────────────────────────────────────────
function ZoneMesh({
  zone,
  isSelected,
  isIrrigating,
  onClick,
}: {
  zone: Zone;
  isSelected: boolean;
  isIrrigating: boolean;
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Pulso animado cuando está regando
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    if (isIrrigating) {
      const pulse = Math.sin(clock.getElapsedTime() * 3) * 0.05 + 1;
      meshRef.current.scale.setScalar(pulse);
    } else {
      meshRef.current.scale.setScalar(1);
    }
  });

  const color = isIrrigating
    ? "#1470e8"          // azul agua cuando riega
    : isSelected
    ? "#a1d494"          // verde claro seleccionado
    : hovered
    ? "#6bd8cb"          // teal hover
    : zone.color;

  const HEIGHT = 0.15;

  return (
    <group position={[zone.posX, 0, zone.posZ]}>
      <mesh
        ref={meshRef}
        position={[0, HEIGHT / 2, 0]}
        onClick={(e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); onClick(); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[zone.width, HEIGHT, zone.depth]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isSelected ? 1 : 0.85}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>

      {/* Borde de selección */}
      {isSelected && (
        <lineSegments position={[0, HEIGHT + 0.01, 0]}>
          <edgesGeometry args={[new THREE.BoxGeometry(zone.width, HEIGHT, zone.depth)]} />
          <lineBasicMaterial color="#154212" linewidth={2} />
        </lineSegments>
      )}

      {/* Etiqueta */}
      <Text
        position={[0, HEIGHT + 0.2, 0]}
        fontSize={0.2}
        color={isSelected ? "#154212" : "#0b1c30"}
        anchorX="center"
        anchorY="bottom"
        fontWeight={isSelected ? "bold" : "normal"}
      >
        {zone.name}
      </Text>

      {/* Partículas de agua */}
      {isIrrigating && <WaterEffect x={zone.posX} z={zone.posZ} />}
    </group>
  );
}

// ── Efecto agua ───────────────────────────────────────────────────
function WaterEffect({ x, z }: { x: number; z: number }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const t = (clock.getElapsedTime() + i * 0.3) % 1.2;
        child.position.y = 0.15 + t * 0.8;
        (child as THREE.Mesh).material && ((child as any).material.opacity = 1 - t / 1.2);
      });
    }
  });
  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={i} position={[(i - 2) * 0.2, 0, (i % 3 - 1) * 0.15]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#1470e8" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// ── Campo / tierra ────────────────────────────────────────────────
function FieldGround({ size }: { size: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#c8dba0" roughness={0.9} />
      </mesh>
      <Grid
        position={[0, 0, 0]}
        args={[size, size]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#92b36a"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#6b8f3e"
        fadeDistance={30}
        infiniteGrid={false}
      />
    </>
  );
}

// ── Componente principal ──────────────────────────────────────────
interface FarmViewer3DProps {
  zones: Zone[];
  runningZoneIds: Set<string>;
  selectedZoneId: string | null;
  onSelectZone: (id: string | null) => void;
}

export default function FarmViewer3D({
  zones,
  runningZoneIds,
  selectedZoneId,
  onSelectZone,
}: FarmViewer3DProps) {
  const handleBgClick = useCallback(() => onSelectZone(null), [onSelectZone]);

  return (
    <div className="w-full h-full rounded-2xl overflow-hidden border border-outline-variant">
      <Canvas
        shadows
        camera={{ position: [0, 12, 10], fov: 45 }}
        style={{ background: "linear-gradient(to bottom, #dce9ff, #eff4ff)" }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={1.2}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        <Environment preset="park" />

        {/* Campo */}
        <FieldGround size={20} />

        {/* Zonas */}
        {zones.map((zone) => (
          <ZoneMesh
            key={zone.id}
            zone={zone}
            isSelected={selectedZoneId === zone.id}
            isIrrigating={runningZoneIds.has(zone.id)}
            onClick={() => onSelectZone(zone.id)}
          />
        ))}

        {/* Click en fondo = deseleccionar */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, -0.02, 0]}
          onClick={handleBgClick}
          visible={false}
        >
          <planeGeometry args={[100, 100]} />
        </mesh>

        <OrbitControls
          maxPolarAngle={Math.PI / 2.2}
          minDistance={3}
          maxDistance={25}
          enablePan
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
