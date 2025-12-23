"use client";

import * as THREE from "three";
import { useMemo } from "react";

// ============================================================================
// Sentiment Color Constants
// ============================================================================

export const SENTIMENT_COLORS = {
  support: "#22c55e",
  oppose: "#ef4444",
  swing: "#f59e0b",
  unknown: "#6b7280",
  neutral: "#06b6d4",
} as const;

export type SentimentType = keyof typeof SENTIMENT_COLORS;

// ============================================================================
// Pre-built THREE.Color instances (avoid runtime allocations)
// ============================================================================

export const SENTIMENT_THREE_COLORS: Record<SentimentType, THREE.Color> = {
  support: new THREE.Color(SENTIMENT_COLORS.support),
  oppose: new THREE.Color(SENTIMENT_COLORS.oppose),
  swing: new THREE.Color(SENTIMENT_COLORS.swing),
  unknown: new THREE.Color(SENTIMENT_COLORS.unknown),
  neutral: new THREE.Color(SENTIMENT_COLORS.neutral),
};

// Selection/hover colors
export const HIGHLIGHT_COLORS = {
  selection: new THREE.Color("#3b82f6"),
  hover: new THREE.Color("#60a5fa"),
  active: new THREE.Color("#2563eb"),
  white: new THREE.Color("#ffffff"),
  black: new THREE.Color("#000000"),
  ground: new THREE.Color("#1e293b"),
  grid: new THREE.Color("#334155"),
  gridSecondary: new THREE.Color("#1e293b"),
  fog: new THREE.Color("#0f172a"),
} as const;

// ============================================================================
// Shared Material Definitions
// ============================================================================

/**
 * Material presets for consistent rendering across components
 * Using MeshStandardMaterial for performance (not Physical)
 */
export const MaterialPresets = {
  // Ward building material - slightly glossy
  ward: {
    transparent: true,
    opacity: 0.85,
    roughness: 0.3,
    metalness: 0.1,
  },

  // Booth material - more matte
  booth: {
    transparent: true,
    opacity: 0.9,
    roughness: 0.5,
    metalness: 0.05,
  },

  // Family/house material - warm, matte
  family: {
    transparent: true,
    opacity: 0.9,
    roughness: 0.6,
    metalness: 0.0,
  },

  // Base plates - subtle ground indicators
  basePlate: {
    transparent: true,
    opacity: 0.3,
    roughness: 0.8,
    metalness: 0.0,
  },

  // Selection ring - glowing effect
  selection: {
    transparent: true,
    opacity: 0.8,
    roughness: 0.2,
    metalness: 0.5,
    emissive: HIGHLIGHT_COLORS.selection,
    emissiveIntensity: 0.5,
  },

  // Ground plane
  ground: {
    color: HIGHLIGHT_COLORS.ground,
    roughness: 0.8,
    metalness: 0.2,
  },

  // Glass/transparent overlay
  glass: {
    transparent: true,
    opacity: 0.2,
    roughness: 0.1,
    metalness: 0.9,
  },
} as const;

// ============================================================================
// Material Factory (Singleton Cache)
// ============================================================================

class MaterialFactory {
  private static instance: MaterialFactory;
  private cache: Map<string, THREE.Material> = new Map();

  private constructor() {}

  static getInstance(): MaterialFactory {
    if (!MaterialFactory.instance) {
      MaterialFactory.instance = new MaterialFactory();
    }
    return MaterialFactory.instance;
  }

  /**
   * Get or create a MeshStandardMaterial with the given parameters
   */
  getStandardMaterial(
    key: string,
    params: THREE.MeshStandardMaterialParameters
  ): THREE.MeshStandardMaterial {
    if (!this.cache.has(key)) {
      const material = new THREE.MeshStandardMaterial(params);
      this.cache.set(key, material);
    }
    return this.cache.get(key) as THREE.MeshStandardMaterial;
  }

  /**
   * Get sentiment-colored material for wards
   */
  getWardMaterial(sentiment: SentimentType): THREE.MeshStandardMaterial {
    const key = `ward-${sentiment}`;
    return this.getStandardMaterial(key, {
      ...MaterialPresets.ward,
      color: SENTIMENT_THREE_COLORS[sentiment],
    });
  }

