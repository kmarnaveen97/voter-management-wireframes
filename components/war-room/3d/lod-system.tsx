"use client";

import React, { useRef, useMemo, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ============================================================================
// LOD (Level of Detail) System
// ============================================================================

export type LODLevel = "high" | "medium" | "low" | "billboard";

interface LODThresholds {
  high: number; // Distance for high detail
  medium: number; // Distance for medium detail
  low: number; // Distance for low detail
  // Beyond low = billboard or hide
}

const DEFAULT_THRESHOLDS: LODThresholds = {
  high: 15,
  medium: 35,
  low: 70,
};

/**
 * Calculate LOD level based on distance from camera
 */
export function calculateLODLevel(
  distance: number,
  thresholds: LODThresholds = DEFAULT_THRESHOLDS
): LODLevel {
  if (distance < thresholds.high) return "high";
  if (distance < thresholds.medium) return "medium";
  if (distance < thresholds.low) return "low";
  return "billboard";
}

/**
 * Hook to track camera distance and determine LOD level
 */
export function useLOD(
  position: THREE.Vector3 | [number, number, number],
  thresholds: LODThresholds = DEFAULT_THRESHOLDS
) {
  const { camera } = useThree();
  const [lodLevel, setLodLevel] = React.useState<LODLevel>("high");
  const posVec = useMemo(
    () => (Array.isArray(position) ? new THREE.Vector3(...position) : position),
    [position]
  );

  useFrame(() => {
    const distance = camera.position.distanceTo(posVec);
    const newLevel = calculateLODLevel(distance, thresholds);
    if (newLevel !== lodLevel) {
      setLodLevel(newLevel);
    }
  });

  return lodLevel;
}

// ============================================================================
// Batched LOD Calculator for Many Objects
// ============================================================================

interface LODBatch {
  ids: string[];
  positions: THREE.Vector3[];
  levels: Map<string, LODLevel>;
}

/**
 * Hook to calculate LOD levels for many objects efficiently
 * Updates in batches to avoid per-frame allocations
 */
export function useBatchedLOD(
  objects: Array<{ id: string; position: [number, number, number] }>,
  thresholds: LODThresholds = DEFAULT_THRESHOLDS,
  updateInterval: number = 100 // ms between LOD recalculations
) {
  const { camera } = useThree();
  const [levels, setLevels] = React.useState<Map<string, LODLevel>>(new Map());
  const lastUpdate = useRef(0);
  const positionsRef = useRef<THREE.Vector3[]>([]);

  // Pre-compute position vectors
  useMemo(() => {
    positionsRef.current = objects.map(
      (obj) => new THREE.Vector3(...obj.position)
    );
  }, [objects]);

  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdate.current < updateInterval) return;
    lastUpdate.current = now;

    const newLevels = new Map<string, LODLevel>();
    let hasChanges = false;

    objects.forEach((obj, i) => {
      const pos = positionsRef.current[i];
      if (!pos) return;

      const distance = camera.position.distanceTo(pos);
      const level = calculateLODLevel(distance, thresholds);
      newLevels.set(obj.id, level);

      if (levels.get(obj.id) !== level) {
        hasChanges = true;
      }
    });

    if (hasChanges) {
      setLevels(newLevels);
    }
  });

  return levels;
}

// ============================================================================
// LOD Geometry Variants
// ============================================================================

interface LODGeometrySet {
  high: THREE.BufferGeometry;
  medium: THREE.BufferGeometry;
  low: THREE.BufferGeometry;
  billboard: THREE.BufferGeometry;
}

/**
 * Create LOD geometry variants for ward buildings
 */
export function createWardLODGeometries(): LODGeometrySet {
  return {
    high: new THREE.BoxGeometry(1, 1, 1, 4, 4, 4), // 384 triangles
    medium: new THREE.BoxGeometry(1, 1, 1, 2, 2, 2), // 96 triangles
    low: new THREE.BoxGeometry(1, 1, 1, 1, 1, 1), // 12 triangles
    billboard: new THREE.PlaneGeometry(1, 1), // 2 triangles
  };
}

/**
 * Create LOD geometry variants for booth cylinders
 */
