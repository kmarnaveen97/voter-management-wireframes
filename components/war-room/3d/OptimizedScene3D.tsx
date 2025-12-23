"use client";

import React, { useRef, useCallback, useMemo } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import * as THREE from "three";

import {
  InstancedWardScene,
  InstancedBoothScene,
  InstancedFamilyScene,
  useAdaptiveQuality,
  PerformanceStats,
} from "./index";

import type { Ward3DData } from "./instanced-wards";
import type { Booth3DData } from "./instanced-booths";
import type { Family3DData } from "./instanced-families";

// ============================================================================
// Scene Lighting Rig (optimized)
// ============================================================================

function LightRig() {
  return (
    <>
      {/* Ambient - base illumination */}
      <ambientLight intensity={0.5} />

      {/* Key light - main directional with shadows */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />

      {/* Fill light - softer, no shadows */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.3}
        color="#60a5fa"
      />

      {/* Rim light - edge definition */}
      <pointLight
        position={[-10, 5, -10]}
        intensity={0.2}
        color="#f472b6"
        distance={50}
        decay={2}
      />
    </>
  );
}

// ============================================================================
// Ground Plane (optimized geometry)
// ============================================================================

function Ground({ onClickEmpty }: { onClickEmpty?: () => void }) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      receiveShadow
      onClick={(e) => {
        e.stopPropagation();
        onClickEmpty?.();
      }}
    >
      <planeGeometry args={[100, 100, 1, 1]} />
      <meshStandardMaterial color="#1e293b" roughness={0.8} metalness={0.2} />
    </mesh>
  );
}

// ============================================================================
// Grid Helper
// ============================================================================

function GridHelper() {
  return (
    <gridHelper args={[50, 50, "#334155", "#1e293b"]} position={[0, 0.01, 0]} />
  );
}

// ============================================================================
// Camera Controller with Smooth Transitions
// ============================================================================

interface CameraControllerProps {
  target: [number, number, number] | null;
  controlsRef: React.RefObject<any>;
}

