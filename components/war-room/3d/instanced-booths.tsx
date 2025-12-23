"use client";

import React, { useRef, useMemo, useCallback } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Text, Html, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import type { SentimentType } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

export interface Booth3DData {
  boothId: string;
  name: string;
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

// Pre-computed geometries
const BOOTH_GEOMETRY = new THREE.CylinderGeometry(0.6, 0.6, 1, 8, 1);
const BOOTH_CAP_GEOMETRY = new THREE.CylinderGeometry(0.7, 0.6, 0.2, 8, 1);
const BOOTH_BASE_GEOMETRY = new THREE.CircleGeometry(1.5, 16);

// ============================================================================
// Instanced Booth Component
// ============================================================================

interface BoothInstanceProps {
  data: Booth3DData;
  isHovered: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

const BoothInstance = React.memo(function BoothInstance({
  data,
  isHovered,
  onSelect,
  onHover,
}: BoothInstanceProps) {
  // Calculate height based on voter count
  const height = useMemo(() => {
    return Math.max(1, Math.min(6, 1 + Math.log10(data.voterCount + 1) * 1.5));
  }, [data.voterCount]);

  const color = SENTIMENT_COLORS[data.sentiment] || SENTIMENT_COLORS.unknown;
  const scale = isHovered ? 1.1 : 1;

  return (
    <Instance
      position={[
        data.position[0],
        data.position[1] + height / 2,
        data.position[2],
      ]}
      scale={[scale, height * scale, scale]}
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

BoothInstance.displayName = "BoothInstance";

// ============================================================================
// Booth Instances Container
// ============================================================================

interface BoothInstancesProps {
  booths: Booth3DData[];
  hoveredBooth: string | null;
  onSelectBooth: (boothId: string) => void;
  onHoverBooth: (boothId: string | null) => void;
}

export function BoothInstances({
  booths,
  hoveredBooth,
  onSelectBooth,
  onHoverBooth,
}: BoothInstancesProps) {
  const handleHover = useCallback(
    (boothId: string, hovered: boolean) => {
      onHoverBooth(hovered ? boothId : null);
    },
    [onHoverBooth]
  );

  return (
    <Instances
      limit={Math.max(200, booths.length)}
      range={booths.length}
      geometry={BOOTH_GEOMETRY}
    >
      <meshStandardMaterial metalness={0.3} roughness={0.3} />

      {booths.map((booth) => (
        <BoothInstance
          key={booth.boothId}
          data={booth}
          isHovered={hoveredBooth === booth.boothId}
          onSelect={() => onSelectBooth(booth.boothId)}
          onHover={(hovered) => handleHover(booth.boothId, hovered)}
        />
      ))}
    </Instances>
  );
}

// ============================================================================
// Booth Labels
// ============================================================================

interface BoothLabelsProps {
  booths: Booth3DData[];
  hoveredBooth: string | null;
  showLabels?: boolean;
}

export function BoothLabels({
  booths,
  hoveredBooth,
  showLabels = true,
}: BoothLabelsProps) {
  if (!showLabels) return null;

  return (
    <>
      {booths.map((booth) => {
        const height = Math.max(
          1,
          Math.min(6, 1 + Math.log10(booth.voterCount + 1) * 1.5)
        );

        return (
          <group
            key={`booth-label-${booth.boothId}`}
            position={[
              booth.position[0],
              booth.position[1] + height + 0.8,
              booth.position[2],
            ]}
          >
            <Text
              fontSize={0.22}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#000000"
              maxWidth={2.0}
              textAlign="center"
            >
              {booth.name}
            </Text>
            <Text
              position={[0, -0.3, 0]}
              fontSize={0.2}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#000000"
            >
              {booth.voterCount.toLocaleString()}
            </Text>
          </group>
        );
      })}
    </>
  );
}

// ============================================================================
// Booth Base Plates
// ============================================================================

interface BoothBasePlatesProps {
  booths: Booth3DData[];
}

export function BoothBasePlates({ booths }: BoothBasePlatesProps) {
  return (
    <Instances
      limit={Math.max(200, booths.length)}
      range={booths.length}
      geometry={BOOTH_BASE_GEOMETRY}
    >
      <meshStandardMaterial transparent opacity={0.1} depthWrite={false} />

      {booths.map((booth) => (
        <Instance
          key={`booth-plate-${booth.boothId}`}
          position={[booth.position[0], 0.02, booth.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={SENTIMENT_COLORS[booth.sentiment] || SENTIMENT_COLORS.unknown}
        />
      ))}
    </Instances>
  );
}

// ============================================================================
// Booth Hover Card
// ============================================================================

interface BoothHoverCardProps {
  booth: Booth3DData | null;
}

export function BoothHoverCard3D({ booth }: BoothHoverCardProps) {
  if (!booth) return null;

  const height = Math.max(
    1,
    Math.min(6, 1 + Math.log10(booth.voterCount + 1) * 1.5)
  );

  return (
    <Html
      position={[
        booth.position[0],
        booth.position[1] + height + 1.5,
        booth.position[2],
      ]}
      center
      distanceFactor={6}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: "none" }}
    >
      <div className="bg-card/95 backdrop-blur border border-border rounded-lg shadow-xl p-3 min-w-[180px]">
        <div className="font-semibold text-sm mb-2">{booth.name}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Voters:</span>
            <span className="font-medium">
              {booth.voterCount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-green-600">Support:</span>
            <span className="font-medium">
              {booth.supportCount} ({booth.supportPercent.toFixed(0)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-red-600">Oppose:</span>
            <span className="font-medium">{booth.opposeCount}</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// Complete Instanced Booth Scene
// ============================================================================

interface InstancedBoothSceneProps {
  booths: Booth3DData[];
  hoveredBooth: string | null;
  onSelectBooth: (boothId: string) => void;
  onHoverBooth: (boothId: string | null) => void;
  showLabels?: boolean;
}

export function InstancedBoothScene({
  booths,
  hoveredBooth,
  onSelectBooth,
  onHoverBooth,
  showLabels = true,
}: InstancedBoothSceneProps) {
  const hoveredBoothData = useMemo(
    () => booths.find((b) => b.boothId === hoveredBooth) || null,
    [booths, hoveredBooth]
  );

  return (
    <>
      <BoothBasePlates booths={booths} />
      <BoothInstances
        booths={booths}
        hoveredBooth={hoveredBooth}
        onSelectBooth={onSelectBooth}
        onHoverBooth={onHoverBooth}
      />
      <BoothLabels
        booths={booths}
        hoveredBooth={hoveredBooth}
        showLabels={showLabels}
      />
      <BoothHoverCard3D booth={hoveredBoothData} />
    </>
  );
}

// Export geometries for cleanup
export { BOOTH_GEOMETRY, BOOTH_CAP_GEOMETRY, BOOTH_BASE_GEOMETRY };
