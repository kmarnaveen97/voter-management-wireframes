"use client";

import React, { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { Text, Html, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import type { SentimentType } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface Ward3DData {
  wardNo: string;
  position: [number, number, number];
  sentiment: SentimentType;
  voterCount: number;
  supportCount: number;
  opposeCount: number;
  swingCount: number;
  unknownCount: number;
  supportPercent: number;
}

// ============================================================================
// Constants
// ============================================================================

const SENTIMENT_COLORS: Record<SentimentType, THREE.Color> = {
  support: new THREE.Color("#22c55e"),
  oppose: new THREE.Color("#ef4444"),
  swing: new THREE.Color("#f59e0b"),
  unknown: new THREE.Color("#6b7280"),
  neutral: new THREE.Color("#06b6d4"),
};

const SENTIMENT_EMISSIVE: Record<SentimentType, THREE.Color> = {
  support: new THREE.Color("#166534"),
  oppose: new THREE.Color("#991b1b"),
  swing: new THREE.Color("#b45309"),
  unknown: new THREE.Color("#374151"),
  neutral: new THREE.Color("#0e7490"),
};

const DIMMED_COLOR = new THREE.Color("#4a5568");

// Pre-computed geometry (created once, shared by all instances)
const WARD_GEOMETRY = new THREE.CylinderGeometry(0.8, 0.8, 1, 6, 1);

// ============================================================================
// Instanced Ward Component
// ============================================================================

interface WardInstanceProps {
  data: Ward3DData;
  index: number;
  isSelected: boolean;
  isHovered: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

/**
 * Individual ward instance within the instanced mesh
 * Uses drei's Instance component for efficient rendering
 */
const WardInstance = React.memo(function WardInstance({
  data,
  index,
  isSelected,
  isHovered,
  isDimmed,
  onSelect,
  onHover,
}: WardInstanceProps) {
  const instanceRef = useRef<THREE.InstancedMesh>(null);

  // Calculate height based on voter count (logarithmic scaling)
  const height = useMemo(() => {
    return Math.max(
      1.5,
      Math.min(8, 1.5 + Math.log10(data.voterCount + 1) * 2)
    );
  }, [data.voterCount]);

  // Determine color based on state
  const color = useMemo(() => {
    if (isDimmed) return DIMMED_COLOR;
    return SENTIMENT_COLORS[data.sentiment] || SENTIMENT_COLORS.unknown;
  }, [isDimmed, data.sentiment]);

  // Scale animation
  const targetScale = useMemo(() => {
    if (isSelected) return 1.15;
    if (isHovered) return 1.1;
    if (isDimmed) return 0.9;
    return 1;
  }, [isSelected, isHovered, isDimmed]);

  return (
    <Instance
      ref={instanceRef}
      position={[
        data.position[0],
        data.position[1] + height / 2,
        data.position[2],
      ]}
      scale={[targetScale, height * targetScale, targetScale]}
      color={color}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        onHover(false);
        document.body.style.cursor = "auto";
      }}
    />
  );
});

WardInstance.displayName = "WardInstance";

// ============================================================================
// Ward Instances Container
// ============================================================================

interface WardInstancesProps {
  wards: Ward3DData[];
  selectedWard: string | null;
  hoveredWard: string | null;
  onSelectWard: (wardNo: string | null) => void;
  onHoverWard: (wardNo: string | null) => void;
}

/**
 * Container component that renders all wards using instancing
 * Reduces draw calls from N to 1 for all ward buildings
 */
export function WardInstances({
  wards,
  selectedWard,
  hoveredWard,
  onSelectWard,
  onHoverWard,
}: WardInstancesProps) {
  const isFocusMode = selectedWard !== null || hoveredWard !== null;

  // Memoized handlers to prevent unnecessary re-renders
  const handleSelect = useCallback(
    (wardNo: string) => {
      onSelectWard(selectedWard === wardNo ? null : wardNo);
    },
    [selectedWard, onSelectWard]
  );

  const handleHover = useCallback(
    (wardNo: string, hovered: boolean) => {
      onHoverWard(hovered ? wardNo : null);
    },
    [onHoverWard]
  );

  return (
    <Instances
      limit={Math.max(100, wards.length)} // Allow for dynamic ward count
      range={wards.length}
      geometry={WARD_GEOMETRY}
    >
      {/* Shared material for all instances */}
      <meshStandardMaterial
        transparent
        opacity={0.85}
        metalness={0.2}
        roughness={0.3}
      />

      {/* Render each ward as an instance */}
      {wards.map((ward, index) => {
        const isSelected = selectedWard === ward.wardNo;
        const isHovered = hoveredWard === ward.wardNo;
        const isDimmed = isFocusMode && !isSelected && !isHovered;

        return (
          <WardInstance
            key={ward.wardNo}
            data={ward}
            index={index}
            isSelected={isSelected}
            isHovered={isHovered}
            isDimmed={isDimmed}
            onSelect={() => handleSelect(ward.wardNo)}
            onHover={(hovered) => handleHover(ward.wardNo, hovered)}
          />
        );
      })}
    </Instances>
  );
}

// ============================================================================
// Ward Labels (separate layer for text rendering)
// ============================================================================

interface WardLabelsProps {
  wards: Ward3DData[];
  selectedWard: string | null;
  hoveredWard: string | null;
  showLabels?: boolean;
}

/**
 * Renders ward labels as a separate layer
 * Can be toggled off for better performance on mobile
 */
export function WardLabels({
  wards,
  selectedWard,
  hoveredWard,
  showLabels = true,
}: WardLabelsProps) {
  if (!showLabels) return null;

  const isFocusMode = selectedWard !== null || hoveredWard !== null;

  return (
    <>
      {wards.map((ward) => {
        const isSelected = selectedWard === ward.wardNo;
        const isHovered = hoveredWard === ward.wardNo;
        const isDimmed = isFocusMode && !isSelected && !isHovered;

        if (isDimmed) return null; // Don't render labels for dimmed wards

        const height = Math.max(
          1.5,
          Math.min(8, 1.5 + Math.log10(ward.voterCount + 1) * 2)
        );

        return (
          <group
            key={`label-${ward.wardNo}`}
            position={[
              ward.position[0],
              ward.position[1] + height + 1.5,
              ward.position[2],
            ]}
          >
            <Text
              fontSize={0.35}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#000000"
            >
              W{ward.wardNo}
            </Text>
            <Text
              position={[0, -0.4, 0]}
              fontSize={0.25}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.02}
              outlineColor="#000000"
              fontWeight="bold"
            >
              {ward.supportPercent.toFixed(0)}%
            </Text>
          </group>
        );
      })}
    </>
  );
}