function CameraController({ target, controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const [isAnimating, setIsAnimating] = React.useState(false);
  const currentTarget = useRef<THREE.Vector3 | null>(null);

  React.useEffect(() => {
    if (target) {
      currentTarget.current = new THREE.Vector3(...target);
      setIsAnimating(true);
    }
  }, [target]);

  React.useEffect(() => {
    let frameId: number;

    const animate = () => {
      if (!isAnimating || !currentTarget.current || !controlsRef.current) {
        return;
      }

      const targetVec = currentTarget.current;
      const desiredPos = new THREE.Vector3(
        targetVec.x,
        targetVec.y + 10,
        targetVec.z + 15
      );

      // Lerp camera position
      camera.position.lerp(desiredPos, 0.05);
      controlsRef.current.target.lerp(targetVec, 0.05);
      controlsRef.current.update();

      // Check if close enough to stop
      if (
        camera.position.distanceTo(desiredPos) < 0.5 &&
        controlsRef.current.target.distanceTo(targetVec) < 0.1
      ) {
        setIsAnimating(false);
        return;
      }

      frameId = requestAnimationFrame(animate);
    };

    if (isAnimating) {
      frameId = requestAnimationFrame(animate);
    }

    return () => {
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [isAnimating, camera, controlsRef]);

  return null;
}

// ============================================================================
// Optimized Scene Content
// ============================================================================

interface SceneContentProps {
  wards: Ward3DData[];
  booths: Booth3DData[];
  families: Family3DData[];
  viewMode: "wards" | "booths" | "families";
  selectedWard: string | null;
  hoveredWard: string | null;
  onSelectWard: (wardNo: string | null) => void;
  onHoverWard: (wardNo: string | null) => void;
  onSelectBooth?: (boothId: string) => void;
  cameraTarget: [number, number, number] | null;
  showLabels?: boolean;
  showPerformanceStats?: boolean;
}

function SceneContent({
  wards,
  booths,
  families,
  viewMode,
  selectedWard,
  hoveredWard,
  onSelectWard,
  onHoverWard,
  onSelectBooth,
  cameraTarget,
  showLabels = true,
  showPerformanceStats = false,
}: SceneContentProps) {
  const [hoveredBooth, setHoveredBooth] = React.useState<string | null>(null);
  const [hoveredFamily, setHoveredFamily] = React.useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = React.useState<string | null>(
    null
  );
  const controlsRef = useRef<any>(null);

  // Clear selection on empty click
  const handleClickEmpty = useCallback(() => {
    setSelectedFamily(null);
    if (viewMode === "wards") {
      onSelectWard(null);
    }
  }, [viewMode, onSelectWard]);

  return (
    <>
      {/* Environment */}
      <Environment preset="studio" />

      {/* Lighting */}
      <LightRig />

      {/* Ground & Grid */}
      <Ground onClickEmpty={handleClickEmpty} />
      <GridHelper />

      {/* Render based on view mode - using instanced components */}
      {viewMode === "wards" && (
        <InstancedWardScene
          wards={wards}
          selectedWard={selectedWard}
          hoveredWard={hoveredWard}
          onSelectWard={onSelectWard}
          onHoverWard={onHoverWard}
          showLabels={showLabels}
        />
      )}

      {viewMode === "booths" && (
        <InstancedBoothScene
          booths={booths}
          hoveredBooth={hoveredBooth}
          onSelectBooth={(boothId) => {
            onSelectBooth?.(boothId);
          }}
          onHoverBooth={setHoveredBooth}
          showLabels={showLabels}
        />
      )}

      {viewMode === "families" && (
        <InstancedFamilyScene
          families={families}
          selectedFamily={selectedFamily}
          hoveredFamily={hoveredFamily}
          onSelectFamily={setSelectedFamily}
          onHoverFamily={setHoveredFamily}
          showLabels={showLabels}
        />
      )}

      {/* Camera Controller */}
      <CameraController target={cameraTarget} controlsRef={controlsRef} />

      {/* Orbit Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={2}
        maxDistance={200}
        maxPolarAngle={Math.PI / 2 - 0.05}
        enableDamping={true}
        dampingFactor={0.05}
      />

      {/* Fog for depth */}
      <fog attach="fog" args={["#0f172a", 30, 200]} />
    </>
  );
}

// ============================================================================
// Main Optimized 3D Canvas Component
// ============================================================================

interface Optimized3DCanvasProps {
  wards: Ward3DData[];
  booths?: Booth3DData[];
  families?: Family3DData[];
  viewMode?: "wards" | "booths" | "families";
  selectedWard: string | null;
  hoveredWard: string | null;
  onSelectWard: (wardNo: string | null) => void;
  onSelectBooth?: (boothId: string) => void;
  onHoverWard: (wardNo: string | null) => void;
  cameraTarget: [number, number, number] | null;
  showLabels?: boolean;
  showPerformanceStats?: boolean;
}

/**
 * Optimized 3D Canvas using instanced rendering
 *
 * Performance improvements over original:
 * - Draw calls reduced from 50+ to ~5 per view mode
 * - Single Html overlay instead of N overlays
 * - Shared geometry and materials
 * - Adaptive quality based on device
 * - frameloop="demand" for idle optimization
 */
export function Optimized3DCanvas({
  wards,
  booths = [],
  families = [],
  viewMode = "wards",
  selectedWard,
  hoveredWard,
  onSelectWard,
  onSelectBooth,
  onHoverWard,
  cameraTarget,
  showLabels = true,
  showPerformanceStats = process.env.NODE_ENV === "development",
}: Optimized3DCanvasProps) {
  const { settings } = useAdaptiveQuality();

  return (
    <div className="relative w-full h-full">
      <Canvas
        shadows={settings.shadows ? "soft" : false}
        dpr={settings.dpr}
        performance={{ min: 0.5, max: 1, debounce: 200 }}
        frameloop="demand"
        camera={{ position: [15, 15, 15], fov: 50, near: 0.1, far: 300 }}
        gl={{
          powerPreference: "high-performance",
          antialias: settings.antialias,
          stencil: false,
        }}
      >
        <color attach="background" args={["#0f172a"]} />
        <React.Suspense fallback={null}>
          <SceneContent
            wards={wards}
            booths={booths}
            families={families}
            viewMode={viewMode}
            selectedWard={selectedWard}
            hoveredWard={hoveredWard}
            onSelectWard={onSelectWard}
            onHoverWard={onHoverWard}
            onSelectBooth={onSelectBooth}
            cameraTarget={cameraTarget}
            showLabels={showLabels}
            showPerformanceStats={showPerformanceStats}
          />
          {/* {showPerformanceStats && <PerformanceStats position="top-right" />} */}
        </React.Suspense>
      </Canvas>
    </div>
  );
}

export default Optimized3DCanvas;