export function createBoothLODGeometries(): LODGeometrySet {
  return {
    high: new THREE.CylinderGeometry(0.5, 0.5, 1, 16, 4), // ~256 triangles
    medium: new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 2), // ~64 triangles
    low: new THREE.CylinderGeometry(0.5, 0.5, 1, 6, 1), // ~24 triangles
    billboard: new THREE.PlaneGeometry(1, 1), // 2 triangles
  };
}

/**
 * Create LOD geometry variants for family houses
 */
export function createFamilyLODGeometries(): LODGeometrySet {
  return {
    high: new THREE.BoxGeometry(0.8, 0.6, 0.8, 2, 2, 2), // 96 triangles
    medium: new THREE.BoxGeometry(0.8, 0.6, 0.8, 1, 1, 1), // 12 triangles
    low: new THREE.BoxGeometry(0.8, 0.6, 0.8, 1, 1, 1), // 12 triangles
    billboard: new THREE.PlaneGeometry(0.8, 0.6), // 2 triangles
  };
}

// ============================================================================
// LOD Geometry Pool (Singleton)
// ============================================================================

class LODGeometryPool {
  private static instance: LODGeometryPool;
  private wardGeometries: LODGeometrySet | null = null;
  private boothGeometries: LODGeometrySet | null = null;
  private familyGeometries: LODGeometrySet | null = null;

  private constructor() {}

  static getInstance(): LODGeometryPool {
    if (!LODGeometryPool.instance) {
      LODGeometryPool.instance = new LODGeometryPool();
    }
    return LODGeometryPool.instance;
  }

  getWardGeometries(): LODGeometrySet {
    if (!this.wardGeometries) {
      this.wardGeometries = createWardLODGeometries();
    }
    return this.wardGeometries;
  }

  getBoothGeometries(): LODGeometrySet {
    if (!this.boothGeometries) {
      this.boothGeometries = createBoothLODGeometries();
    }
    return this.boothGeometries;
  }

  getFamilyGeometries(): LODGeometrySet {
    if (!this.familyGeometries) {
      this.familyGeometries = createFamilyLODGeometries();
    }
    return this.familyGeometries;
  }

  dispose(): void {
    const disposeSet = (set: LODGeometrySet | null) => {
      if (!set) return;
      set.high.dispose();
      set.medium.dispose();
      set.low.dispose();
      set.billboard.dispose();
    };

    disposeSet(this.wardGeometries);
    disposeSet(this.boothGeometries);
    disposeSet(this.familyGeometries);

    this.wardGeometries = null;
    this.boothGeometries = null;
    this.familyGeometries = null;
  }
}

export const lodGeometryPool = LODGeometryPool.getInstance();

// ============================================================================
// LOD-Aware Instanced Mesh Component
// ============================================================================

