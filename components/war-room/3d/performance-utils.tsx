"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ============================================================================
// Performance Monitoring Hook
// ============================================================================

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memory: number;
}

interface UsePerformanceMonitorOptions {
  /** FPS threshold below which to trigger quality reduction */
  fpsThreshold?: number;
  /** Number of consecutive low-FPS frames before triggering */
  lowFpsFrameThreshold?: number;
  /** Callback when performance drops */
  onPerformanceDrop?: () => void;
  /** Enable debug logging */
  debug?: boolean;
}

/**
 * Hook to monitor WebGL performance metrics
 */
export function usePerformanceMonitor(
  options: UsePerformanceMonitorOptions = {}
) {
  const {
    fpsThreshold = 30,
    lowFpsFrameThreshold = 60, // ~1 second at 60fps
    onPerformanceDrop,
    debug = false,
  } = options;

  const { gl } = useThree();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const lowFpsCount = useRef(0);
  const fpsHistory = useRef<number[]>([]);

  useFrame(() => {
    frameCount.current++;
    const currentTime = performance.now();
    const elapsed = currentTime - lastTime.current;

    // Update every 500ms
    if (elapsed >= 500) {
      const fps = Math.round((frameCount.current * 1000) / elapsed);
      const frameTime = elapsed / frameCount.current;

      // Get renderer info
      const info = gl.info;
      const drawCalls = info.render.calls;
      const triangles = info.render.triangles;
      const memory = info.memory.geometries + info.memory.textures || 0;

      const newMetrics: PerformanceMetrics = {
        fps,
        frameTime,
        drawCalls,
        triangles,
        memory,
      };

      setMetrics(newMetrics);

      // Track FPS history (last 10 readings)
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift();
      }

      // Debug logging
      if (debug) {
        console.log(
          `[3D Perf] FPS: ${fps} | Frame: ${frameTime.toFixed(2)}ms | ` +
            `Draws: ${drawCalls} | Tris: ${triangles.toLocaleString()} | ` +
            `Mem: ${memory}`
        );
      }

      // Check for sustained low FPS
      if (fps < fpsThreshold) {
        lowFpsCount.current++;
        if (lowFpsCount.current >= lowFpsFrameThreshold / 30) {
          // Adjusted for 500ms intervals
          onPerformanceDrop?.();
          lowFpsCount.current = 0;
        }
      } else {
        lowFpsCount.current = Math.max(0, lowFpsCount.current - 1);
      }

      // Reset counters
      frameCount.current = 0;
      lastTime.current = currentTime;

      // Reset renderer info
      gl.info.reset();
    }
  });

  return {
    metrics,
    averageFps:
      fpsHistory.current.length > 0
        ? Math.round(
            fpsHistory.current.reduce((a, b) => a + b, 0) /
              fpsHistory.current.length
          )
        : 60,
  };
}

// ============================================================================
// Adaptive Quality Hook
// ============================================================================

export type QualityLevel = "high" | "medium" | "low" | "ultra-low";

interface QualitySettings {
  shadows: boolean;
  shadowMapSize: number;
  dpr: [number, number];
  antialias: boolean;
  postProcessing: boolean;
  maxInstances: number;
  lodBias: number;
}

const QUALITY_PRESETS: Record<QualityLevel, QualitySettings> = {
  high: {
    shadows: true,
    shadowMapSize: 1024,
    dpr: [1, 1.5],
    antialias: true,
    postProcessing: true,
    maxInstances: 2000,
    lodBias: 0,
  },
  medium: {
    shadows: true,
    shadowMapSize: 512,
    dpr: [1, 1.25],
    antialias: true,
    postProcessing: false,
    maxInstances: 1000,
    lodBias: 1,
  },
  low: {
    shadows: false,
    shadowMapSize: 256,
    dpr: [1, 1],
    antialias: false,
    postProcessing: false,
    maxInstances: 500,
    lodBias: 2,
  },
  "ultra-low": {
    shadows: false,
    shadowMapSize: 0,
    dpr: [0.75, 0.75],
    antialias: false,
    postProcessing: false,
    maxInstances: 200,
    lodBias: 3,
  },
};

