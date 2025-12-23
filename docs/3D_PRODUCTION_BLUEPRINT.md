# 3D War Room Production Blueprint

> **Senior Rendering Engineer Assessment**  
> Prepared: December 2024  
> Target: Production-grade 3D electoral visualization  
> Framework: React Three Fiber + Three.js

---

## Executive 3D Summary

### Current State Assessment: **6.2/10**

The existing `war-room-3d-scene.tsx` (1,102 lines) demonstrates a functional prototype but lacks production-grade optimizations. Key observations:

| Aspect | Current | Target | Gap |
|--------|---------|--------|-----|
| FPS (Desktop) | ~45 FPS | 60 FPS | -15 FPS |
| FPS (Mobile) | ~25 FPS | 30 FPS | -5 FPS |
| Bundle Size | ~280KB | <150KB | -130KB |
| Draw Calls | 50-200 | <30 | High |
| Memory | ~120MB | <80MB | -40MB |

### Critical Issues Identified

1. **No instancing** - Each ward/booth/family creates separate geometry
2. **Expensive materials** - `MeshPhysicalMaterial` with transmission on all objects
3. **Text rendering** - Troika text per object (heavy GPU cost)
4. **No LOD system** - Full detail at all distances
5. **Missing culling** - Objects render even when off-screen
6. **Shadow complexity** - 2048x2048 shadow maps for simple scene
7. **HTML overlays** - Multiple `<Html>` components in render loop

---

## 1. 3D Experience Goals

### Purpose
**Electoral Data Visualization** - Transform voter sentiment data into an immersive 3D cityscape where:
- **Wards** = Buildings (height = voter count, color = sentiment)
- **Booths** = Districts within wards
- **Families** = Individual houses within booths

### Interactivity Level
| Feature | Priority | Implementation |
|---------|----------|----------------|
| Orbit Controls | P0 | ✅ Implemented |
| Click-to-select | P0 | ✅ Implemented |
| Hover highlight | P0 | ✅ Implemented |
| Drill-down (Ward→Booth→Family) | P0 | ✅ Implemented |
| Keyboard shortcuts | P1 | 🔲 Not implemented |
| Touch gestures | P1 | 🔲 Partial |
| VR mode | P3 | 🔲 Future |

### Performance Budget

```
┌─────────────────────────────────────────────────────────────┐
│ FPS TARGET MATRIX                                          │
├─────────────────┬───────────┬───────────┬─────────────────┤
│ Device Class    │ Min FPS   │ Target FPS│ Max Objects     │
├─────────────────┼───────────┼───────────┼─────────────────┤
│ Desktop (GPU)   │ 55        │ 60        │ 2000 instances  │
│ Desktop (iGPU)  │ 45        │ 55        │ 1000 instances  │
│ Mobile High-end │ 30        │ 45        │ 500 instances   │
│ Mobile Mid-tier │ 24        │ 30        │ 200 instances   │
└─────────────────┴───────────┴───────────┴─────────────────┘
```

### Visual Goals
- **Style**: Stylized low-poly with glass/crystal aesthetic
- **Mood**: Professional, data-focused, election night broadcast quality
- **Palette**: Dark slate background with vivid sentiment colors

---

## 2. Scene Architecture Plan

### Current Scene Graph (Problematic)
```
Canvas
└── Scene3D
    ├── Environment (HDRI)
    ├── Lights (4 separate)
    ├── Ground
    ├── GridHelper
    ├── WardBuilding × N (each with 8+ meshes)
    │   ├── Base plate (CircleGeometry)
    │   ├── Cylinder (CylinderGeometry)
    │   ├── Donut Group
    │   │   ├── Torus (progress)
    │   │   └── Torus (background)
    │   ├── Arrow Group (if swing)
    │   ├── PointLight (if selected)
    │   ├── Flag Group
    │   │   ├── Pole (CylinderGeometry)
    │   │   ├── Board (BoxGeometry)
    │   │   └── Text × 2
    │   ├── Html (hover card)
    │   └── Ring (if selected)
    ├── BoothBuilding × N
    └── FamilyBuilding × N
```