interface LODInstancedMeshProps {
  objects: Array<{
    id: string;
    position: [number, number, number];
    scale?: [number, number, number];
    color?: THREE.Color | string;
  }>;
  geometries: LODGeometrySet;
  material: THREE.Material;
  thresholds?: LODThresholds;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

/**
 * LOD-aware instanced mesh that switches geometry based on camera distance
 *
 * Note: For true LOD with instancing, we split instances into separate
 * InstancedMesh per LOD level to avoid geometry switching overhead.
 */
export function LODInstancedMesh({
  objects,
  geometries,
  material,
  thresholds = DEFAULT_THRESHOLDS,
  castShadow = true,
  receiveShadow = true,
}: LODInstancedMeshProps) {
  const { camera } = useThree();

  // Group objects by LOD level
  const [groupedByLOD, setGroupedByLOD] = React.useState<{
    high: typeof objects;
    medium: typeof objects;
    low: typeof objects;
    billboard: typeof objects;
  }>({
    high: objects,
    medium: [],
    low: [],
    billboard: [],
  });

  const lastUpdate = useRef(0);
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempPosition = useMemo(() => new THREE.Vector3(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);

  // Refs for instanced meshes
  const highRef = useRef<THREE.InstancedMesh>(null);
  const mediumRef = useRef<THREE.InstancedMesh>(null);
  const lowRef = useRef<THREE.InstancedMesh>(null);

  // Update LOD grouping periodically
  useFrame(() => {
    const now = performance.now();
    if (now - lastUpdate.current < 100) return; // Update every 100ms
    lastUpdate.current = now;

    const high: typeof objects = [];
    const medium: typeof objects = [];
    const low: typeof objects = [];
    const billboard: typeof objects = [];

    objects.forEach((obj) => {
      const distance = camera.position.distanceTo(
        tempPosition.set(...obj.position)
      );
      const level = calculateLODLevel(distance, thresholds);

      switch (level) {
        case "high":
          high.push(obj);
          break;
        case "medium":
          medium.push(obj);
          break;
        case "low":
          low.push(obj);
          break;
        case "billboard":
          billboard.push(obj);
          break;
      }
    });

    // Only update if grouping changed
    if (
      high.length !== groupedByLOD.high.length ||
      medium.length !== groupedByLOD.medium.length ||
      low.length !== groupedByLOD.low.length
    ) {
      setGroupedByLOD({ high, medium, low, billboard });
    }
  });

  // Update instance matrices when grouping changes
  React.useEffect(() => {
    const updateMesh = (
      mesh: THREE.InstancedMesh | null,
      items: typeof objects
    ) => {
      if (!mesh) return;

      items.forEach((obj, i) => {
        tempPosition.set(...obj.position);
        tempScale.set(...(obj.scale || [1, 1, 1]));
        tempMatrix.compose(tempPosition, tempQuaternion, tempScale);
        mesh.setMatrixAt(i, tempMatrix);

        if (obj.color && mesh.instanceColor) {
          const color =
            obj.color instanceof THREE.Color
              ? obj.color
              : new THREE.Color(obj.color);
          mesh.setColorAt(i, color);
        }
      });

      mesh.count = items.length;
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
    };

    updateMesh(highRef.current, groupedByLOD.high);
    updateMesh(mediumRef.current, groupedByLOD.medium);
    updateMesh(lowRef.current, groupedByLOD.low);
  }, [groupedByLOD, tempMatrix, tempPosition, tempScale, tempQuaternion]);

  const maxCount = objects.length;

  return (
    <group>
      {/* High detail instances */}
      {groupedByLOD.high.length > 0 && (
        <instancedMesh
          ref={highRef}
          args={[geometries.high, material, maxCount]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          frustumCulled={true}
        />
      )}

      {/* Medium detail instances */}
      {groupedByLOD.medium.length > 0 && (
        <instancedMesh
          ref={mediumRef}
          args={[geometries.medium, material, maxCount]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
          frustumCulled={true}
        />
      )}

      {/* Low detail instances */}
      {groupedByLOD.low.length > 0 && (
        <instancedMesh
          ref={lowRef}
          args={[geometries.low, material, maxCount]}
          castShadow={false}
          receiveShadow={receiveShadow}
          frustumCulled={true}
        />
      )}

      {/* Billboard instances would use a different approach (sprites) */}
    </group>
  );
}

// ============================================================================
// Visibility Culling Helpers
// ============================================================================

/**
 * Check if a point is within camera frustum
 */
export function isInFrustum(
  point: THREE.Vector3,
  camera: THREE.Camera,
  frustum?: THREE.Frustum
): boolean {
  if (!frustum) {
    frustum = new THREE.Frustum();
    const projScreenMatrix = new THREE.Matrix4();
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);
  }
  return frustum.containsPoint(point);
}

/**
 * Hook to create and maintain frustum for culling
 */
export function useFrustum() {
  const { camera } = useThree();
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projMatrix = useMemo(() => new THREE.Matrix4(), []);

  const updateFrustum = useCallback(() => {
    projMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projMatrix);
    return frustum;
  }, [camera, frustum, projMatrix]);

  return { frustum, updateFrustum };
}

// ============================================================================
// Distance-Based Opacity
// ============================================================================

/**
 * Calculate opacity based on distance (for fade-out effect)
 */
export function calculateDistanceOpacity(
  distance: number,
  fadeStart: number = 60,
  fadeEnd: number = 100
): number {
  if (distance <= fadeStart) return 1;
  if (distance >= fadeEnd) return 0;
  return 1 - (distance - fadeStart) / (fadeEnd - fadeStart);
}
