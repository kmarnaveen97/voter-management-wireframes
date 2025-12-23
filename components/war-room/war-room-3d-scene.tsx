// @ts-nocheck
"use client";

import React, { useRef, Suspense, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  Html,
  Environment,
  Float,
  Billboard,
} from "@react-three/drei";
import * as THREE from "three";
import type { SentimentType } from "@/lib/api";

// ============================================================================
// Types & Constants
// ============================================================================

const SENTIMENT_COLORS: Record<SentimentType, string> = {
  support: "#22c55e",
  oppose: "#ef4444",
  swing: "#f59e0b",
  unknown: "#6b7280",
  neutral: "#06b6d4",
};

const SENTIMENT_EMISSIVE: Record<SentimentType, string> = {
  support: "#166534",
  oppose: "#991b1b",
  swing: "#b45309",
  unknown: "#374151",
  neutral: "#0e7490",
};

// Turnout-based colors (percentage thresholds) - matching sentiment color style
const getTurnoutColor = (supportPercent: number): string => {
  if (supportPercent >= 80) return "#22c55e"; // green-500 - High (like support)
  if (supportPercent >= 60) return "#06b6d4"; // cyan-500 - Good (like neutral)
  if (supportPercent >= 40) return "#f59e0b"; // amber-500 - Medium (like swing)
  if (supportPercent >= 20) return "#6b7280"; // gray-500 - Low (like unknown)
  return "#ef4444"; // red-500 - Critical (like oppose)
};

const getTurnoutEmissive = (supportPercent: number): string => {
  if (supportPercent >= 80) return "#166534"; // green emissive
  if (supportPercent >= 60) return "#0e7490"; // cyan emissive
  if (supportPercent >= 40) return "#b45309"; // amber emissive
  if (supportPercent >= 20) return "#374151"; // gray emissive
  return "#991b1b"; // red emissive
};

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

export interface FamilyMember {
  voter_id: number;
  name: string;
  age: number;
  gender: string;
  sentiment?: SentimentType;
}

export interface Family3DData {
  id: string;
  houseNo: string;
  headOfFamily?: string;
  members?: FamilyMember[];
  position: [number, number, number];
  sentiment: SentimentType;
  voterCount: number;
  supportCount: number;
  opposeCount: number;
  swingCount: number;
  unknownCount: number;
}

// ============================================================================
// 3D Building Component (represents a ward)
// ============================================================================

interface WardBuildingProps {
  data: Ward3DData;
  isSelected: boolean;
  isHovered: boolean;
  isFocusMode: boolean; // Any ward is selected or hovered
  displayMode: "sentiment" | "turnout";
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
  index: number;
  total: number;
}