  /**
   * Get sentiment-colored material for booths
   */
  getBoothMaterial(sentiment: SentimentType): THREE.MeshStandardMaterial {
    const key = `booth-${sentiment}`;
    return this.getStandardMaterial(key, {
      ...MaterialPresets.booth,
      color: SENTIMENT_THREE_COLORS[sentiment],
    });
  }

  /**
   * Get sentiment-colored material for families
   */
  getFamilyMaterial(sentiment: SentimentType): THREE.MeshStandardMaterial {
    const key = `family-${sentiment}`;
    return this.getStandardMaterial(key, {
      ...MaterialPresets.family,
      color: SENTIMENT_THREE_COLORS[sentiment],
    });
  }

  /**
   * Get base plate material
   */
  getBasePlateMaterial(sentiment: SentimentType): THREE.MeshStandardMaterial {
    const key = `basePlate-${sentiment}`;
    return this.getStandardMaterial(key, {
      ...MaterialPresets.basePlate,
      color: SENTIMENT_THREE_COLORS[sentiment],
    });
  }

  /**
   * Get selection ring material
   */
  getSelectionMaterial(): THREE.MeshStandardMaterial {
    return this.getStandardMaterial("selection", {
      ...MaterialPresets.selection,
      color: HIGHLIGHT_COLORS.selection,
    });
  }

  /**
   * Get ground material
   */
  getGroundMaterial(): THREE.MeshStandardMaterial {
    return this.getStandardMaterial("ground", MaterialPresets.ground);
  }

  /**
   * Clear all cached materials (for cleanup)
   */
  dispose(): void {
    this.cache.forEach((material) => material.dispose());
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; keys: string[] } {
    return {
      count: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const materialFactory = MaterialFactory.getInstance();

// ============================================================================
// React Hooks for Materials
// ============================================================================

/**
 * Hook to get memoized ward materials for instanced rendering
 */
export function useWardMaterials() {
  return useMemo(
    () => ({
      support: materialFactory.getWardMaterial("support"),
      oppose: materialFactory.getWardMaterial("oppose"),
      swing: materialFactory.getWardMaterial("swing"),
      unknown: materialFactory.getWardMaterial("unknown"),
      neutral: materialFactory.getWardMaterial("neutral"),
    }),
    []
  );
}

/**
 * Hook to get memoized booth materials
 */
export function useBoothMaterials() {
  return useMemo(
    () => ({
      support: materialFactory.getBoothMaterial("support"),
      oppose: materialFactory.getBoothMaterial("oppose"),
      swing: materialFactory.getBoothMaterial("swing"),
      unknown: materialFactory.getBoothMaterial("unknown"),
      neutral: materialFactory.getBoothMaterial("neutral"),
    }),
    []
  );
}

/**
 * Hook to get memoized family materials
 */
export function useFamilyMaterials() {
  return useMemo(
    () => ({
      support: materialFactory.getFamilyMaterial("support"),
      oppose: materialFactory.getFamilyMaterial("oppose"),
      swing: materialFactory.getFamilyMaterial("swing"),
      unknown: materialFactory.getFamilyMaterial("unknown"),
      neutral: materialFactory.getFamilyMaterial("neutral"),
    }),
    []
  );
}

// ============================================================================
// Geometry Factory (Singleton Cache)
// ============================================================================

class GeometryFactory {
  private static instance: GeometryFactory;
  private cache: Map<string, THREE.BufferGeometry> = new Map();

  private constructor() {}

  static getInstance(): GeometryFactory {
    if (!GeometryFactory.instance) {
      GeometryFactory.instance = new GeometryFactory();
    }
    return GeometryFactory.instance;
  }

  /**
   * Get or create a BoxGeometry
   */
  getBox(width: number, height: number, depth: number): THREE.BoxGeometry {
    const key = `box-${width}-${height}-${depth}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.BoxGeometry(width, height, depth));
    }
    return this.cache.get(key) as THREE.BoxGeometry;
  }

  /**
   * Get or create a CylinderGeometry
   */
  getCylinder(
    radiusTop: number,
    radiusBottom: number,
    height: number,
    segments: number = 16
  ): THREE.CylinderGeometry {
    const key = `cylinder-${radiusTop}-${radiusBottom}-${height}-${segments}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments)
      );
    }
    return this.cache.get(key) as THREE.CylinderGeometry;
  }