### Optimized Scene Graph (Proposed)
```
Canvas
└── Scene3D
    ├── EnvironmentMap (compressed KTX2)
    ├── LightRig (single unified component)
    │   ├── AmbientLight
    │   └── DirectionalLight (CSM)
    ├── Ground (single mesh)
    ├── InstancedMeshes
    │   ├── WardInstances (single InstancedMesh)
    │   ├── BoothInstances (single InstancedMesh)
    │   └── FamilyInstances (single InstancedMesh)
    ├── SelectionOverlays (rendered only for active)
    ├── Labels (Billboard sprites or SDF text atlas)
    └── SingleHtmlOverlay (portal-based)
```

### Camera Strategy

```typescript
// Recommended camera configuration
const CAMERA_CONFIG = {
  perspective: {
    fov: 50,
    near: 0.1,
    far: 500,
    position: [15, 15, 15] as const,
  },
  constraints: {
    minDistance: 2,
    maxDistance: 200,
    minPolarAngle: 0.1,
    maxPolarAngle: Math.PI / 2 - 0.05, // Prevent ground clipping
    enableDamping: true,
    dampingFactor: 0.05,
  },
  transitions: {
    duration: 1.2, // seconds
    easing: 'easeInOutCubic',
  },
};
```

### Renderer Configuration

```typescript
// Production renderer settings
const RENDERER_CONFIG: Partial<THREE.WebGLRendererParameters> = {
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
  stencil: false,
  depth: true,
};

// Canvas props
<Canvas
  shadows="soft" // or false on mobile
  dpr={[1, 1.5]} // Reduced from [1, 2]
  performance={{ min: 0.5, max: 1, debounce: 200 }}
  gl={RENDERER_CONFIG}
  camera={CAMERA_CONFIG.perspective}
  frameloop="demand" // Only render when needed
>
```

---

## 3. Asset Pipeline

### Current Asset Issues
- No compression
- Inline geometry creation (CPU bound)
- Font loaded per Text component
- No texture optimization

### Optimized Asset Strategy

```
/public/3d/
├── models/
│   ├── ward-building.glb      # Draco compressed (~5KB)
│   ├── booth-building.glb     # Draco compressed (~3KB)
│   └── family-house.glb       # Draco compressed (~2KB)
├── textures/
│   ├── env/
│   │   └── city.ktx2          # Compressed HDRI (~200KB)
│   ├── materials/
│   │   ├── glass-normal.ktx2
│   │   └── concrete-ao.ktx2
│   └── sprites/
│       └── labels-atlas.png   # SDF text atlas
├── fonts/
│   └── inter-msdf.json        # MSDF font atlas
└── shaders/
    ├── building.vert
    ├── building.frag
    └── selection-glow.frag
```

### Geometry Strategy

```typescript
// Pre-computed geometries (created once, reused via instancing)
const GEOMETRIES = {
  ward: new THREE.CylinderGeometry(0.8, 0.8, 1, 6), // Hexagonal
  booth: new THREE.CylinderGeometry(0.6, 0.6, 1, 8),
  family: new THREE.BoxGeometry(0.5, 1, 0.5),
  basePlate: new THREE.CircleGeometry(2.5, 16), // Reduced segments
  selectionRing: new THREE.RingGeometry(1.2, 1.4, 16),
};

// Dispose on unmount
useEffect(() => {
  return () => {
    Object.values(GEOMETRIES).forEach(g => g.dispose());
  };
}, []);
```

---

## 4. Visual Rendering Strategy

### Material Library

```typescript
// Shared materials (created once)
const MATERIALS = {
  // Ward buildings - simplified from MeshPhysicalMaterial
  ward: {
    support: new THREE.MeshStandardMaterial({
      color: 0x22c55e,
      emissive: 0x166534,
      emissiveIntensity: 0.3,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9,
    }),
    oppose: new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.3,
      metalness: 0.2,
      roughness: 0.3,
      transparent: true,
      opacity: 0.9,
    }),
    // ... other sentiments
  },
  
  // Ground
  ground: new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.8,
    metalness: 0.2,
  }),
  
  // Selection glow (custom shader)
  selectionGlow: new THREE.ShaderMaterial({
    // Custom pulse shader
  }),
};
```

### Lighting Rig

