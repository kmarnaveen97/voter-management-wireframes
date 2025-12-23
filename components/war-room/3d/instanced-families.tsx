"use client";

import React, { useRef, useMemo, useCallback, useState } from "react";
import { useFrame, ThreeEvent } from "@react-three/fiber";
import { Text, Html, Instances, Instance } from "@react-three/drei";
import * as THREE from "three";
import type { SentimentType } from "@/lib/api";

// ============================================================================
// Types
// ============================================================================

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
// Constants
// ============================================================================

const SENTIMENT_COLORS: Record<SentimentType, THREE.Color> = {
  support: new THREE.Color("#22c55e"),
  oppose: new THREE.Color("#ef4444"),
  swing: new THREE.Color("#f59e0b"),
  unknown: new THREE.Color("#6b7280"),
  neutral: new THREE.Color("#06b6d4"),
};

const SENTIMENT_HEX: Record<SentimentType, string> = {
  support: "#22c55e",
  oppose: "#ef4444",
  swing: "#f59e0b",
  unknown: "#6b7280",
  neutral: "#06b6d4",
};

const DIMMED_COLOR = new THREE.Color("#4a5568");

// Pre-computed geometries
const FAMILY_GEOMETRY = new THREE.BoxGeometry(0.5, 1, 0.5);
const FAMILY_BASE_GEOMETRY = new THREE.CircleGeometry(0.8, 16);

// ============================================================================
// Family Instance Component
// ============================================================================

interface FamilyInstanceProps {
  data: Family3DData;
  isHovered: boolean;
  isSelected: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  onHover: (hovered: boolean) => void;
}

