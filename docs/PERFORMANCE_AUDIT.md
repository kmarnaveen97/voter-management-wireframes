# Performance Audit Report

**Date:** December 19, 2025  
**Codebase:** voter-management-wireframes  
**Framework:** Next.js 16 / React 19 / TypeScript

---

## Executive Summary

| Category              | Score | Status                               |
| --------------------- | ----- | ------------------------------------ |
| Bundle Size           | 6/10  | ⚠️ Heavy 3D dependencies             |
| React Performance     | 5/10  | 🔴 No virtualization for large lists |
| Data Fetching         | 8/10  | ✅ React Query well-configured       |
| Next.js Optimizations | 4/10  | 🔴 No Server Components              |
| Rendering Performance | 5/10  | ⚠️ Large monolithic pages            |

**Overall Score: 5.6/10**

---

## 🔴 Critical Issues (Fix Immediately)

### 1. VoterTable Lacks Virtualization

**Impact:** Severe performance degradation with 10,000+ voters

**File:** `components/voters/voter-table.tsx`

**Problem:**

```tsx
// Currently renders ALL rows to DOM
<TableBody>
  {voters.map((voter, index) => (
    <TableRow key={id}>...</TableRow>
  ))}
</TableBody>
```

**Solution:**

```bash
npm install @tanstack/react-virtual  # ✅ Already installed
```

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

// In VoterTable component
const parentRef = useRef<HTMLDivElement>(null);

const rowVirtualizer = useVirtualizer({
  count: voters.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 52, // Row height in pixels
  overscan: 10, // Render 10 extra rows above/below viewport
});

// Render
<div ref={parentRef} className="h-[600px] overflow-auto">
  <div style={{ height: rowVirtualizer.getTotalSize() }}>
    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
      const voter = voters[virtualRow.index];
      return (
        <div
          key={virtualRow.key}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }}
        >
          <VoterRow voter={voter} ... />
        </div>
      );
    })}
  </div>
</div>
```

---

### 2. All Pages Use "use client" - No SSR Benefits

**Impact:** Larger bundles, no server-side data fetching, slower initial load

**Files Affected:**

- `app/voters-management/page.tsx`
- `app/voters-management/voters/page.tsx`
- `app/voters-management/families/page.tsx`
- `app/voters-management/war-room/page.tsx`
- All other pages

**Solution:** Hybrid approach with Server Components

```tsx
// app/voters-management/voters/page.tsx (Server Component)
import { VotersClient } from "./client";
import { api } from "@/lib/api-server"; // Server-only API client

export default async function VotersPage() {
  // Fetch on server
  const initialVoters = await api.getVoters(1, 100);

  return <VotersClient initialData={initialVoters} />;
}

// app/voters-management/voters/client.tsx (Client Component)
("use client");

export function VotersClient({ initialData }: Props) {
  const { data } = useQuery({
    queryKey: ["voters"],
    queryFn: fetchVoters,
    initialData, // Hydrate with server data
  });

  return <VoterTable voters={data.voters} />;
}
```

---

### 3. War Room Page is 4,000+ Lines

**Impact:** Poor maintainability, no code-splitting possible

**File:** `app/voters-management/war-room/page.tsx` (4,091 lines)

**Solution:** Extract into focused components

```
components/war-room/
├── index.ts                      # Barrel exports
├── war-room-skeleton.tsx         # Loading state
├── stat-card.tsx                 # Stats display
├── sentiment-bar.tsx             # Sentiment visualization
├── win-probability-gauge.tsx     # Win probability dial
├── floating-priority-targets.tsx # Target list
├── ward-hover-card.tsx           # Ward details popup
├── house-details-dialog.tsx      # House voter dialog
├── ward-selector.tsx             # Ward filtering
└── ward-map.tsx                  # SVG map component
```

---

## ⚠️ Medium Priority Issues

### 4. Inline Functions Causing Re-renders

**Files:**

- `components/voters/voter-table.tsx`
- `app/voters-management/war-room/page.tsx`

**Problem:**

```tsx
// New function created every render
<TableRow onClick={() => toggleSelect(id)}>
  <Checkbox onCheckedChange={() => toggleSelect(id)} />
</TableRow>
```

**Solution:**

```tsx
// Memoize with useCallback
const handleRowClick = useCallback((id: string) => {
  toggleSelect(id);
}, [toggleSelect]);

// Or use event delegation
<TableRow data-id={id} onClick={handleRowClick}>
```

---

### 5. Missing React.memo on Sub-components

**Files:** Multiple inline components in page files

**Problem:**

```tsx
// Defined inside parent - re-created every render
function StatCard({ icon, label, value }) {
  return <div>...</div>;
}
```

**Solution:**

```tsx
// Extract and memoize
const StatCard = React.memo(function StatCard({ icon: Icon, label, value }) {
  return <div>...</div>;
});
```

---

### 6. Client-Side Filtering Wastes Bandwidth

**File:** `app/voters-management/families/page.tsx`

**Problem:**

```tsx
// Fetches ALL data, then filters client-side
let families = data.pages.flatMap((page) => page.families);
if (selectedWard !== "all") {
  families = families.filter((f) => f.ward_no === selectedWard);
}
```

**Solution:**

```tsx
// Pass filters to API
queryFn: async ({ pageParam = 1 }) => {
  return api.getFamilies(pageParam, PAGE_SIZE, listId, {
    ward_no: selectedWard !== "all" ? selectedWard : undefined,
  });
};
```

---

### 7. N+1 Query Pattern in War Room

**File:** `hooks/use-war-room.ts`

**Problem:**

```tsx
// Fetches houses for EACH ward in parallel
await Promise.all(
  wardsList.map(async (ward) => {
    await api.getWardHouses(ward.ward_no, listId);
  })
);
```

**Solution:**

```tsx
// Option A: Batch API endpoint
await api.getAllWardHouses(listId);