```typescript
// Optimized 3-point + ambient setup
function LightRig() {
  return (
    <>
      {/* Key light - main directional with shadows */}
      <directionalLight
        position={[10, 20, 10]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[1024, 1024]} // Reduced from 2048
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
        shadow-bias={-0.0001}
      />
      
      {/* Fill light - no shadows */}
      <directionalLight
        position={[-5, 10, -5]}
        intensity={0.3}
        color="#60a5fa"
      />
      
      {/* Ambient - base illumination */}
      <ambientLight intensity={0.4} />
      
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
```

### Post-Processing Stack

```typescript
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing';

function PostProcessing({ enabled = true }) {
  if (!enabled) return null;
  
  return (
    <EffectComposer multisampling={0}> {/* Disable MSAA, use SMAA */}
      <SMAA />
      <Bloom
        luminanceThreshold={0.9}
        luminanceSmoothing={0.025}
        intensity={0.5}
        radius={0.7}
      />
      <Vignette eskil={false} offset={0.1} darkness={0.5} />
    </EffectComposer>
  );
}
```

---

## 5. Interactivity + Controls Plan

### Event System Architecture

```typescript
// Centralized interaction manager
interface InteractionState {
  hoveredId: string | null;
  selectedId: string | null;
  isDragging: boolean;
  pointerPosition: THREE.Vector2;
}

// Custom hook for interactions
function useInteractionManager() {
  const [state, dispatch] = useReducer(interactionReducer, initialState);
  
  const raycaster = useMemo(() => new THREE.Raycaster(), []);
  const pointer = useMemo(() => new THREE.Vector2(), []);
  
  // Throttled raycast (16ms = 60fps max)
  const handlePointerMove = useThrottle((e: ThreeEvent<PointerEvent>) => {
    pointer.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    // Raycast against instanced mesh
  }, 16);
  
  return { state, handlePointerMove, ... };
}
```

### Keyboard Shortcuts

```typescript
const KEYBOARD_SHORTCUTS = {
  'r': 'resetCamera',
  'Escape': 'clearSelection',
  '1': 'viewWards',
  '2': 'viewBooths',
  '3': 'viewFamilies',
  '+': 'zoomIn',
  '-': 'zoomOut',
  'ArrowUp': 'panUp',
  'ArrowDown': 'panDown',
  'ArrowLeft': 'panLeft',
  'ArrowRight': 'panRight',
};
```

### Touch Gesture Support

```typescript
// Using @use-gesture/react
import { useGesture } from '@use-gesture/react';

function TouchControls({ onPan, onPinch, onRotate }) {
  const bind = useGesture({
    onPinch: ({ offset: [d, a] }) => {
      onPinch(d); // Zoom
      onRotate(a); // Rotation
    },
    onDrag: ({ movement: [x, y], pinching }) => {
      if (!pinching) onPan(x, y);
    },
  });
  
  return <group {...bind()} />;
}
```

---

## 6. Performance Optimization Roadmap

### Phase 1: Instancing (Critical)

```typescript
// Convert individual meshes to InstancedMesh
import { Instances, Instance } from '@react-three/drei';

function WardInstances({ wards }: { wards: Ward3DData[] }) {
  return (
    <Instances limit={100} range={wards.length}>
      <cylinderGeometry args={[0.8, 0.8, 1, 6]} />
      <meshStandardMaterial />
      
      {wards.map((ward, i) => (
        <WardInstance key={ward.wardNo} data={ward} index={i} />
      ))}
    </Instances>
  );
}

function WardInstance({ data, index }: { data: Ward3DData; index: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  
  useFrame(() => {
    if (!ref.current) return;
    // Update instance matrix for this ward
    const matrix = new THREE.Matrix4();
    matrix.compose(
      new THREE.Vector3(...data.position),
      new THREE.Quaternion(),
      new THREE.Vector3(1, data.height, 1)
    );
    ref.current.setMatrixAt(index, matrix);
    ref.current.instanceMatrix.needsUpdate = true;
  });
  
  return <Instance ref={ref} color={SENTIMENT_COLORS[data.sentiment]} />;
}
```

### Phase 2: LOD System