/**
 * Hook to manage adaptive quality based on device and performance
 */
export function useAdaptiveQuality() {
  const [quality, setQuality] = useState<QualityLevel>("high");
  const [settings, setSettings] = useState<QualitySettings>(
    QUALITY_PRESETS.high
  );
  const [deviceClass, setDeviceClass] = useState<
    "desktop" | "mobile" | "unknown"
  >("unknown");

  // Detect device capabilities on mount
  useEffect(() => {
    const detectCapabilities = () => {
      // Mobile detection
      const isMobile = /Mobile|Android|iPhone|iPad|iPod/i.test(
        navigator.userAgent
      );
      setDeviceClass(isMobile ? "mobile" : "desktop");

      // Try to detect GPU
      const canvas = document.createElement("canvas");
      const gl =
        canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

      if (!gl) {
        setQuality("ultra-low");
        return;
      }

      const webgl = gl as WebGLRenderingContext;
      const debugInfo = webgl.getExtension("WEBGL_debug_renderer_info");
      const renderer = debugInfo
        ? webgl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
        : "";

      // GPU tier detection
      const isIntegrated = /Intel|Mali|Adreno|PowerVR|Apple GPU/i.test(
        renderer
      );
      const isHighEnd = /NVIDIA|AMD|Radeon|GeForce RTX|Radeon RX/i.test(
        renderer
      );

      if (isMobile) {
        setQuality(isHighEnd ? "medium" : "low");
      } else if (isIntegrated) {
        setQuality("medium");
      } else if (isHighEnd) {
        setQuality("high");
      } else {
        setQuality("medium"); // Default fallback
      }
    };

    detectCapabilities();
  }, []);

  // Update settings when quality changes
  useEffect(() => {
    setSettings(QUALITY_PRESETS[quality]);
  }, [quality]);

  // Method to manually reduce quality
  const reduceQuality = useCallback(() => {
    setQuality((current) => {
      switch (current) {
        case "high":
          return "medium";
        case "medium":
          return "low";
        case "low":
          return "ultra-low";
        default:
          return current;
      }
    });
  }, []);

  // Method to manually increase quality
  const increaseQuality = useCallback(() => {
    setQuality((current) => {
      switch (current) {
        case "ultra-low":
          return "low";
        case "low":
          return "medium";
        case "medium":
          return "high";
        default:
          return current;
      }
    });
  }, []);

  return {
    quality,
    settings,
    deviceClass,
    setQuality,
    reduceQuality,
    increaseQuality,
  };
}

// ============================================================================
// Frustum Culling Hook
// ============================================================================

/**
 * Hook to check if objects are within camera frustum
 */
export function useFrustumCulling() {
  const { camera } = useThree();
  const frustum = useRef(new THREE.Frustum());
  const projScreenMatrix = useRef(new THREE.Matrix4());

  const updateFrustum = useCallback(() => {
    projScreenMatrix.current.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.current.setFromProjectionMatrix(projScreenMatrix.current);
  }, [camera]);

  const isInFrustum = useCallback(
    (position: THREE.Vector3 | [number, number, number]) => {
      const vec = Array.isArray(position)
        ? new THREE.Vector3(...position)
        : position;
      return frustum.current.containsPoint(vec);
    },
    []
  );

  const isBoxInFrustum = useCallback((box: THREE.Box3) => {
    return frustum.current.intersectsBox(box);
  }, []);

  return {
    updateFrustum,
    isInFrustum,
    isBoxInFrustum,
  };
}

// ============================================================================
// Geometry Pool (for reuse)
// ============================================================================

type GeometryType =
  | "wardCylinder"
  | "boothCylinder"
  | "familyBox"
  | "basePlate"
  | "ring";

class GeometryPool {
  private static instance: GeometryPool;
  private geometries: Map<GeometryType, THREE.BufferGeometry> = new Map();

  static getInstance(): GeometryPool {
    if (!GeometryPool.instance) {
      GeometryPool.instance = new GeometryPool();
    }
    return GeometryPool.instance;
  }

  get(type: GeometryType): THREE.BufferGeometry {
    if (!this.geometries.has(type)) {
      this.geometries.set(type, this.createGeometry(type));
    }
    return this.geometries.get(type)!;
  }