// ============================================================================
// Ward Hover Card (single instance, positioned dynamically)
// ============================================================================

interface WardHoverCardProps {
  ward: Ward3DData | null;
  position: [number, number, number] | null;
}

/**
 * Single hover card component that repositions based on hovered ward
 * Much more efficient than having N Html components
 */
export function WardHoverCard3D({ ward, position }: WardHoverCardProps) {
  if (!ward || !position) return null;

  const height = Math.max(
    1.5,
    Math.min(8, 1.5 + Math.log10(ward.voterCount + 1) * 2)
  );

  return (
    <Html
      position={[position[0], position[1] + height + 2, position[2]]}
      center
      distanceFactor={12}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl p-3 min-w-[180px]">
        <div className="font-semibold text-sm mb-2">Ward {ward.wardNo}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Voters:</span>
            <span className="font-medium">
              {ward.voterCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Support:</span>
            <span className="font-medium">
              {ward.supportCount} ({ward.supportPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600">Oppose:</span>
            <span className="font-medium">{ward.opposeCount}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-amber-600">Swing:</span>
            <span className="font-medium">{ward.swingCount}</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// Ward Base Plates (instanced circles for heatmap effect)
// ============================================================================

interface WardBasePlatesProps {
  wards: Ward3DData[];
}

// Pre-computed circle geometry
const BASE_PLATE_GEOMETRY = new THREE.CircleGeometry(2.5, 16);

/**
 * Renders base plates under each ward for heatmap effect
 * Uses instancing for efficiency
 */
export function WardBasePlates({ wards }: WardBasePlatesProps) {
  return (
    <Instances
      limit={Math.max(100, wards.length)}
      range={wards.length}
      geometry={BASE_PLATE_GEOMETRY}
    >
      <meshStandardMaterial transparent opacity={0.15} depthWrite={false} />

      {wards.map((ward) => (
        <Instance
          key={`plate-${ward.wardNo}`}
          position={[ward.position[0], 0.02, ward.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={SENTIMENT_COLORS[ward.sentiment] || SENTIMENT_COLORS.unknown}
        />
      ))}
    </Instances>
  );
}

// ============================================================================
// Selection Rings (rendered only for selected ward)
// ============================================================================

interface SelectionRingProps {
  position: [number, number, number] | null;
  visible: boolean;
}

/**
 * Animated selection ring that appears under selected ward
 */
export function SelectionRing({ position, visible }: SelectionRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (ringRef.current && visible) {
      // Pulse animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.05;
      ringRef.current.scale.set(scale, scale, 1);
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }
  });

  if (!visible || !position) return null;

  return (
    <mesh
      ref={ringRef}
      position={[position[0], 0.05, position[2]]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[1.2, 1.5, 32]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.8}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// ============================================================================
// Spotlight Effect (for selected/hovered wards)
// ============================================================================

interface WardSpotlightProps {
  position: [number, number, number] | null;
  sentiment: SentimentType | null;
  intensity: number;
}

/**
 * Dynamic spotlight that highlights selected/hovered ward
 */
export function WardSpotlight({
  position,
  sentiment,
  intensity,
}: WardSpotlightProps) {
  if (!position || !sentiment || intensity === 0) return null;

  const color = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.unknown;

  return (
    <pointLight
      position={[position[0], position[1] + 10, position[2]]}
      intensity={intensity}
      distance={15}
      color={color}
      decay={2}
    />
  );
}

// ============================================================================
// Complete Instanced Ward Scene
// ============================================================================

interface InstancedWardSceneProps {
  wards: Ward3DData[];
  selectedWard: string | null;
  hoveredWard: string | null;
  onSelectWard: (wardNo: string | null) => void;
  onHoverWard: (wardNo: string | null) => void;
  showLabels?: boolean;
}

/**
 * Complete instanced ward visualization
 * Combines all optimized components into a single scene
 */
export function InstancedWardScene({
  wards,
  selectedWard,
  hoveredWard,
  onSelectWard,
  onHoverWard,
  showLabels = true,
}: InstancedWardSceneProps) {
  // Find data for hovered/selected ward
  const hoveredWardData = useMemo(
    () => wards.find((w) => w.wardNo === hoveredWard) || null,
    [wards, hoveredWard]
  );

  const selectedWardData = useMemo(
    () => wards.find((w) => w.wardNo === selectedWard) || null,
    [wards, selectedWard]
  );

  return (
    <>
      {/* Base plates (instanced) */}
      <WardBasePlates wards={wards} />

      {/* Main ward buildings (instanced) */}
      <WardInstances
        wards={wards}
        selectedWard={selectedWard}
        hoveredWard={hoveredWard}
        onSelectWard={onSelectWard}
        onHoverWard={onHoverWard}
      />

      {/* Labels (separate layer, can be toggled) */}
      <WardLabels
        wards={wards}
        selectedWard={selectedWard}
        hoveredWard={hoveredWard}
        showLabels={showLabels}
      />

      {/* Selection ring (only for selected) */}
      <SelectionRing
        position={selectedWardData?.position || null}
        visible={!!selectedWard}
      />

      {/* Spotlight effects */}
      <WardSpotlight
        position={selectedWardData?.position || null}
        sentiment={selectedWardData?.sentiment || null}
        intensity={selectedWard ? 3 : 0}
      />
      <WardSpotlight
        position={hoveredWardData?.position || null}
        sentiment={hoveredWardData?.sentiment || null}
        intensity={hoveredWard && !selectedWard ? 2 : 0}
      />

      {/* Hover card (single instance, repositioned) */}
      <WardHoverCard3D
        ward={hoveredWardData}
        position={hoveredWardData?.position || null}
      />
    </>
  );
}

// Export geometry for cleanup
export { WARD_GEOMETRY, BASE_PLATE_GEOMETRY };
