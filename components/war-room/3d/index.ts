// 3D Components - Barrel Export
// Optimized instanced rendering for voter management 3D visualization

// Main Optimized Scene (Drop-in replacement)
export {
  Optimized3DCanvas,
  default as OptimizedScene3D,
} from "./OptimizedScene3D";

// Performance Utilities
export {
  usePerformanceMonitor,
  useAdaptiveQuality,
  useFrustumCulling,
  geometryPool,
  materialCache,
  PerformanceStats,
} from "./performance-utils";
export type { QualityLevel } from "./performance-utils";

// Instanced Ward Components
export {
  WardInstances,
  WardLabels,
  WardHoverCard3D,
  WardBasePlates,
  SelectionRing,
  WardSpotlight,
  InstancedWardScene,
  WARD_GEOMETRY,
  BASE_PLATE_GEOMETRY,
} from "./instanced-wards";
export type { Ward3DData } from "./instanced-wards";

// Instanced Booth Components
export {
  BoothInstances,
  BoothLabels,
  BoothHoverCard3D,
  BoothBasePlates,
  InstancedBoothScene,
  BOOTH_GEOMETRY,
  BOOTH_CAP_GEOMETRY,
  BOOTH_BASE_GEOMETRY,
} from "./instanced-booths";
export type { Booth3DData } from "./instanced-booths";

// Instanced Family Components
export {
  FamilyInstances,
  FamilyLabels,
  FamilyBasePlates,
  FamilyDetailCard3D,
  FamilySpotlight,
  InstancedFamilyScene,
  FAMILY_GEOMETRY,
  FAMILY_BASE_GEOMETRY,
} from "./instanced-families";
export type { Family3DData, FamilyMember } from "./instanced-families";

// Materials & Geometry Factories
export {
  SENTIMENT_COLORS,
  SENTIMENT_THREE_COLORS,
  HIGHLIGHT_COLORS,
  MaterialPresets,
  materialFactory,
  useWardMaterials,
  useBoothMaterials,
  useFamilyMaterials,
  geometryFactory,
  StandardGeometries,
  useStandardGeometries,
} from "./materials";
export type { SentimentType } from "./materials";

// Interactions (Keyboard, Touch, Camera Animation)
export {
  useKeyboardShortcuts,
  useTouchGestures,
  useCameraAnimation,
  useFocusManagement,
  Easings,
} from "./interactions";
export type { KeyboardShortcuts, TouchGestures } from "./interactions";

// LOD System (Level of Detail)
export {
  calculateLODLevel,
  useLOD,
  useBatchedLOD,
  createWardLODGeometries,
  createBoothLODGeometries,
  createFamilyLODGeometries,
  lodGeometryPool,
  LODInstancedMesh,
  isInFrustum,
  useFrustum,
  calculateDistanceOpacity,
} from "./lod-system";
export type { LODLevel } from "./lod-system";