const FamilyInstance = React.memo(function FamilyInstance({
  data,
  isHovered,
  isSelected,
  isDimmed,
  onSelect,
  onHover,
}: FamilyInstanceProps) {
  // Height based on family size
  const height = useMemo(() => {
    return Math.max(0.4, Math.min(3, 0.4 + data.voterCount * 0.25));
  }, [data.voterCount]);

  const color = useMemo(() => {
    if (isDimmed) return DIMMED_COLOR;
    return SENTIMENT_COLORS[data.sentiment] || SENTIMENT_COLORS.unknown;
  }, [isDimmed, data.sentiment]);

  const scale = useMemo(() => {
    if (isSelected) return 1.25;
    if (isHovered) return 1.15;
    if (isDimmed) return 0.85;
    return 1;
  }, [isSelected, isHovered, isDimmed]);

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

FamilyInstance.displayName = "FamilyInstance";

// ============================================================================
// Family Instances Container
// ============================================================================

interface FamilyInstancesProps {
  families: Family3DData[];
  selectedFamily: string | null;
  hoveredFamily: string | null;
  onSelectFamily: (familyId: string | null) => void;
  onHoverFamily: (familyId: string | null) => void;
}

export function FamilyInstances({
  families,
  selectedFamily,
  hoveredFamily,
  onSelectFamily,
  onHoverFamily,
}: FamilyInstancesProps) {
  const isFocusMode = selectedFamily !== null || hoveredFamily !== null;

  const handleSelect = useCallback(
    (familyId: string) => {
      onSelectFamily(selectedFamily === familyId ? null : familyId);
    },
    [selectedFamily, onSelectFamily]
  );

  const handleHover = useCallback(
    (familyId: string, hovered: boolean) => {
      onHoverFamily(hovered ? familyId : null);
    },
    [onHoverFamily]
  );

  return (
    <Instances
      limit={Math.max(500, families.length)}
      range={families.length}
      geometry={FAMILY_GEOMETRY}
    >
      <meshStandardMaterial metalness={0.5} roughness={0.8} />

      {families.map((family) => {
        const isSelected = selectedFamily === family.id;
        const isHovered = hoveredFamily === family.id;
        const isDimmed = isFocusMode && !isSelected && !isHovered;

        return (
          <FamilyInstance
            key={family.id}
            data={family}
            isSelected={isSelected}
            isHovered={isHovered}
            isDimmed={isDimmed}
            onSelect={() => handleSelect(family.id)}
            onHover={(hovered) => handleHover(family.id, hovered)}
          />
        );
      })}
    </Instances>
  );
}

// ============================================================================
// Family Labels
// ============================================================================

interface FamilyLabelsProps {
  families: Family3DData[];
  selectedFamily: string | null;
  hoveredFamily: string | null;
  showLabels?: boolean;
}

export function FamilyLabels({
  families,
  selectedFamily,
  hoveredFamily,
  showLabels = true,
}: FamilyLabelsProps) {
  if (!showLabels) return null;

  // Only show labels for hovered or selected families to reduce text rendering
  const visibleFamilies = families.filter(
    (f) => f.id === selectedFamily || f.id === hoveredFamily
  );

  return (
    <>
      {visibleFamilies.map((family) => {
        const height = Math.max(
          0.4,
          Math.min(3, 0.4 + family.voterCount * 0.25)
        );

        return (
          <group
            key={`family-label-${family.id}`}
            position={[
              family.position[0],
              family.position[1] + height + 0.6,
              family.position[2],
            ]}
          >
            <Text
              fontSize={0.25}
              color="white"
              anchorX="center"
              anchorY="middle"
              outlineWidth={0.03}
              outlineColor="#000000"
            >
              {family.houseNo}
            </Text>
            {family.headOfFamily && (
              <Text
                position={[0, -0.25, 0]}
                fontSize={0.15}
                color="#e2e8f0"
                anchorX="center"
                anchorY="middle"
                outlineWidth={0.02}
                outlineColor="#000000"
              >
                {family.headOfFamily} ({family.voterCount})
              </Text>
            )}
          </group>
        );
      })}
    </>
  );
}

// ============================================================================
// Family Base Plates
// ============================================================================

interface FamilyBasePlatesProps {
  families: Family3DData[];
}

export function FamilyBasePlates({ families }: FamilyBasePlatesProps) {
  return (
    <Instances
      limit={Math.max(500, families.length)}
      range={families.length}
      geometry={FAMILY_BASE_GEOMETRY}
    >
      <meshStandardMaterial transparent opacity={0.1} depthWrite={false} />

      {families.map((family) => (
        <Instance
          key={`family-plate-${family.id}`}
          position={[family.position[0], 0.01, family.position[2]]}
          rotation={[-Math.PI / 2, 0, 0]}
          color={SENTIMENT_COLORS[family.sentiment] || SENTIMENT_COLORS.unknown}
        />
      ))}
    </Instances>
  );
}

// ============================================================================
// Family Detail Card (with members list)
// ============================================================================

interface FamilyDetailCardProps {
  family: Family3DData | null;
  isSelected: boolean;
}

export function FamilyDetailCard3D({
  family,
  isSelected,
}: FamilyDetailCardProps) {
  if (!family) return null;

  const height = Math.max(0.4, Math.min(3, 0.4 + family.voterCount * 0.25));

  return (
    <Html
      position={[
        family.position[0],
        family.position[1] + height + 1,
        family.position[2],
      ]}
      center
      distanceFactor={8}
      zIndexRange={[100, 0]}
      style={{ pointerEvents: isSelected ? "auto" : "none" }}
    >
      <div
        className="bg-card/98 backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden min-w-[240px] max-w-[320px]"
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-2.5 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="font-bold text-white text-base">
              House {family.houseNo}
            </div>
            <div
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase"
              style={{
                backgroundColor: SENTIMENT_HEX[family.sentiment] + "20",
                color: SENTIMENT_HEX[family.sentiment],
              }}
            >
              {family.sentiment}
            </div>
          </div>
          {family.headOfFamily && (
            <div className="text-xs text-slate-300 mt-0.5">
              Head: {family.headOfFamily}
            </div>
          )}
        </div>

        {/* Stats Row */}
        <div className="px-4 py-2 bg-muted/30 grid grid-cols-3 gap-2 text-center border-b border-border/30">
          <div>
            <div className="text-lg font-bold text-foreground">
              {family.voterCount}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              Members
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-600">
              {family.supportCount}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              Support
            </div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-600">
              {family.opposeCount}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase">
              Oppose
            </div>
          </div>
        </div>

        {/* Members List */}
        {family.members && family.members.length > 0 && (
          <div className="px-3 py-2">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1.5">
              Family Members ({family.members.length})
            </div>
            <div
              className="max-h-[180px] overflow-y-auto space-y-0.5 scrollbar-thin"
              onWheel={(e) => e.stopPropagation()}
            >
              {family.members.map((member, idx) => (
                <div
                  key={member.voter_id || idx}
                  className={`flex items-center justify-between text-xs py-1.5 px-2 rounded ${
                    idx % 2 === 0 ? "bg-muted/30" : "bg-transparent"
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden flex-1">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 ring-1 ring-white/20"
                      style={{
                        backgroundColor:
                          SENTIMENT_HEX[member.sentiment || "unknown"],
                      }}
                    />
                    <span className="truncate font-medium text-foreground">
                      {member.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 ml-2 text-[11px]">
                    <span
                      className={
                        member.gender === "Male" || member.gender === "पु"
                          ? "text-blue-500"
                          : "text-pink-500"
                      }
                    >
                      {member.gender === "Male" || member.gender === "पु"
                        ? "♂"
                        : "♀"}
                    </span>
                    <span className="font-mono">{member.age}y</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Html>
  );
}

// ============================================================================
// Family Spotlight
// ============================================================================

interface FamilySpotlightProps {
  position: [number, number, number] | null;
  sentiment: SentimentType | null;
  intensity: number;
}

export function FamilySpotlight({
  position,
  sentiment,
  intensity,
}: FamilySpotlightProps) {
  if (!position || !sentiment || intensity === 0) return null;

  const color = SENTIMENT_COLORS[sentiment] || SENTIMENT_COLORS.unknown;

  return (
    <>
      <pointLight
        position={[position[0], position[1] + 5, position[2]]}
        intensity={intensity}
        distance={8}
        color={color}
        decay={2}
      />
      {/* Ground glow ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[position[0], 0.02, position[2]]}
      >
        <ringGeometry args={[0.4, 1, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={intensity > 2 ? 0.6 : 0.4}
        />
      </mesh>
    </>
  );
}

// ============================================================================
// Complete Instanced Family Scene
// ============================================================================

interface InstancedFamilySceneProps {
  families: Family3DData[];
  selectedFamily: string | null;
  hoveredFamily: string | null;
  onSelectFamily: (familyId: string | null) => void;
  onHoverFamily: (familyId: string | null) => void;
  showLabels?: boolean;
}

export function InstancedFamilyScene({
  families,
  selectedFamily,
  hoveredFamily,
  onSelectFamily,
  onHoverFamily,
  showLabels = true,
}: InstancedFamilySceneProps) {
  const selectedFamilyData = useMemo(
    () => families.find((f) => f.id === selectedFamily) || null,
    [families, selectedFamily]
  );

  const hoveredFamilyData = useMemo(
    () => families.find((f) => f.id === hoveredFamily) || null,
    [families, hoveredFamily]
  );

  const activeFamily = selectedFamilyData || hoveredFamilyData;

  return (
    <>
      <FamilyBasePlates families={families} />
      <FamilyInstances
        families={families}
        selectedFamily={selectedFamily}
        hoveredFamily={hoveredFamily}
        onSelectFamily={onSelectFamily}
        onHoverFamily={onHoverFamily}
      />
      <FamilyLabels
        families={families}
        selectedFamily={selectedFamily}
        hoveredFamily={hoveredFamily}
        showLabels={showLabels}
      />
      <FamilySpotlight
        position={selectedFamilyData?.position || null}
        sentiment={selectedFamilyData?.sentiment || null}
        intensity={selectedFamily ? 3 : 0}
      />
      <FamilySpotlight
        position={hoveredFamilyData?.position || null}
        sentiment={hoveredFamilyData?.sentiment || null}
        intensity={hoveredFamily && !selectedFamily ? 2 : 0}
      />
      <FamilyDetailCard3D family={activeFamily} isSelected={!!selectedFamily} />
    </>
  );
}

// Export geometries for cleanup
export { FAMILY_GEOMETRY, FAMILY_BASE_GEOMETRY };