```typescript
// Level of Detail based on camera distance
import { Detailed } from '@react-three/drei';

function WardLOD({ data }: { data: Ward3DData }) {
  return (
    <Detailed distances={[0, 20, 50, 100]}>
      {/* High detail: full model with animations */}
      <WardHighDetail data={data} />
      
      {/* Medium: simplified geometry, no animations */}
      <WardMediumDetail data={data} />
      
      {/* Low: basic cylinder */}
      <WardLowDetail data={data} />
      
      {/* Billboard: flat sprite at far distance */}
      <WardBillboard data={data} />
    </Detailed>
  );
}
```

### Phase 3: Culling & Batching

```typescript
// Frustum culling helper
import { useFrame, useThree } from '@react-three/fiber';

function useFrustumCulling(objects: THREE.Object3D[]) {
  const { camera } = useThree();
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  
  useFrame(() => {
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);
    
    objects.forEach(obj => {
      obj.visible = frustum.containsPoint(obj.position);
    });
  });
}
```

### Phase 4: Frame Budget Monitoring

```typescript
// Performance monitoring component
import { useFrame } from '@react-three/fiber';
import Stats from 'stats.js';

function PerformanceMonitor({ onPerformanceDrop }: { onPerformanceDrop: () => void }) {
  const stats = useMemo(() => new Stats(), []);
  const lowFpsCount = useRef(0);
  
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      document.body.appendChild(stats.dom);
      return () => document.body.removeChild(stats.dom);
    }
  }, []);
  
  useFrame(() => {
    stats.update();
    
    // Detect sustained low FPS
    if (stats.getFPS() < 30) {
      lowFpsCount.current++;
      if (lowFpsCount.current > 60) { // 2 seconds of low FPS
        onPerformanceDrop();
        lowFpsCount.current = 0;
      }
    } else {
      lowFpsCount.current = 0;
    }
  });
  
  return null;
}
```

---

## 7. Recommended Folder Structure

```
components/
└── war-room/
    └── 3d/
        ├── index.ts                    # Barrel exports
        ├── WarRoom3DCanvas.tsx         # Main canvas component
        │
        ├── scene/
        │   ├── Scene3D.tsx             # Scene composition
        │   ├── Ground.tsx              # Ground plane
        │   ├── LightRig.tsx            # Lighting setup
        │   └── Environment.tsx         # HDRI environment
        │
        ├── cameras/
        │   ├── CameraController.tsx    # Camera animation
        │   ├── CameraPresets.ts        # View presets
        │   └── useCameraTransition.ts  # Smooth transitions
        │
        ├── objects/
        │   ├── instances/
        │   │   ├── WardInstances.tsx   # Instanced wards
        │   │   ├── BoothInstances.tsx  # Instanced booths
        │   │   └── FamilyInstances.tsx # Instanced families
        │   ├── overlays/
        │   │   ├── SelectionRing.tsx   # Selection indicator
        │   │   ├── HoverHighlight.tsx  # Hover effect
        │   │   └── SwingArrow.tsx      # Swing indicator
        │   └── labels/
        │       ├── WardLabel.tsx       # Ward text
        │       └── LabelBillboard.tsx  # Billboard text
        │
        ├── materials/
        │   ├── index.ts                # Material exports
        │   ├── BuildingMaterial.ts     # Ward/booth material
        │   ├── GlowMaterial.ts         # Selection glow
        │   └── shaders/
        │       ├── building.vert
        │       ├── building.frag
        │       └── glow.frag
        │
        ├── interactions/
        │   ├── useInteractionManager.ts
        │   ├── useRaycast.ts
        │   ├── useKeyboardShortcuts.ts
        │   └── useTouchGestures.ts
        │
        ├── effects/
        │   ├── PostProcessing.tsx
        │   ├── Fog.tsx
        │   └── RippleEffect.tsx
        │
        ├── utils/
        │   ├── geometry-pool.ts        # Geometry reuse
        │   ├── material-cache.ts       # Material caching
        │   ├── performance-monitor.ts
        │   └── device-detection.ts
        │
        ├── hooks/
        │   ├── useWard3DData.ts        # Data transformation
        │   ├── useLOD.ts               # Level of detail
        │   ├── useFrustumCulling.ts
        │   └── useFrameBudget.ts
        │
        └── constants/
            ├── colors.ts               # Sentiment colors
            ├── dimensions.ts           # Building sizes
            └── camera.ts               # Camera presets
```