// Option B: Throttle requests
import pLimit from "p-limit";
const limit = pLimit(3);
await Promise.all(
  wardsList.map((w) => limit(() => api.getWardHouses(w.ward_no)))
);
```

---

### 8. 3D Scene Creates Objects Every Frame

**File:** `components/war-room/war-room-3d-scene.tsx`

**Problem:**

```tsx
useFrame(() => {
  // Creates new Vector3 on EVERY frame (60fps = 60 allocations/sec)
  meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
});
```

**Solution:**

```tsx
// Create once, reuse
const targetScale = useMemo(() => new THREE.Vector3(), []);

useFrame(() => {
  targetScale.setScalar(scale);
  meshRef.current.scale.lerp(targetScale, 0.1);
});
```

---

## ✅ Good Practices Found

### React Query Configuration

```tsx
// lib/query-client.tsx - Well-tuned defaults
const defaultQueryOptions = {
  queries: {
    staleTime: 30 * 1000, // ✅ 30 seconds
    gcTime: 5 * 60 * 1000, // ✅ 5 minutes cache
    retry: 2, // ✅ Reasonable retry
    refetchOnWindowFocus: false, // ✅ Good for data apps
  },
};
```

### Dynamic Import for 3D

```tsx
// ✅ Correctly code-split
const WarRoom3DCanvas = dynamic(
  () => import("@/components/war-room/war-room-3d-scene"),
  { ssr: false }
);
```

### Query Keys Factory

```tsx
// ✅ Type-safe, organized
export const queryKeys = {
  voters: {
    all: ["voters"] as const,
    list: (listId, filters) => [...queryKeys.voters.all, listId, filters],
  },
};
```

---

## Implementation Priority

| Priority | Issue                            | Impact | Effort | ROI        |
| -------- | -------------------------------- | ------ | ------ | ---------- |
| 1        | Add virtualization to VoterTable | High   | Medium | ⭐⭐⭐⭐⭐ |
| 2        | Memoize inline functions         | Medium | Low    | ⭐⭐⭐⭐   |
| 3        | Split war-room page              | Medium | Medium | ⭐⭐⭐⭐   |
| 4        | Move filters to server           | Medium | Low    | ⭐⭐⭐     |
| 5        | Throttle ward house queries      | Medium | Low    | ⭐⭐⭐     |
| 6        | Convert to Server Components     | High   | High   | ⭐⭐⭐     |
| 7        | Add React.memo                   | Low    | Low    | ⭐⭐       |
| 8        | Fix 3D frame allocations         | Low    | Low    | ⭐⭐       |

---

## Quick Wins (< 30 minutes each)

### 1. Install Bundle Analyzer

```bash
npm install @next/bundle-analyzer
```

```js
// next.config.mjs
import withBundleAnalyzer from "@next/bundle-analyzer";

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})({
  // existing config
});
```

```bash
ANALYZE=true npm run build
```

### 2. Add Performance Monitoring

```tsx
// lib/performance.ts
export function measureRender(componentName: string) {
  if (process.env.NODE_ENV === "development") {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      if (duration > 16) {
        // Longer than 1 frame
        console.warn(`${componentName} render took ${duration.toFixed(2)}ms`);
      }
    };
  }
  return () => {};
}
```

### 3. Add Web Vitals Tracking

```tsx
// app/layout.tsx
import { useReportWebVitals } from "next/web-vitals";

export function reportWebVitals(metric) {
  console.log(metric);
  // Send to analytics
}
```

---

## Benchmarks to Target

| Metric                          | Current (Est.) | Target  | Measurement    |
| ------------------------------- | -------------- | ------- | -------------- |
| First Contentful Paint          | ~2.5s          | < 1.5s  | Lighthouse     |
| Largest Contentful Paint        | ~4s            | < 2.5s  | Lighthouse     |
| Time to Interactive             | ~5s            | < 3.5s  | Lighthouse     |
| Voter Table Render (1000 rows)  | ~800ms         | < 50ms  | React DevTools |
| Voter Table Render (10000 rows) | ~8s            | < 100ms | React DevTools |
| War Room Initial Load           | ~3s            | < 1.5s  | Network tab    |

---

## Next Steps

1. **Week 1:** Implement virtualization in VoterTable
2. **Week 1:** Memoize inline functions in top 5 pages
3. **Week 2:** Split war-room page into components
4. **Week 2:** Move filtering to server-side
5. **Week 3:** Evaluate Server Components migration
6. **Week 3:** Run Lighthouse CI in pipeline

---

## Resources

- [TanStack Virtual Documentation](https://tanstack.com/virtual/latest)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React DevTools Profiler](https://react.dev/learn/react-developer-tools)