  /**
   * Get or create a CircleGeometry (for base plates)
   */
  getCircle(radius: number, segments: number = 32): THREE.CircleGeometry {
    const key = `circle-${radius}-${segments}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.CircleGeometry(radius, segments));
    }
    return this.cache.get(key) as THREE.CircleGeometry;
  }

  /**
   * Get or create a RingGeometry (for selection rings)
   */
  getRing(
    innerRadius: number,
    outerRadius: number,
    segments: number = 32
  ): THREE.RingGeometry {
    const key = `ring-${innerRadius}-${outerRadius}-${segments}`;
    if (!this.cache.has(key)) {
      this.cache.set(
        key,
        new THREE.RingGeometry(innerRadius, outerRadius, segments)
      );
    }
    return this.cache.get(key) as THREE.RingGeometry;
  }

  /**
   * Get or create a PlaneGeometry
   */
  getPlane(width: number, height: number): THREE.PlaneGeometry {
    const key = `plane-${width}-${height}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.PlaneGeometry(width, height, 1, 1));
    }
    return this.cache.get(key) as THREE.PlaneGeometry;
  }

  /**
   * Get or create a ConeGeometry (for roofs)
   */
  getCone(
    radius: number,
    height: number,
    segments: number = 8
  ): THREE.ConeGeometry {
    const key = `cone-${radius}-${height}-${segments}`;
    if (!this.cache.has(key)) {
      this.cache.set(key, new THREE.ConeGeometry(radius, height, segments));
    }
    return this.cache.get(key) as THREE.ConeGeometry;
  }

  /**
   * Clear all cached geometries
   */
  dispose(): void {
    this.cache.forEach((geometry) => geometry.dispose());
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { count: number; keys: string[] } {
    return {
      count: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const geometryFactory = GeometryFactory.getInstance();

// ============================================================================
// Standard Geometries (Pre-computed)
// ============================================================================

export const StandardGeometries = {
  // Ward building (tall box)
  wardBuilding: () => geometryFactory.getBox(1, 1, 1),

  // Booth (cylinder)
  boothCylinder: () => geometryFactory.getCylinder(0.5, 0.5, 1, 16),

  // Family house (small box)
  familyHouse: () => geometryFactory.getBox(0.8, 0.6, 0.8),

  // Base plates
  wardBasePlate: () => geometryFactory.getCircle(1.2, 32),
  boothBasePlate: () => geometryFactory.getCircle(0.8, 24),
  familyBasePlate: () => geometryFactory.getCircle(0.6, 16),

  // Selection ring
  selectionRing: () => geometryFactory.getRing(1.3, 1.5, 32),

  // Ground plane
  ground: () => geometryFactory.getPlane(100, 100),

  // House roof
  houseRoof: () => geometryFactory.getCone(0.6, 0.4, 4),
} as const;

// ============================================================================
// React Hook for Shared Geometries
// ============================================================================

/**
 * Hook to get all standard geometries (memoized)
 */
export function useStandardGeometries() {
  return useMemo(
    () => ({
      wardBuilding: StandardGeometries.wardBuilding(),
      boothCylinder: StandardGeometries.boothCylinder(),
      familyHouse: StandardGeometries.familyHouse(),
      wardBasePlate: StandardGeometries.wardBasePlate(),
      boothBasePlate: StandardGeometries.boothBasePlate(),
      familyBasePlate: StandardGeometries.familyBasePlate(),
      selectionRing: StandardGeometries.selectionRing(),
      ground: StandardGeometries.ground(),
      houseRoof: StandardGeometries.houseRoof(),
    }),
    []
  );
}