function WardBuilding({
  data,
  isSelected,
  isHovered,
  isFocusMode,
  displayMode,
  onSelect,
  onHover,
  index,
  total,
}: WardBuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const donutRef = useRef<THREE.Group>(null);
  const arrowRef = useRef<THREE.Group>(null);

  // Determine if this building should be dimmed
  const isDimmed = isFocusMode && !isSelected && !isHovered;

  // Get colors based on display mode
  const baseColor =
    displayMode === "turnout"
      ? getTurnoutColor(data.supportPercent)
      : SENTIMENT_COLORS[data.sentiment];
  const emissive =
    displayMode === "turnout"
      ? getTurnoutEmissive(data.supportPercent)
      : SENTIMENT_EMISSIVE[data.sentiment];

  // Animate hover/select effects
  useFrame((state) => {
    if (meshRef.current) {
      // Smooth scale animation - shrink dimmed buildings
      const scale = isSelected ? 1.15 : isHovered ? 1.1 : isDimmed ? 0.9 : 1;
      meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

      // Gentle float animation for selected
      if (isSelected) {
        meshRef.current.position.y =
          data.position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
      } else {
        meshRef.current.position.y = THREE.MathUtils.lerp(
          meshRef.current.position.y,
          data.position[1],
          0.1
        );
      }
    }

    // Rotate donut
    if (donutRef.current) {
      donutRef.current.rotation.y += 0.02;
    }

    // Float arrow
    if (arrowRef.current) {
      // Base height is height/2, we add sine wave
      arrowRef.current.position.y =
        height / 2 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  // Building height based on voter count (normalized)
  // Logarithmic scaling for better visual distinction across varying voter counts
  const height = Math.max(
    1.5,
    Math.min(8, 1.5 + Math.log10(data.voterCount + 1) * 2)
  );

  // Dimmed appearance
  const color = isDimmed ? "#4a5568" : baseColor;
  const opacity = isDimmed ? 0.5 : 1;

  // Calculate stagger offset for text to avoid overlap in circular layout
  // Use alternating heights based on index (odd/even) for better separation
  const textYOffset = (index % 3) * 1.5; // 3-level stagger: 0, 1.5, 3.0

  // Swing calculation (mock logic if not provided)
  const isSwing =
    data.sentiment === "swing" || data.swingCount > data.voterCount * 0.1;
  const swingDirection = isSwing ? 1 : 0; // 1 = up/positive swing

  return (
    <group position={data.position}>
      {/* Heatmap Base Plate */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <circleGeometry args={[2.5, 32]} />
        <meshStandardMaterial
          color={baseColor}
          transparent
          opacity={0.15}
          depthWrite={false}
        />
      </mesh>

      {/* Main building - Hexagonal Prism for "Victory Pillar" look */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
          document.body.style.cursor = "auto";
        }}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.8, 0.8, height, 6]} />
        <meshPhysicalMaterial
          color={color}
          emissive={isSelected || isHovered ? emissive : "#000000"}
          emissiveIntensity={isSelected ? 0.8 : isHovered ? 0.5 : 0.2}
          metalness={0.1}
          roughness={0.1}
          transmission={0.6}
          thickness={1}
          transparent={true}
          opacity={isDimmed ? 0.3 : 0.9}
        />
      </mesh>

      {/* Floating Percentage Donut */}
      {!isDimmed && (
        <group ref={donutRef} position={[0, height / 2 + 0.5, 0]}>
          {/* Support Ring (Green) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry
              args={[
                1.0,
                0.08,
                16,
                32,
                (data.supportPercent / 100) * Math.PI * 2,
              ]}
            />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#22c55e"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          {/* Background Ring (Grey) */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[1.0, 0.05, 16, 32, Math.PI * 2]} />
            <meshPhysicalMaterial
              color="#334155"
              transparent
              opacity={0.3}
              roughness={0}
              metalness={0.5}
            />
          </mesh>
        </group>
      )}

      {/* Swing Arrow */}
      {isSwing && !isDimmed && (
        <group ref={arrowRef} position={[1.2, height / 2, 1.2]}>
          <mesh position={[0, 0.5, 0]}>
            <coneGeometry args={[0.3, 0.6, 4]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={1}
            />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.6, 4]} />
            <meshStandardMaterial
              color="#f59e0b"
              emissive="#f59e0b"
              emissiveIntensity={1}
            />
          </mesh>
        </group>
      )}

      {/* Spotlight for selected/hovered */}
      {(isSelected || isHovered) && (
        <pointLight
          position={[0, height + 2, 0]}
          intensity={isSelected ? 3 : 2}
          distance={8}
          color={baseColor}
          decay={2}
        />
      )}

      {/* Ward Label - Beautiful Framed Billboard - PROMINENT */}
      <Billboard position={[0, height + 2.0, 0]} follow={true}>
        {/* Outer glow effect */}
        <mesh position={[0, 0.15, -0.08]}>
          <planeGeometry args={[3.2, 1.8]} />
          <meshBasicMaterial color={baseColor} transparent opacity={0.15} />
        </mesh>
        {/* Glass frame background */}
        <mesh position={[0, 0.15, -0.05]}>
          <planeGeometry args={[2.8, 1.5]} />
          <meshPhysicalMaterial
            color="#0a0f1a"
            transparent
            opacity={0.95}
            roughness={0.05}
            metalness={0.2}
            clearcoat={1}
          />
        </mesh>
        {/* Frame border - top */}
        <mesh position={[0, 0.88, -0.04]}>
          <boxGeometry args={[2.95, 0.1, 0.03]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={1.0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Frame border - bottom */}
        <mesh position={[0, -0.58, -0.04]}>
          <boxGeometry args={[2.95, 0.1, 0.03]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={1.0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Frame border - left */}
        <mesh position={[-1.42, 0.15, -0.04]}>
          <boxGeometry args={[0.1, 1.36, 0.03]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={1.0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Frame border - right */}
        <mesh position={[1.42, 0.15, -0.04]}>
          <boxGeometry args={[0.1, 1.36, 0.03]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={1.0}
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>
        {/* Corner accents - larger and brighter */}
        <mesh position={[-1.28, 0.72, -0.03]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.2}
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        <mesh position={[1.28, 0.72, -0.03]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.2}
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        <mesh position={[-1.28, -0.42, -0.03]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.2}
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        <mesh position={[1.28, -0.42, -0.03]}>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.2}
            metalness={0.95}
            roughness={0.05}
          />
        </mesh>
        {/* Ward title - LARGER */}
        <Text
          position={[0, 0.55, 0]}
          fontSize={0.6}
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff"
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          WARD {data.wardNo}
        </Text>
        {/* Stats line - LARGER */}
        <Text
          position={[0, 0.1, 0]}
          fontSize={0.32}
          color="#e2e8f0"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {data.voterCount.toLocaleString()} voters
        </Text>
        {/* Support percentage with color - LARGER */}
        <Text
          position={[0, -0.32, 0]}
          fontSize={0.38}
          color={baseColor}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.015}
          outlineColor="#000000"
        >
          {data.supportPercent.toFixed(0)}% Support
        </Text>
      </Billboard>

      {/* Info card - staggered height to avoid overlap with own label */}
      <Html
        position={[0, height + 3.5 + textYOffset, 0]}
        center
        distanceFactor={15}
        zIndexRange={[100 - index, 0]}
        style={{ pointerEvents: "none" }}
        occlude={false}
      >
        <div
          className="animate-in fade-in-0 slide-in-from-bottom-2 zoom-in-95 duration-200 ease-out"
          style={{
            transform: "translateZ(0)",
            willChange: "transform, opacity",
          }}
        >
          {/* Outer glow */}
          <div
            className="absolute inset-0 rounded-2xl blur-xl opacity-20 -z-10"
            style={{ backgroundColor: baseColor }}
          />

          <div className="relative bg-slate-950/95 backdrop-blur-2xl border border-white/[0.08] rounded-2xl shadow-[0_20px_70px_-15px_rgba(0,0,0,0.5)] p-4 w-48 sm:w-56">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold text-white"
                  style={{
                    background: `linear-gradient(135deg, ${baseColor}, ${baseColor}80)`,
                    boxShadow: `0 4px 12px ${baseColor}40`,
                  }}
                >
                  {data.wardNo}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">
                    Ward {data.wardNo}
                  </div>
                  <div className="text-slate-500 text-[10px]">
                    {data.voterCount.toLocaleString()} voters
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="text-center p-2 rounded-xl bg-green-500/[0.08] border border-green-500/10">
                <div className="text-green-400 font-bold text-base tabular-nums">
                  {data.supportCount}
                </div>
                <div className="text-[9px] text-green-500/60 font-medium uppercase tracking-wider">
                  Support
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-red-500/[0.08] border border-red-500/10">
                <div className="text-red-400 font-bold text-base tabular-nums">
                  {data.opposeCount}
                </div>
                <div className="text-[9px] text-red-500/60 font-medium uppercase tracking-wider">
                  Oppose
                </div>
              </div>
              <div className="text-center p-2 rounded-xl bg-amber-500/[0.08] border border-amber-500/10">
                <div className="text-amber-400 font-bold text-base tabular-nums">
                  {data.swingCount}
                </div>
                <div className="text-[9px] text-amber-500/60 font-medium uppercase tracking-wider">
                  Swing
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden flex">
              <div
                className="h-full rounded-l-full transition-all duration-300"
                style={{
                  width: `${(data.supportCount / data.voterCount) * 100}%`,
                  background: "linear-gradient(90deg, #22c55e, #4ade80)",
                }}
              />
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(data.opposeCount / data.voterCount) * 100}%`,
                  background: "linear-gradient(90deg, #ef4444, #f87171)",
                }}
              />
              <div
                className="h-full rounded-r-full transition-all duration-300"
                style={{
                  width: `${(data.swingCount / data.voterCount) * 100}%`,
                  background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                }}
              />
            </div>

            {/* Click hint */}
            <div className="mt-3 text-center">
              <span className="text-[10px] text-slate-500">
                Click to explore →
              </span>
            </div>
          </div>
        </div>
      </Html>

      {/* Selection ring */}
      {isSelected && (
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.4, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// 3D Booth Component (represents a polling booth)
// ============================================================================

interface BoothBuildingProps {
  data: Booth3DData;
  isHovered: boolean;
  displayMode: "sentiment" | "turnout";
  onHover: (hovered: boolean) => void;
  onSelect: () => void;
  index: number;
  total: number;
}

function BoothBuilding({
  data,
  isHovered,
  displayMode,
  onHover,
  onSelect,
  index,
  total,
}: BoothBuildingProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    const scale = isHovered ? 1.1 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
  });

  // Logarithmic scaling for booths
  const height = Math.max(
    1,
    Math.min(6, 1 + Math.log10(data.voterCount + 1) * 1.5)
  );

  // Get colors based on display mode
  const color =
    displayMode === "turnout"
      ? getTurnoutColor(data.supportPercent)
      : SENTIMENT_COLORS[data.sentiment];
  const emissive =
    displayMode === "turnout"
      ? getTurnoutEmissive(data.supportPercent)
      : SENTIMENT_EMISSIVE[data.sentiment];

  // Calculate stagger offset for text to avoid overlap in circular layout
  // Use alternating heights based on index for better separation
  const textYOffset = (index % 4) * 0.8; // 4-level stagger: 0, 0.8, 1.6, 2.4

  return (
    <group position={data.position}>
      {/* Heatmap Base Plate */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        receiveShadow
      >
        <circleGeometry args={[1.5, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.1}
          depthWrite={false}
        />
      </mesh>

      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
          document.body.style.cursor = "auto";
        }}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.6, 0.6, height, 8]} />
        <meshPhysicalMaterial
          color={color}
          emissive={isHovered ? emissive : "#000000"}
          emissiveIntensity={isHovered ? 0.5 : 0.2}
          metalness={0.4}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.1}
        />
      </mesh>

      {/* Roof Cap */}
      <mesh position={[0, height / 2 + 0.1, 0]} ref={meshRef}>
        <cylinderGeometry args={[0.7, 0.6, 0.2, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>

      {/* Booth Label - Beautiful Compact Frame - PROMINENT */}
      <Billboard position={[0, height + 1.2, 0]} follow={true}>
        {/* Outer glow effect */}
        <mesh position={[0, 0.08, -0.05]}>
          <planeGeometry args={[2.6, 1.2]} />
          <meshBasicMaterial color={color} transparent opacity={0.12} />
        </mesh>
        {/* Glass frame background */}
        <mesh position={[0, 0.08, -0.03]}>
          <planeGeometry args={[2.3, 1.0]} />
          <meshPhysicalMaterial
            color="#0f172a"
            transparent
            opacity={0.95}
            roughness={0.05}
            metalness={0.2}
            clearcoat={1}
          />
        </mesh>
        {/* Frame border - top */}
        <mesh position={[0, 0.56, -0.02]}>
          <boxGeometry args={[2.4, 0.07, 0.02]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Frame border - bottom */}
        <mesh position={[0, -0.4, -0.02]}>
          <boxGeometry args={[2.4, 0.07, 0.02]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Frame border - left */}
        <mesh position={[-1.15, 0.08, -0.02]}>
          <boxGeometry args={[0.07, 0.88, 0.02]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Frame border - right */}
        <mesh position={[1.15, 0.08, -0.02]}>
          <boxGeometry args={[0.07, 0.88, 0.02]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Booth name - LARGER */}
        <Text
          position={[0, 0.28, 0]}
          fontSize={0.26}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.0}
          textAlign="center"
          fontWeight="bold"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          {data.name}
        </Text>
        {/* Voter count - LARGER */}
        <Text
          position={[0, -0.12, 0]}
          fontSize={0.2}
          color={color}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {data.voterCount.toLocaleString()} Voters
        </Text>
      </Billboard>
    </group>
  );
}

// ============================================================================
// 3D Family Component (represents a house) - Professional House Model
// ============================================================================

interface FamilyBuildingProps {
  data: Family3DData;
  isHovered: boolean;
  isSelected: boolean;
  isFocusMode: boolean; // Any family is being hovered/selected
  displayMode: "sentiment" | "turnout";
  onHover: (hovered: boolean) => void;
  onSelect: () => void;
}

function FamilyBuilding({
  data,
  isHovered,
  isSelected,
  isFocusMode,
  displayMode,
  onHover,
  onSelect,
}: FamilyBuildingProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const chimneyRef = useRef<THREE.Mesh>(null);

  // Determine if this building should be dimmed (focus mode active but not this one)
  const isDimmed = isFocusMode && !isHovered && !isSelected;
  const isActive = isHovered || isSelected;

  // Calculate support percent for family
  const supportPercent =
    data.voterCount > 0 ? (data.supportCount / data.voterCount) * 100 : 0;

  // Get colors based on display mode
  const color =
    displayMode === "turnout"
      ? getTurnoutColor(supportPercent)
      : SENTIMENT_COLORS[data.sentiment];
  const emissive =
    displayMode === "turnout"
      ? getTurnoutEmissive(supportPercent)
      : SENTIMENT_EMISSIVE[data.sentiment];

  // House dimensions based on family size
  const baseWidth = 0.6 + Math.min(data.voterCount * 0.08, 0.4);
  const baseDepth = 0.5 + Math.min(data.voterCount * 0.06, 0.3);
  const wallHeight = 0.4 + Math.min(data.voterCount * 0.15, 0.8);
  const roofHeight = 0.3 + Math.min(data.voterCount * 0.05, 0.2);

  useFrame((state) => {
    if (!groupRef.current) return;
    // Scale up hovered/selected, scale down dimmed
    const scale = isActive ? 1.2 : isDimmed ? 0.85 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.12);

    // Gentle floating animation for active houses
    if (isActive) {
      groupRef.current.position.y =
        Math.sin(state.clock.elapsedTime * 2) * 0.03;
    } else {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        0,
        0.1
      );
    }

    // Animate selection ring pulse
    if (ringRef.current && isSelected) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.15;
      ringRef.current.scale.set(pulse, pulse, 1);
    }

    // Chimney smoke animation (subtle)
    if (chimneyRef.current && isActive) {
      chimneyRef.current.rotation.y += 0.02;
    }
  });

  // Dimmed colors for unfocused buildings
  const wallColor = isDimmed ? "#4a5568" : "#f8fafc";
  const roofColor = isDimmed ? "#374151" : color;
  const doorColor = isDimmed ? "#1e293b" : "#78350f";
  const windowColor = isDimmed ? "#1e293b" : "#60a5fa";
  const opacity = isDimmed ? 0.6 : 1;

  const totalHeight = wallHeight + roofHeight;

  return (
    <group position={data.position}>
      {/* Garden/Lawn Base */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        receiveShadow
      >
        <circleGeometry args={[1.2, 24]} />
        <meshStandardMaterial
          color="#166534"
          transparent
          opacity={isDimmed ? 0.3 : 0.6}
          depthWrite={false}
        />
      </mesh>

      {/* Sentiment Glow Ring (always visible, brighter when active) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[1.0, 1.2, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isActive ? 0.8 : 0.3}
        />
      </mesh>

      {/* Spotlight effect on hovered/selected building */}
      {isActive && (
        <>
          <pointLight
            position={[0, totalHeight + 1.5, 0]}
            intensity={isSelected ? 5 : 3}
            distance={5}
            color={color}
            decay={2}
          />
          {/* Animated selection ring */}
          <mesh
            ref={ringRef}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.03, 0]}
          >
            <ringGeometry args={[1.2, isSelected ? 1.6 : 1.4, 32]} />
            <meshBasicMaterial
              color="#ffffff"
              transparent
              opacity={isSelected ? 0.6 : 0.3}
            />
          </mesh>
        </>
      )}

      {/* House Group (for scaling animation) */}
      <group
        ref={groupRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(false);
          document.body.style.cursor = "auto";
        }}
      >
        {/* Foundation/Base */}
        <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
          <boxGeometry args={[baseWidth + 0.1, 0.06, baseDepth + 0.1]} />
          <meshStandardMaterial color="#64748b" roughness={0.9} />
        </mesh>

        {/* Main Walls */}
        <mesh position={[0, wallHeight / 2 + 0.06, 0]} castShadow receiveShadow>
          <boxGeometry args={[baseWidth, wallHeight, baseDepth]} />
          <meshStandardMaterial
            color={wallColor}
            emissive={isActive ? emissive : "#000000"}
            emissiveIntensity={isActive ? 0.3 : 0}
            roughness={0.7}
            metalness={0.1}
            transparent={isDimmed}
            opacity={opacity}
          />
        </mesh>

        {/* Roof (Triangular Prism) */}
        <mesh position={[0, wallHeight + roofHeight / 2 + 0.06, 0]} castShadow>
          <coneGeometry args={[baseWidth * 0.75, roofHeight, 4]} />
          <meshStandardMaterial
            color={roofColor}
            emissive={isActive ? color : "#000000"}
            emissiveIntensity={isActive ? 0.5 : 0.2}
            roughness={0.4}
            metalness={0.3}
            transparent={isDimmed}
            opacity={opacity}
          />
        </mesh>

        {/* Door */}
        <mesh position={[0, 0.2, baseDepth / 2 + 0.01]} castShadow>
          <boxGeometry args={[0.15, 0.3, 0.02]} />
          <meshStandardMaterial color={doorColor} roughness={0.8} />
        </mesh>

        {/* Door Knob */}
        <mesh position={[0.04, 0.18, baseDepth / 2 + 0.03]}>
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial
            color="#fbbf24"
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        {/* Windows (2 on front) */}
        <mesh position={[-0.15, wallHeight * 0.6, baseDepth / 2 + 0.01]}>
          <boxGeometry args={[0.1, 0.12, 0.02]} />
          <meshStandardMaterial
            color={windowColor}
            emissive={isActive ? "#fef3c7" : "#000000"}
            emissiveIntensity={isActive ? 1 : 0.3}
            transparent
            opacity={0.9}
          />
        </mesh>
        <mesh position={[0.15, wallHeight * 0.6, baseDepth / 2 + 0.01]}>
          <boxGeometry args={[0.1, 0.12, 0.02]} />
          <meshStandardMaterial
            color={windowColor}
            emissive={isActive ? "#fef3c7" : "#000000"}
            emissiveIntensity={isActive ? 1 : 0.3}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Chimney */}
        <mesh
          ref={chimneyRef}
          position={[baseWidth * 0.3, wallHeight + roofHeight * 0.7, 0]}
          castShadow
        >
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color="#78716c" roughness={0.9} />
        </mesh>

        {/* Chimney Top */}
        <mesh
          position={[baseWidth * 0.3, wallHeight + roofHeight * 0.7 + 0.12, 0]}
        >
          <boxGeometry args={[0.1, 0.03, 0.1]} />
          <meshStandardMaterial color="#57534e" roughness={0.9} />
        </mesh>

        {/* Family Count Badge on roof */}
        <mesh position={[0, wallHeight + roofHeight + 0.15, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 0.06, 16]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.8}
          />
        </mesh>
      </group>

      {/* House Label - Beautiful Mini Frame - PROMINENT */}
      <Billboard position={[0, totalHeight + 0.8, 0]} follow={true}>
        {/* Outer glow effect */}
        <mesh position={[0, 0.05, -0.04]}>
          <planeGeometry args={[1.6, 0.9]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} />
        </mesh>
        {/* Glass frame background */}
        <mesh position={[0, 0.05, -0.02]}>
          <planeGeometry args={[1.4, 0.7]} />
          <meshPhysicalMaterial
            color="#0a0f1a"
            transparent
            opacity={0.95}
            roughness={0.05}
            metalness={0.15}
            clearcoat={1}
          />
        </mesh>
        {/* Frame border - top - colored by sentiment */}
        <mesh position={[0, 0.38, -0.01]}>
          <boxGeometry args={[1.45, 0.05, 0.015]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Frame border - bottom */}
        <mesh position={[0, -0.28, -0.01]}>
          <boxGeometry args={[1.45, 0.05, 0.015]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Frame border - left */}
        <mesh position={[-0.7, 0.05, -0.01]}>
          <boxGeometry args={[0.05, 0.61, 0.015]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* Frame border - right */}
        <mesh position={[0.7, 0.05, -0.01]}>
          <boxGeometry args={[0.05, 0.61, 0.015]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.0}
            metalness={0.85}
            roughness={0.15}
          />
        </mesh>
        {/* House number - LARGER */}
        <Text
          position={[0, 0.18, 0]}
          fontSize={0.24}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
          outlineWidth={0.01}
          outlineColor="#000000"
        >
          #{data.houseNo}
        </Text>
        {/* Voter count - LARGER */}
        <Text
          position={[0, -0.1, 0]}
          fontSize={0.16}
          color={color}
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {data.voterCount} {data.voterCount === 1 ? "voter" : "voters"}
        </Text>
      </Billboard>

      {isActive && (
        <Html
          position={[0, totalHeight + 1.5, 0]}
          center
          distanceFactor={6}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: isSelected ? "auto" : "none" }}
        >
          <div
            className="animate-in fade-in-0 slide-in-from-bottom-3 zoom-in-95 duration-300 ease-out w-56 sm:w-72 md:w-80"
            style={{
              transform: "translateZ(0)",
              willChange: "transform, opacity",
            }}
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Outer ambient glow */}
            <div
              className="absolute inset-0 rounded-3xl blur-2xl opacity-15 -z-10 scale-105"
              style={{ backgroundColor: color }}
            />

            {/* Glassmorphism Container */}
            <div className="relative bg-slate-950/[0.97] backdrop-blur-3xl border border-white/[0.06] rounded-3xl shadow-[0_32px_80px_-20px_rgba(0,0,0,0.6)] overflow-hidden">
              {/* Premium Header */}
              <div className="relative px-5 py-4">
                {/* Subtle gradient overlay */}
                <div
                  className="absolute inset-0 opacity-[0.08]"
                  style={{
                    background: `radial-gradient(ellipse at top right, ${color}, transparent 70%)`,
                  }}
                />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-white text-lg sm:text-xl tracking-tight">
                      House {data.houseNo}
                    </h3>
                    {data.headOfFamily && (
                      <p className="text-sm text-slate-400 truncate mt-1">
                        {data.headOfFamily}
                      </p>
                    )}
                  </div>
                  <div
                    className="shrink-0 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, ${color}25, ${color}08)`,
                      color: color,
                      border: `1px solid ${color}30`,
                      boxShadow: `0 0 24px ${color}15, inset 0 1px 0 ${color}20`,
                    }}
                  >
                    {data.sentiment}
                  </div>
                </div>
              </div>

              {/* Stats Grid - Apple-style metrics */}
              <div className="grid grid-cols-4 border-y border-white/[0.04]">
                {[
                  {
                    value: data.voterCount,
                    label: "Total",
                    textColor: "text-white",
                    bgColor: "bg-white/[0.02]",
                  },
                  {
                    value: data.supportCount,
                    label: "Support",
                    textColor: "text-green-400",
                    bgColor: "bg-green-500/[0.04]",
                  },
                  {
                    value: data.opposeCount,
                    label: "Oppose",
                    textColor: "text-red-400",
                    bgColor: "bg-red-500/[0.04]",
                  },
                  {
                    value: data.swingCount,
                    label: "Swing",
                    textColor: "text-amber-400",
                    bgColor: "bg-amber-500/[0.04]",
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className={`py-3 sm:py-4 text-center ${stat.bgColor} ${
                      i > 0 ? "border-l border-white/[0.04]" : ""
                    }`}
                  >
                    <div
                      className={`text-xl sm:text-2xl font-bold tabular-nums tracking-tight ${stat.textColor}`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>

              {/* Segmented Progress Bar */}
              <div className="h-1 flex">
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      data.voterCount
                        ? (data.supportCount / data.voterCount) * 100
                        : 0
                    }%`,
                    background: "linear-gradient(90deg, #22c55e, #4ade80)",
                  }}
                />
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      data.voterCount
                        ? (data.opposeCount / data.voterCount) * 100
                        : 0
                    }%`,
                    background: "linear-gradient(90deg, #ef4444, #f87171)",
                  }}
                />
                <div
                  className="h-full transition-all duration-500 ease-out"
                  style={{
                    width: `${
                      data.voterCount
                        ? (data.swingCount / data.voterCount) * 100
                        : 0
                    }%`,
                    background: "linear-gradient(90deg, #f59e0b, #fbbf24)",
                  }}
                />
                <div className="h-full flex-1 bg-slate-800/50" />
              </div>

              {/* Members List */}
              {data.members && data.members.length > 0 && (
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
                      Members
                    </span>
                    <span className="text-[10px] text-slate-600 tabular-nums">
                      {data.members.length} people
                    </span>
                  </div>

                  <div
                    className="max-h-32 sm:max-h-40 md:max-h-48 overflow-y-auto overscroll-contain space-y-1.5 pr-1"
                    style={{
                      WebkitOverflowScrolling: "touch",
                      scrollbarWidth: "thin",
                      scrollbarColor: "rgba(255,255,255,0.1) transparent",
                    }}
                  >
                    {data.members.map((member, idx) => (
                      <div
                        key={member.voter_id || idx}
                        className="group flex items-center gap-3 py-2.5 px-3 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-transparent hover:border-white/[0.05] transition-all duration-150"
                      >
                        {/* Sentiment Indicator with glow */}
                        <div className="relative">
                          <div
                            className="absolute inset-0 rounded-full blur-sm opacity-50"
                            style={{
                              backgroundColor:
                                SENTIMENT_COLORS[member.sentiment || "unknown"],
                            }}
                          />
                          <div
                            className="relative w-2.5 h-2.5 rounded-full ring-1 ring-white/20"
                            style={{
                              backgroundColor:
                                SENTIMENT_COLORS[member.sentiment || "unknown"],
                            }}
                          />
                        </div>

                        {/* Name */}
                        <span className="flex-1 text-sm text-white font-medium truncate">
                          {member.name}
                        </span>

                        {/* Meta */}
                        <div className="flex items-center gap-2 text-slate-500 shrink-0">
                          <span
                            className="text-sm"
                            style={{
                              color:
                                member.gender === "Male" ||
                                member.gender === "पु"
                                  ? "#60a5fa"
                                  : "#f472b6",
                            }}
                          >
                            {member.gender === "Male" || member.gender === "पु"
                              ? "♂"
                              : "♀"}
                          </span>
                          <span className="text-xs font-mono tabular-nums text-slate-400">
                            {member.age}y
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer hint */}
              {isSelected && (
                <div className="px-4 pb-3 pt-1 border-t border-white/[0.03]">
                  <div className="text-[10px] text-center text-slate-600">
                    {data.members && data.members.length > 4
                      ? "Scroll to see all • "
                      : ""}
                    <span className="sm:hidden">Tap outside to close</span>
                    <span className="hidden sm:inline">
                      Click outside to close
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// Neighborhood Streets Component (for family view)
// ============================================================================

interface NeighborhoodStreetsProps {
  families: Family3DData[];
}

function NeighborhoodStreets({ families }: NeighborhoodStreetsProps) {
  if (families.length < 2) return null;

  // Calculate bounding box of all houses
  const positions = families.map((f) => f.position);
  const minX = Math.min(...positions.map((p) => p[0])) - 3;
  const maxX = Math.max(...positions.map((p) => p[0])) + 3;
  const minZ = Math.min(...positions.map((p) => p[2])) - 3;
  const maxZ = Math.max(...positions.map((p) => p[2])) + 3;

  const width = maxX - minX;
  const depth = maxZ - minZ;
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  // Calculate unique Z positions (rows) for horizontal streets
  const zPositions = [
    ...new Set(positions.map((p) => Math.round(p[2] * 10) / 10)),
  ].sort((a, b) => a - b);

  return (
    <group>
      {/* Main ground for neighborhood */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.005, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[width + 4, depth + 4]} />
        <meshStandardMaterial color="#1a2e1a" roughness={0.95} metalness={0} />
      </mesh>

      {/* Horizontal streets (between rows) */}
      {zPositions.map((z, i) => (
        <mesh
          key={`street-h-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[centerX, 0.015, z]}
          receiveShadow
        >
          <planeGeometry args={[width + 2, 1.0]} />
          <meshStandardMaterial
            color="#374151"
            roughness={0.85}
            metalness={0.1}
          />
        </mesh>
      ))}

      {/* Center vertical main road */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[centerX, 0.02, centerZ]}
        receiveShadow
      >
        <planeGeometry args={[1.2, depth + 2]} />
        <meshStandardMaterial color="#4b5563" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Road markings (center line) */}
      {Array.from({ length: Math.floor(depth / 2) }).map((_, i) => (
        <mesh
          key={`marking-${i}`}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[centerX, 0.025, minZ + 1 + i * 2]}
        >
          <planeGeometry args={[0.1, 0.8]} />
          <meshBasicMaterial color="#fbbf24" />
        </mesh>
      ))}

      {/* Street lights along main road */}
      {Array.from({ length: Math.floor(depth / 6) + 1 }).map((_, i) => (
        <group
          key={`light-${i}`}
          position={[centerX + 0.8, 0, minZ + 2 + i * 6]}
        >
          {/* Pole */}
          <mesh position={[0, 1.2, 0]}>
            <cylinderGeometry args={[0.03, 0.04, 2.4, 8]} />
            <meshStandardMaterial
              color="#64748b"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
          {/* Light fixture */}
          <mesh position={[0, 2.5, 0]}>
            <sphereGeometry args={[0.12, 16, 16]} />
            <meshStandardMaterial
              color="#fef3c7"
              emissive="#fef3c7"
              emissiveIntensity={0.5}
            />
          </mesh>
          {/* Light glow */}
          <pointLight
            position={[0, 2.5, 0]}
            intensity={0.5}
            distance={8}
            color="#fef3c7"
            decay={2}
          />
        </group>
      ))}

      {/* Decorative trees along streets */}
      {families.slice(0, Math.min(families.length, 10)).map((family, i) => (
        <group
          key={`tree-${i}`}
          position={[
            family.position[0] + (i % 2 === 0 ? 1.5 : -1.5),
            0,
            family.position[2] + 0.5,
          ]}
        >
          {/* Tree trunk */}
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 0.6, 8]} />
            <meshStandardMaterial color="#78350f" roughness={0.9} />
          </mesh>
          {/* Tree foliage */}
          <mesh position={[0, 0.7, 0]}>
            <coneGeometry args={[0.25, 0.5, 8]} />
            <meshStandardMaterial color="#166534" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <coneGeometry args={[0.18, 0.35, 8]} />
            <meshStandardMaterial color="#15803d" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// Ground Plane
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
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial
        color="#0f172a"
        roughness={0.9}
        metalness={0.1}
        envMapIntensity={0.5}
      />
    </mesh>
  );
}

// ============================================================================
// Grid Helper
// ============================================================================

function GridHelper3D() {
  return (
    <gridHelper
      args={[100, 100, "#1e3a5f", "#0f172a"]}
      position={[0, 0.02, 0]}
    />
  );
}

// ============================================================================
// Camera Controller
// ============================================================================

interface CameraControllerProps {
  target: [number, number, number] | null;
  controlsRef: React.RefObject<any>;
}

function CameraController({ target, controlsRef }: CameraControllerProps) {
  const { camera } = useThree();
  const [isAnimating, setIsAnimating] = React.useState(false);
  const currentTarget = React.useRef<THREE.Vector3 | null>(null);

  // Trigger animation when target changes
  React.useEffect(() => {
    if (target) {
      currentTarget.current = new THREE.Vector3(...target);
      setIsAnimating(true);
    }
  }, [target]);

  useFrame((state, delta) => {
    if (!isAnimating || !currentTarget.current || !controlsRef.current) return;

    const targetVec = currentTarget.current;

    // Professional camera positioning - top-down angled view
    const distance = 20;
    const elevation = 25;
    const desiredPos = new THREE.Vector3(
      targetVec.x + distance * 0.5,
      targetVec.y + elevation,
      targetVec.z + distance * 0.5
    );

    // Smooth lerp with easing
    const lerpFactor = 1 - Math.pow(0.01, delta);
    camera.position.lerp(desiredPos, lerpFactor * 2);

    // Lerp controls target (focus point) - look at center
    const lookTarget = new THREE.Vector3(targetVec.x, targetVec.y, targetVec.z);
    controlsRef.current.target.lerp(lookTarget, lerpFactor * 2);
    controlsRef.current.update();

    // Check if we are close enough to stop animation
    if (
      camera.position.distanceTo(desiredPos) < 0.5 &&
      controlsRef.current.target.distanceTo(lookTarget) < 0.2
    ) {
      setIsAnimating(false);
    }
  });

  return null;
}

// ============================================================================
// 3D Scene
// ============================================================================

interface Scene3DProps {
  wards: Ward3DData[];
  booths?: Booth3DData[];
  families?: Family3DData[];
  viewMode: "wards" | "booths" | "families";
  displayMode: "sentiment" | "turnout";
  selectedWard: string | null;
  hoveredWard: string | null;
  onSelectWard: (wardNo: string | null) => void;
  onSelectBooth?: (boothId: string) => void;
  onSelectFamily?: (familyId: string) => void;
  onHoverWard: (wardNo: string | null) => void;
  cameraTarget: [number, number, number] | null;
}

function Scene3D({
  wards,
  booths = [],
  families = [],
  viewMode,
  displayMode,
  selectedWard,
  hoveredWard,
  onSelectWard,
  onSelectBooth,
  onSelectFamily,
  onHoverWard,
  cameraTarget,
}: Scene3DProps) {
  const [hoveredBooth, setHoveredBooth] = React.useState<string | null>(null);
  const [hoveredFamily, setHoveredFamily] = React.useState<string | null>(null);
  const [selectedFamily, setSelectedFamily] = React.useState<string | null>(
    null
  );
  const controlsRef = React.useRef<any>(null);

  // Clear selection when clicking empty ground
  const handleClickEmpty = React.useCallback(() => {
    setSelectedFamily(null);
  }, []);

  // Determine focus modes
  const wardFocusMode = selectedWard !== null || hoveredWard !== null;
  const familyFocusMode = selectedFamily !== null || hoveredFamily !== null;

  return (
    <>
      <Environment preset="studio" />

      {/* Ambient fill light */}
      <ambientLight intensity={0.5} color="#fef3c7" />
      <directionalLight
        position={[20, 40, 20]}
        intensity={1.2}
        castShadow
        shadow-mapSize-width={4096}
        shadow-mapSize-height={4096}
        shadow-camera-far={100}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
        shadow-bias={-0.0001}
        color="#fff7ed"
      />

      {/* Fill light from opposite side - cool blue */}
      <directionalLight
        position={[-15, 20, -15]}
        intensity={0.4}
        color="#60a5fa"
      />

      {/* Rim/back light for depth */}
      <pointLight
        position={[0, 30, -30]}
        intensity={0.6}
        color="#818cf8"
        decay={2}
        distance={80}
      />

      {/* Ground accent lights */}
      <pointLight
        position={[-20, 5, 20]}
        intensity={0.3}
        color="#22c55e"
        decay={2}
        distance={40}
      />
      <pointLight
        position={[20, 5, -20]}
        intensity={0.3}
        color="#f59e0b"
        decay={2}
        distance={40}
      />

      <Ground onClickEmpty={handleClickEmpty} />
      <GridHelper3D />

      {/* Render neighborhood streets for family view */}
      {viewMode === "families" && families.length > 0 && (
        <NeighborhoodStreets families={families} />
      )}

      {viewMode === "wards"
        ? wards.map((ward, index) => (
            <WardBuilding
              key={ward.wardNo}
              data={ward}
              isSelected={selectedWard === ward.wardNo}
              isHovered={hoveredWard === ward.wardNo}
              isFocusMode={wardFocusMode}
              displayMode={displayMode}
              onSelect={() =>
                onSelectWard(selectedWard === ward.wardNo ? null : ward.wardNo)
              }
              onHover={(hovered) => onHoverWard(hovered ? ward.wardNo : null)}
              index={index}
              total={wards.length}
            />
          ))
        : viewMode === "booths"
        ? booths.map((booth, index) => (
            <BoothBuilding
              key={booth.boothId}
              data={booth}
              isHovered={hoveredBooth === booth.boothId}
              displayMode={displayMode}
              onHover={(hovered) =>
                setHoveredBooth(hovered ? booth.boothId : null)
              }
              onSelect={() => onSelectBooth?.(booth.boothId)}
              index={index}
              total={booths.length}
            />
          ))
        : families.map((family) => (
            <FamilyBuilding
              key={family.id}
              data={family}
              isHovered={hoveredFamily === family.id}
              isSelected={selectedFamily === family.id}
              isFocusMode={familyFocusMode}
              displayMode={displayMode}
              onHover={(hovered) =>
                setHoveredFamily(hovered ? family.id : null)
              }
              onSelect={() => {
                // Toggle local selection for visual highlight
                setSelectedFamily(
                  selectedFamily === family.id ? null : family.id
                );
                // Call parent handler to open sheet
                onSelectFamily?.(family.id);
              }}
            />
          ))}

      <CameraController target={cameraTarget} controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={8}
        maxDistance={100}
        minPolarAngle={Math.PI / 6} // 30 degrees - prevent too flat view
        maxPolarAngle={Math.PI / 2.5} // ~72 degrees - keep elevated view
        enableDamping={true}
        dampingFactor={0.1}
        rotateSpeed={0.6}
        zoomSpeed={1.0}
        panSpeed={1.0}
        target={[0, 0, 0]}
      />

      {/* Atmospheric fog for depth */}
      <fog attach="fog" args={["#0a0f1a", 50, 150]} />
    </>
  );
}

// ============================================================================
// Main 3D Canvas Component (exported for dynamic import)
// ============================================================================

interface WarRoom3DCanvasProps {
  wards: Ward3DData[];
  booths?: Booth3DData[];
  families?: Family3DData[];
  viewMode?: "wards" | "booths" | "families";
  displayMode?: "sentiment" | "turnout";
  selectedWard: string | null;
  hoveredWard: string | null;
  onSelectWard: (wardNo: string | null) => void;
  onSelectBooth?: (boothId: string) => void;
  onSelectFamily?: (familyId: string) => void;
  onHoverWard: (wardNo: string | null) => void;
  cameraTarget: [number, number, number] | null;
}

export default function WarRoom3DCanvas({
  wards,
  booths = [],
  families = [],
  viewMode = "wards",
  displayMode = "sentiment",
  selectedWard,
  hoveredWard,
  onSelectWard,
  onSelectBooth,
  onSelectFamily,
  onHoverWard,
  cameraTarget,
}: WarRoom3DCanvasProps) {
  // Calculate optimal camera distance based on content and view mode
  const getCameraPosition = (): [number, number, number] => {
    switch (viewMode) {
      case "wards":
        return [18, 35, 18]; // High isometric view for wards
      case "booths":
        return [14, 28, 14]; // Medium isometric for booths
      case "families":
        return [10, 22, 10]; // Closer isometric for neighborhood
      default:
        return [18, 35, 18];
    }
  };

  const cameraPos = getCameraPosition();

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      performance={{ min: 0.5 }}
      camera={{
        position: cameraPos,
        fov: 40,
        near: 0.1,
        far: 500,
      }}
    >
      <color attach="background" args={["#0f172a"]} />
      <Suspense fallback={null}>
        <Scene3D
          wards={wards}
          booths={booths}
          families={families}
          viewMode={viewMode}
          displayMode={displayMode}
          selectedWard={selectedWard}
          hoveredWard={hoveredWard}
          onSelectWard={onSelectWard}
          onSelectBooth={onSelectBooth}
          onSelectFamily={onSelectFamily}
          onHoverWard={onHoverWard}
          cameraTarget={cameraTarget}
        />
      </Suspense>
    </Canvas>
  );
}

// Export the sentiment colors for use in the page
export { SENTIMENT_COLORS };