  private createGeometry(type: GeometryType): THREE.BufferGeometry {
    switch (type) {
      case "wardCylinder":
        return new THREE.CylinderGeometry(0.8, 0.8, 1, 6, 1);
      case "boothCylinder":
        return new THREE.CylinderGeometry(0.6, 0.6, 1, 8, 1);
      case "familyBox":
        return new THREE.BoxGeometry(0.5, 1, 0.5);
      case "basePlate":
        return new THREE.CircleGeometry(2.5, 16);
      case "ring":
        return new THREE.RingGeometry(1.2, 1.4, 16);
      default:
        throw new Error(`Unknown geometry type: ${type}`);
    }
  }

  dispose(): void {
    this.geometries.forEach((geometry) => geometry.dispose());
    this.geometries.clear();
  }
}

export const geometryPool = GeometryPool.getInstance();

// ============================================================================
// Material Cache (for reuse)
// ============================================================================

type SentimentType = "support" | "oppose" | "swing" | "unknown" | "neutral";

const SENTIMENT_COLORS: Record<SentimentType, number> = {
  support: 0x22c55e,
  oppose: 0xef4444,
  swing: 0xf59e0b,
  unknown: 0x6b7280,
  neutral: 0x06b6d4,
};

const SENTIMENT_EMISSIVE: Record<SentimentType, number> = {
  support: 0x166534,
  oppose: 0x991b1b,
  swing: 0xb45309,
  unknown: 0x374151,
  neutral: 0x0e7490,
};

class MaterialCache {
  private static instance: MaterialCache;
  private materials: Map<string, THREE.Material> = new Map();

  static getInstance(): MaterialCache {
    if (!MaterialCache.instance) {
      MaterialCache.instance = new MaterialCache();
    }
    return MaterialCache.instance;
  }

  getWardMaterial(
    sentiment: SentimentType,
    state: "normal" | "hovered" | "selected" | "dimmed"
  ): THREE.MeshStandardMaterial {
    const key = `ward-${sentiment}-${state}`;

    if (!this.materials.has(key)) {
      const color = SENTIMENT_COLORS[sentiment];
      const emissive = SENTIMENT_EMISSIVE[sentiment];

      const material = new THREE.MeshStandardMaterial({
        color: state === "dimmed" ? 0x4a5568 : color,
        emissive:
          state === "selected" || state === "hovered" ? emissive : 0x000000,
        emissiveIntensity:
          state === "selected" ? 0.8 : state === "hovered" ? 0.5 : 0.2,
        metalness: 0.2,
        roughness: 0.3,
        transparent: true,
        opacity: state === "dimmed" ? 0.3 : 0.85,
      });

      this.materials.set(key, material);
    }

    return this.materials.get(key) as THREE.MeshStandardMaterial;
  }

  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();
  }
}

export const materialCache = MaterialCache.getInstance();

// ============================================================================
// Performance Stats Component (Development Only)
// ============================================================================

interface PerformanceStatsProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function PerformanceStats({
  position = "top-left",
}: PerformanceStatsProps) {
  const { metrics, averageFps } = usePerformanceMonitor({ debug: false });

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-left": { top: 8, left: 8 },
    "top-right": { top: 8, right: 8 },
    "bottom-left": { bottom: 8, left: 8 },
    "bottom-right": { bottom: 8, right: 8 },
  };

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        ...positionStyles[position],
        background: "rgba(0, 0, 0, 0.8)",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: 6,
        fontSize: 11,
        fontFamily: "monospace",
        zIndex: 1000,
        lineHeight: 1.5,
      }}
    >
      <div
        style={{
          color:
            metrics.fps < 30
              ? "#ef4444"
              : metrics.fps < 50
              ? "#f59e0b"
              : "#22c55e",
        }}
      >
        FPS: {metrics.fps} (avg: {averageFps})
      </div>
      <div>Frame: {metrics.frameTime.toFixed(2)}ms</div>
      <div>Draw Calls: {metrics.drawCalls}</div>
      <div>Triangles: {metrics.triangles.toLocaleString()}</div>
      <div>Memory: {metrics.memory}</div>
    </div>
  );
}