---

## 8. Implementation Priorities

### Sprint 1: Foundation (1 week)
- [ ] Implement InstancedMesh for wards (draw calls: 50+ → 1)
- [ ] Remove `@ts-nocheck` and add proper types
- [ ] Create geometry pool with proper disposal
- [ ] Reduce shadow map to 1024x1024
- [ ] Add `frameloop="demand"` for idle optimization

### Sprint 2: Materials & Lighting (1 week)
- [ ] Replace MeshPhysicalMaterial with MeshStandardMaterial
- [ ] Create shared material instances
- [ ] Implement proper lighting rig
- [ ] Add compressed HDRI environment

### Sprint 3: Interactions (1 week)
- [ ] Centralize interaction state
- [ ] Implement proper raycasting for instances
- [ ] Add keyboard shortcuts
- [ ] Improve touch gesture support

### Sprint 4: Polish & Mobile (1 week)
- [ ] Implement LOD system
- [ ] Add post-processing (with mobile fallback)
- [ ] Performance monitoring & adaptive quality
- [ ] Bundle size optimization

---

## 9. Metrics & Validation

### Performance Targets

```typescript
// Automated performance testing
const PERFORMANCE_THRESHOLDS = {
  desktop: {
    fps: { min: 55, target: 60 },
    frameTime: { max: 18 }, // ms
    drawCalls: { max: 30 },
    triangles: { max: 100000 },
    memoryMB: { max: 100 },
  },
  mobile: {
    fps: { min: 28, target: 45 },
    frameTime: { max: 35 },
    drawCalls: { max: 15 },
    triangles: { max: 50000 },
    memoryMB: { max: 60 },
  },
};
```

### Bundle Impact

| Module | Current | Target | Savings |
|--------|---------|--------|---------|
| three | ~150KB | ~150KB | - |
| @react-three/fiber | ~45KB | ~45KB | - |
| @react-three/drei | ~80KB | ~30KB | Tree-shake |
| Custom 3D code | ~25KB | ~20KB | Optimize |
| **Total** | **~300KB** | **~245KB** | **~55KB** |

---

## 10. Quick Wins (Immediate Actions)

These can be implemented today with minimal risk:

### 1. Reduce DPR
```diff
- dpr={[1, 2]}
+ dpr={[1, 1.5]}
```

### 2. Add frame loop demand
```diff
- <Canvas shadows ...>
+ <Canvas shadows frameloop="demand" ...>
```

### 3. Reduce shadow quality
```diff
- shadow-mapSize-width={2048}
- shadow-mapSize-height={2048}
+ shadow-mapSize={[1024, 1024]}
```

### 4. Simplify materials
```diff
- <meshPhysicalMaterial
-   transmission={0.6}
-   thickness={1}
-   clearcoat={1}
- />
+ <meshStandardMaterial
+   transparent
+   opacity={0.85}
+ />
```

### 5. Reduce geometry complexity
```diff
- <cylinderGeometry args={[0.8, 0.8, height, 6]} />
+ <cylinderGeometry args={[0.8, 0.8, height, 6, 1]} /> // 1 height segment
```

---

## Appendix: Device Detection

```typescript
// Adaptive quality based on device
function useAdaptiveQuality() {
  const [quality, setQuality] = useState<'high' | 'medium' | 'low'>('high');
  
  useEffect(() => {
    const gl = document.createElement('canvas').getContext('webgl');
    if (!gl) {
      setQuality('low');
      return;
    }
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo 
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : '';
    
    // Mobile detection
    const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
    
    // Integrated GPU detection
    const isIntegrated = /Intel|Mali|Adreno|PowerVR/i.test(renderer);
    
    if (isMobile) {
      setQuality('low');
    } else if (isIntegrated) {
      setQuality('medium');
    } else {
      setQuality('high');
    }
  }, []);
  
  return quality;
}
```

---

**Document Version:** 1.0  
**Last Updated:** December 2024  
**Author:** 3D Production Team
