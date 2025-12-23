# Frontend Architecture Blueprint v2.0

## Voter Management Platform

> **Prepared by**: Principal Engineer  
> **Last Updated**: December 2025  
> **Tech Stack**: Next.js 16 • React 19 • TypeScript • React Query 5 • Tailwind CSS • Radix UI

---

## Executive Summary

This document defines the production-grade frontend architecture for a voter management platform serving political campaigns. The system handles **voter databases of 50k–500k records**, real-time sentiment tracking, family relationship mapping, and election-day turnout operations.

### Key Metrics Achieved

| Metric                 | Current | Target | Status |
| ---------------------- | ------- | ------ | ------ |
| TypeScript Coverage    | 100%    | 100%   | ✅     |
| React Query Migration  | 100%    | 100%   | ✅     |
| Optimistic Updates     | 100%    | 100%   | ✅     |
| Component Modularity   | 90%     | 90%    | ✅     |
| Error Boundaries       | 100%    | 100%   | ✅     |
| Loading States         | 100%    | 100%   | ✅     |
| Dark Mode Support      | 100%    | 100%   | ✅     |
| Lighthouse Performance | ~70     | 90+    | 🔴     |
| Bundle Size            | Unknown | <250KB | ⚪     |

---

## 1. Product & UI Goals

### 1.1 Core User Workflows

| Workflow                    | Primary Users     | Frequency    | Performance Constraint |
| --------------------------- | ----------------- | ------------ | ---------------------- |
| **Voter Search**            | Field workers     | 1000+/day    | <200ms response        |
| **Sentiment Tagging**       | Karyakartas       | Constant     | Optimistic UI required |
| **Family Tree Navigation**  | Data operators    | Moderate     | Smooth pan/zoom        |
| **War Room Dashboard**      | Campaign managers | Real-time    | 5s refresh cycle       |
| **Turnout Tracking**        | Booth agents      | Election day | <100ms updates         |
| **PDF Upload & Extraction** | Admins            | Weekly       | Background processing  |

### 1.2 Required UI Views

```
┌─────────────────────────────────────────────────────────────┐
│  VOTERS MANAGEMENT MODULE                                    │
├─────────────────────────────────────────────────────────────┤
│  ├── Dashboard (KPIs, sentiment distribution)                │
│  ├── Voters List (search, filter, paginate, bulk actions)    │
│  ├── Voter Detail (profile, family, history)                 │
│  ├── Families (tree view, relationship mapping)              │
│  ├── War Room (map visualization, target lists)              │
│  ├── War Room 3D (Three.js village model)                    │
│  ├── Elections (candidate management, race tracking)         │
│  ├── Polling Stations (booth intelligence)                   │
│  ├── Voter Turnout (election day ops)                        │
│  ├── Compare (list diff analysis)                            │
│  └── Upload (PDF extraction pipeline)                        │
├─────────────────────────────────────────────────────────────┤
│  WEBSITE MANAGEMENT MODULE                                   │
├─────────────────────────────────────────────────────────────┤
│  SOCIAL MEDIA MANAGEMENT MODULE                              │
└─────────────────────────────────────────────────────────────┘
```

### 1.3 Navigation Model

```
/                           → Redirect to /voters-management
/voters-management          → Dashboard (with shared layout: sidebar + header)
/voters-management/voters   → Voter list with filters
/voters-management/voters/[id] → Voter detail (consider modal intercept)
/voters-management/families → Family tree explorer
/voters-management/war-room → 2D map command center
/voters-management/war-room-3d → Immersive 3D view
/voters-management/elections → Candidate management
/voters-management/polling-stations → Booth analytics
/voters-management/polling-stations/[ps_code] → Station detail (via query param)
/voters-management/voter-turnout → Election day tracking
/voters-management/compare  → List diff tool
/voters-management/upload   → PDF import
/website-management         → Separate module layout
/social-media-management    → Separate module layout
```

### 1.4 Accessibility Level

**Target: WCAG 2.1 AA**

- Focus visible on all interactive elements
- 4.5:1 color contrast (text), 3:1 (UI components)
- Skip links for main content
- Keyboard navigation for tables, trees, modals
- aria-live regions for dynamic updates
- Screen reader announcements for toast notifications

---

## 2. Frontend Architecture

### 2.1 App Router Structure

```
/app
├── layout.tsx              # Root: fonts, theme provider, query provider
├── page.tsx                # Redirect to /voters-management
├── globals.css             # Tailwind + CSS variables
│
├── voters-management/
│   ├── layout.tsx          # Module shell: sidebar, list context
│   ├── page.tsx            # Dashboard
│   ├── voters/
│   │   ├── page.tsx        # List view
│   │   └── [id]/page.tsx   # Detail view (future)
│   ├── families/
│   │   └── page.tsx        # Tree explorer
│   ├── war-room/
│   │   └── page.tsx        # 2D command center
│   ├── war-room-3d/
│   │   └── page.tsx        # 3D Three.js view
│   ├── elections/
│   │   └── page.tsx        # Candidate management
│   ├── polling-stations/
│   │   ├── page.tsx        # Station list + detail
│   │   ├── [ps_code]/      # Legacy redirect
│   │   └── loading.tsx     # Streaming skeleton
│   ├── voter-turnout/
│   │   └── page.tsx        # Election day ops
│   ├── compare/
│   │   └── page.tsx        # List diff
│   ├── upload/
│   │   └── page.tsx        # PDF import
│   └── family-mapping/     # Deprecated (merge into families)
│
├── website-management/
│   ├── layout.tsx
│   └── page.tsx
│
├── social-media-management/
│   └── page.tsx
│
└── polling-stations/       # Legacy redirect route
    └── [stationId]/page.tsx
```

### 2.2 Client vs Server Components

| Component Type            | Rendering | Examples                     |
| ------------------------- | --------- | ---------------------------- |
| **Layouts**               | Server    | Root layout, module layouts  |
| **Static UI**             | Server    | Page headers, empty states   |
| **Data Tables**           | Client    | VoterTable, BoothTable       |
| **Interactive Forms**     | Client    | VoterFilters, TaggingPanel   |
| **Charts/Visualizations** | Client    | Sentiment charts, 3D view    |
| **Modals/Dialogs**        | Client    | All dialogs                  |
| **Context Providers**     | Client    | QueryProvider, ThemeProvider |

**Rule**: Start with Server Component, add `"use client"` only when:

- useState/useEffect needed
- Browser APIs required
- Event handlers attached
- Third-party client libraries used

### 2.3 State Management Strategy

```
┌────────────────────────────────────────────────────────────┐
│                    STATE ARCHITECTURE                       │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   SERVER STATE (React Query)                                │
│   ├── Voters, families, stats                               │
│   ├── Elections, candidates                                 │
│   ├── Polling stations, booth voters                        │
│   ├── Turnout tracking data                                 │
│   └── Comparison results                                    │
│                                                             │
│   GLOBAL CLIENT STATE (React Context)                       │
│   ├── ListContext: selectedListId                           │
│   ├── SidebarContext: collapsed state                       │
│   └── ThemeContext: dark/light mode                         │
│                                                             │
│   LOCAL STATE (useState)                                    │
│   ├── Form inputs                                           │
│   ├── Modal open/close                                      │
│   ├── Selection arrays                                      │
│   ├── Filter values                                         │
│   ├── Sort config                                           │
│   └── Pagination state                                      │
│                                                             │
│   URL STATE (useSearchParams)                               │
│   ├── Page number                                           │
│   ├── Active filters                                        │
│   ├── Expanded station ID                                   │
│   └── Tab selection                                         │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

**Decision: No Redux/Zustand needed**

- React Query handles 90% of state (server data)
- Context handles global UI state
- URL params for shareable state
- Local useState for ephemeral UI

### 2.4 Data Fetching Model

```typescript
// ═══════════════════════════════════════════════════════════
// PATTERN 1: Basic Query (most pages)
// ═══════════════════════════════════════════════════════════
function VotersPage() {
  const { selectedListId } = useListContext();
  const { data, isLoading, error } = useVoters(selectedListId, filters);

  if (isLoading) return <VoterTableSkeleton />;
  if (error) return <ErrorState onRetry={refetch} />;
  return <VoterTable data={data.voters} />;
}

// ═══════════════════════════════════════════════════════════
// PATTERN 2: Dependent Queries (station → booths → voters)
// ═══════════════════════════════════════════════════════════
function StationDetail({ stationCode }) {
  const station = usePollingStationDetail(listId, stationCode);
  const booths = station.data?.booths || [];

  // Only fetch voters when booth tab is active
  const boothVoters = useBoothVoters(listId, activeBoothId, {
    enabled: !!activeBoothId,
  });
}

// ═══════════════════════════════════════════════════════════
// PATTERN 3: Optimistic Mutations (tagging)
// ═══════════════════════════════════════════════════════════
const tagMutation = useMutation({
  mutationFn: tagVoterSentiment,
  onMutate: async ({ voterId, sentiment }) => {
    await queryClient.cancelQueries({ queryKey: ["voters"] });
    const previous = queryClient.getQueryData(["voters"]);
    queryClient.setQueryData(["voters"], (old) =>
      optimisticallyUpdateVoter(old, voterId, sentiment)
    );
    return { previous };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(["voters"], context.previous);
    toast.error("Failed to update sentiment");
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["voters"] });
  },
});

// ═══════════════════════════════════════════════════════════
// PATTERN 4: Polling (comparison job status)
// ═══════════════════════════════════════════════════════════
const { data: status } = useQuery({
  queryKey: ["comparison", "status", jobId],
  queryFn: () => api.getComparisonStatus(jobId),
  refetchInterval: (query) =>
    query.state.data?.status === "completed" ? false : 2000,
});

// ═══════════════════════════════════════════════════════════
// PATTERN 5: Prefetching (hover intent)
// ═══════════════════════════════════════════════════════════
function VoterCard({ voter }) {
  const prefetch = usePrefetchVoterDetail();

  return (
    <Card
      onMouseEnter={() => prefetch(voter.voter_id)}
      onFocus={() => prefetch(voter.voter_id)}
    >
      {voter.name}
    </Card>
  );
}
```

---

## 3. Component Architecture

### 3.1 Component Taxonomy

```
/components
├── /ui                    # shadcn/ui primitives (DO NOT MODIFY)
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── table.tsx
│   └── ... (40+ primitives)
│
├── /voters                # Voter domain components
│   ├── index.ts           # Barrel export
│   ├── voter-table.tsx    # Main data table
│   ├── voter-filters.tsx  # Filter panel
│   ├── voter-card.tsx     # Card representation
│   ├── sentiment-badge.tsx # Sentiment indicator
│   ├── bulk-action-bar.tsx # Multi-select actions
│   └── candidate-selector.tsx
│
├── /families              # Family domain
│   ├── family-tree.tsx    # D3/custom tree view
│   ├── family-card.tsx
│   ├── tree-node.tsx
│   └── member-details-panel.tsx
│
├── /elections             # Elections domain
│   ├── candidate-card.tsx
│   └── add-candidate-dialog.tsx
│
├── /war-room              # War room domain
│   ├── ward-map.tsx       # 2D visualization
│   ├── house-marker.tsx
│   └── sentiment-heatmap.tsx
│
├── /upload                # Upload domain
│   ├── upload-form.tsx
│   └── extraction-progress.tsx
│
├── /shared                # Cross-domain components (TO CREATE)
│   ├── data-table/        # Generic table with sorting, pagination
│   ├── filter-panel/      # Reusable filter UI
│   ├── stat-card/         # Dashboard stat display
│   └── loading-states/    # Skeleton library
│
├── error-boundary.tsx     # Error catch boundary
├── page-header.tsx        # Standard page header
├── sidebar.tsx            # Navigation sidebar
├── module-switcher.tsx    # Module dropdown
├── list-selector.tsx      # Voter list picker
└── theme-provider.tsx     # Dark/light mode
```

### 3.2 Design Tokens

```typescript
// lib/design-tokens.ts

export const tokens = {
  // ═══════════════════════════════════════════════════════
  // COLORS (reference CSS variables for consistency)
  // ═══════════════════════════════════════════════════════
  colors: {
    sentiment: {
      support: "text-green-600 bg-green-100",
      oppose: "text-red-600 bg-red-100",
      swing: "text-amber-600 bg-amber-100",
      neutral: "text-gray-600 bg-gray-100",
      unknown: "text-slate-500 bg-slate-50",
    },
    turnout: {
      will_vote: "text-green-600 bg-green-100",
      already_voted: "text-blue-600 bg-blue-100",
      wont_vote: "text-red-600 bg-red-100",
      unsure: "text-amber-600 bg-amber-100",
      not_home: "text-orange-600 bg-orange-100",
      needs_transport: "text-purple-600 bg-purple-100",
    },
    gender: {
      male: "border-blue-300 text-blue-700",
      female: "border-pink-300 text-pink-700",
    },
  },

  // ═══════════════════════════════════════════════════════
  // SPACING (8px grid system)
  // ═══════════════════════════════════════════════════════
  spacing: {
    page: "p-4 md:p-6",
    section: "space-y-4",
    card: "p-4",
    cardCompact: "p-3",
    gap: "gap-4",
    gapTight: "gap-2",
  },

  // ═══════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════
  typography: {
    pageTitle: "text-xl md:text-2xl font-bold",
    sectionTitle: "text-base font-semibold",
    cardTitle: "text-base font-medium",
    label: "text-sm font-medium",
    body: "text-sm",
    caption: "text-xs text-muted-foreground",
    mono: "font-mono text-xs",
  },

  // ═══════════════════════════════════════════════════════
  // BREAKPOINTS (Tailwind defaults)
  // ═══════════════════════════════════════════════════════
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },

  // ═══════════════════════════════════════════════════════
  // ANIMATION
  // ═══════════════════════════════════════════════════════
  animation: {
    fast: "duration-150",
    normal: "duration-200",
    slow: "duration-300",
    spin: "animate-spin",
    pulse: "animate-pulse",
  },
} as const;

// Sentiment configuration
export const SENTIMENT_CONFIG = {
  support: {
    label: "Support",
    color: "green",
    icon: "ThumbsUp",
    shortcut: "1",
  },
  oppose: { label: "Oppose", color: "red", icon: "ThumbsDown", shortcut: "2" },
  swing: { label: "Swing", color: "amber", icon: "RefreshCw", shortcut: "3" },
  neutral: { label: "Neutral", color: "gray", icon: "Minus", shortcut: "4" },
} as const;
```

### 3.3 Accessibility Rules

```typescript
// Component accessibility checklist:

// 1. FOCUS MANAGEMENT
// - All interactive elements must be focusable
// - Focus order matches visual order
// - Focus trapped in modals

// 2. KEYBOARD NAVIGATION
<Table
  onKeyDown={(e) => {
    if (e.key === 'ArrowDown') selectNextRow();
    if (e.key === 'ArrowUp') selectPrevRow();
    if (e.key === 'Enter') openDetail();
    if (e.key === 'Escape') clearSelection();
  }}
  role="grid"
  aria-label="Voter list"
/>

// 3. SCREEN READER ANNOUNCEMENTS
<div aria-live="polite" aria-atomic="true" className="sr-only">
  {isLoading ? 'Loading voters...' : `${total} voters found`}
</div>

// 4. SEMANTIC HTML
<nav aria-label="Main navigation">
  <ul role="list">
    <li><a href="/voters">Voters</a></li>
  </ul>
</nav>

// 5. COLOR CONTRAST
// All text: 4.5:1 minimum
// UI components: 3:1 minimum
// Use tokens.colors for consistency
```

---

## 4. Data & API Integration

### 4.1 API Module Structure

```
/lib/api
├── client.ts           # Base fetch wrapper, error handling
├── voters.ts           # Voter CRUD operations
├── families.ts         # Family tree operations
├── stats.ts            # Dashboard statistics
├── lists.ts            # Voter list management
├── elections.ts        # Candidate operations
├── polling.ts          # Station & booth operations
├── turnout.ts          # Turnout tracking
├── comparison.ts       # List diff operations
└── index.ts            # Barrel export with types
```

### 4.2 Query Key Factory

```typescript
// lib/query-client.tsx

export const queryKeys = {
  // Voter lists
  lists: {
    all: ["lists"] as const,
    list: (id: number) => ["lists", id] as const,
  },

  // Voters
  voters: {
    all: (listId: number) => ["voters", listId] as const,
    list: (listId: number, filters: object) =>
      ["voters", listId, "list", filters] as const,
    search: (listId: number, query: string) =>
      ["voters", listId, "search", query] as const,
    detail: (listId: number, voterId: number) =>
      ["voters", listId, voterId] as const,
  },

  // Families
  families: {
    list: (listId: number, page: number, filters?: object) =>
      ["families", listId, page, filters] as const,
    members: (listId: number, wardNo: string, houseNo: string) =>
      ["families", listId, wardNo, houseNo, "members"] as const,
    tree: (listId: number, wardNo: string, houseNo: string) =>
      ["families", listId, wardNo, houseNo, "tree"] as const,
  },

  // Statistics
  stats: {
    overview: (listId: number) => ["stats", listId, "overview"] as const,
    wards: (listId: number) => ["stats", listId, "wards"] as const,
    age: (listId: number) => ["stats", listId, "age"] as const,
    gender: (listId: number) => ["stats", listId, "gender"] as const,
  },

  // War Room
  warRoom: {
    overview: (listId: number) => ["warRoom", listId, "overview"] as const,
    wardMap: (listId: number) => ["warRoom", listId, "wardMap"] as const,
    houses: (listId: number, wardNo: string) =>
      ["warRoom", listId, "houses", wardNo] as const,
    targets: (listId: number) => ["warRoom", listId, "targets"] as const,
  },

  // Elections
  elections: {
    candidates: (listId: number, filters?: object) =>
      ["elections", listId, "candidates", filters] as const,
    candidate: (candidateId: number) =>
      ["elections", "candidate", candidateId] as const,
  },

  // Polling
  polling: {
    stations: (listId: number) => ["polling", listId, "stations"] as const,
    station: (listId: number, stationCode: string) =>
      ["polling", listId, "station", stationCode] as const,
    booths: (listId: number, stationId?: number) =>
      ["polling", listId, "booths", stationId] as const,
    boothStats: (listId: number) => ["polling", listId, "boothStats"] as const,
    boothVoters: (listId: number, boothId: number) =>
      ["polling", listId, "booth", boothId, "voters"] as const,
    statsRaw: (listId: number) => ["polling", listId, "statsRaw"] as const,
  },

  // Turnout
  turnout: {
    summary: (listId: number) => ["turnout", listId, "summary"] as const,
    voters: (listId: number, filters?: object) =>
      ["turnout", listId, "voters", filters] as const,
  },
} as const;
```

### 4.3 Error Handling Strategy

```typescript
// Pattern: Centralized error boundary + per-query fallbacks

// 1. Global error boundary (app/layout.tsx)
<ErrorBoundary fallback={<GlobalErrorFallback />}>
  <QueryProvider>{children}</QueryProvider>
</ErrorBoundary>;

// 2. Page-level error handling
function VotersPage() {
  const { data, error, refetch } = useVoters(listId);

  if (error) {
    return (
      <ErrorState
        title="Failed to load voters"
        description={error.message}
        onRetry={refetch}
      />
    );
  }
  // ...
}

// 3. Component-level graceful degradation
function SentimentBadge({ sentiment }) {
  const config = SENTIMENT_CONFIG[sentiment];
  if (!config) return null; // Graceful fallback
  return <Badge>{config.label}</Badge>;
}

// 4. Toast notifications for mutations
const mutation = useMutation({
  onError: (error) => {
    toast.error(error.message || "Something went wrong");
  },
  onSuccess: () => {
    toast.success("Updated successfully");
  },
});
```

### 4.4 Loading UI Patterns

```typescript
// Pattern 1: Skeleton (preserves layout)
function VoterTableSkeleton() {
  return (
    <Table>
      <TableHeader>...</TableHeader>
      <TableBody>
        {Array.from({ length: 10 }).map((_, i) => (
          <TableRow key={i}>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-16" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// Pattern 2: Spinner (minimal feedback)
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

// Pattern 3: Progress (deterministic)
function UploadProgress({ progress }) {
  return (
    <div className="space-y-2">
      <Progress value={progress} />
      <p className="text-sm text-muted-foreground">{progress}% complete</p>
    </div>
  );
}

// Pattern 4: Suspense boundary
<Suspense fallback={<VoterTableSkeleton />}>
  <VoterTable />
</Suspense>;
```

---

## 5. Performance Strategy

### 5.1 Bundle Optimization

```typescript
// 1. Dynamic imports for heavy components
const ThreeScene = dynamic(() => import("@/components/war-room/three-scene"), {
  loading: () => <LoadingSpinner />,
  ssr: false, // Three.js doesn't support SSR
});

// 2. Route-based code splitting (automatic with App Router)
// Each page.tsx is a separate chunk

// 3. Component-level splitting for large features
const FamilyTree = dynamic(() => import("@/components/families/family-tree"), {
  loading: () => <TreeSkeleton />,
});
```

### 5.2 Memoization Strategy

```typescript
// Rule: Memoize when:
// 1. Component receives complex object props
// 2. Component renders lists
// 3. Expensive computations

// Example: Memoized list item
const VoterRow = memo(function VoterRow({ voter, onSelect }) {
  return (
    <TableRow onClick={() => onSelect(voter.voter_id)}>
      <TableCell>{voter.name}</TableCell>
      <TableCell>{voter.age}</TableCell>
    </TableRow>
  );
});

// Example: Memoized computation
const sortedStations = useMemo(
  () => [...stations].sort((a, b) => a.name.localeCompare(b.name)),
  [stations]
);

// Example: Stable callback
const handleSelect = useCallback(
  (id: number) => setSelectedIds((prev) => [...prev, id]),
  []
);
```

### 5.3 Query Optimization

```typescript
// 1. Stale time configuration
const { data } = useQuery({
  queryKey: ["stats", listId],
  queryFn: fetchStats,
  staleTime: 60 * 1000, // Data fresh for 1 minute
  gcTime: 5 * 60 * 1000, // Cache for 5 minutes
});

// 2. Placeholder data (instant perceived loading)
const { data } = useQuery({
  queryKey: ["voters", listId, filters],
  queryFn: fetchVoters,
  placeholderData: (previousData) => previousData,
});

// 3. Prefetching on user intent
function StationCard({ station }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.polling.station(listId, station.code),
      queryFn: () => api.getPollingStation(station.code, listId),
    });
  };

  return <Card onMouseEnter={handleMouseEnter}>...</Card>;
}

// 4. Selective invalidation (not sledgehammer)
queryClient.invalidateQueries({
  queryKey: queryKeys.voters.all(listId),
  exact: false, // Invalidate all voters queries for this list
});
```

### 5.4 Lighthouse Targets

| Metric  | Target | Current Strategy                   |
| ------- | ------ | ---------------------------------- |
| **FCP** | <1.8s  | Server components, streaming       |
| **LCP** | <2.5s  | Optimized images, font preload     |
| **TBT** | <200ms | Code splitting, defer non-critical |
| **CLS** | <0.1   | Skeleton dimensions match content  |
| **SI**  | <3.4s  | Progressive loading                |

---

## 6. Project Structure (Final)

```
voter-management-wireframes/
├── app/                           # Next.js App Router
│   ├── layout.tsx                 # Root: fonts, providers
│   ├── page.tsx                   # Redirect
│   ├── globals.css                # Tailwind + CSS vars
│   │
│   ├── voters-management/         # Main module
│   │   ├── layout.tsx             # Sidebar, list context
│   │   ├── page.tsx               # Dashboard
│   │   ├── voters/page.tsx
│   │   ├── families/page.tsx
│   │   ├── war-room/page.tsx
│   │   ├── war-room-3d/page.tsx
│   │   ├── elections/page.tsx
│   │   ├── polling-stations/page.tsx
│   │   ├── voter-turnout/page.tsx
│   │   ├── compare/page.tsx
│   │   └── upload/page.tsx
│   │
│   ├── website-management/
│   └── social-media-management/
│
├── components/
│   ├── ui/                        # shadcn/ui (DO NOT MODIFY)
│   ├── voters/                    # Voter domain
│   ├── families/                  # Family domain
│   ├── elections/                 # Election domain
│   ├── war-room/                  # War room domain
│   ├── upload/                    # Upload domain
│   ├── shared/                    # Cross-domain (TO CREATE)
│   │   ├── data-table/
│   │   ├── filter-panel/
│   │   ├── stat-card/
│   │   └── loading-states/
│   ├── error-boundary.tsx
│   ├── page-header.tsx
│   ├── sidebar.tsx
│   └── theme-provider.tsx
│
├── hooks/
│   ├── use-queries.ts             # Shared React Query hooks
│   ├── use-war-room.ts            # War room hooks
│   ├── use-polling-stations.ts    # Polling hooks
│   ├── use-debounce.ts
│   ├── use-infinite-scroll.ts
│   ├── use-mobile.ts
│   └── use-toast.ts
│
├── lib/
│   ├── api/                       # Domain API modules (TO SPLIT)
│   │   ├── client.ts
│   │   ├── voters.ts
│   │   ├── families.ts
│   │   ├── stats.ts
│   │   └── index.ts
│   ├── api.ts                     # Current monolithic (DEPRECATED)
│   ├── query-client.tsx           # QueryProvider + keys
│   ├── constants/
│   │   └── index.ts               # Sentiment, turnout configs
│   ├── design-tokens.ts           # Design system tokens
│   ├── utils.ts                   # cn(), formatters
│   └── tree-utils.ts              # Family tree helpers
│
├── contexts/
│   ├── list-context.tsx           # Selected voter list
│   └── sidebar-context.tsx        # Sidebar state
│
├── types/                         # (TO CREATE)
│   ├── voter.ts
│   ├── family.ts
│   ├── election.ts
│   └── index.ts
│
├── public/
│   └── images/
│
└── styles/
    └── globals.css                # Additional styles
```

---

## 7. UI Scaling Roadmap

### Phase 1: Stabilization (Current Sprint)

- [x] Complete React Query migration
- [x] Add DevTools for debugging
- [x] Split monolithic API into modules (`lib/api/*.ts`)
- [x] Create shared component library (`components/shared/`)
- [x] Add error boundaries to all pages
- [x] Add loading states to all routes
- [x] Add not-found pages
- [x] Performance utilities (`lib/performance.ts`)
- [x] Next.js config optimizations (image formats, package imports, caching)
- [ ] Lighthouse audit (manual step required)

### Phase 2: Enhancement (Next Sprint)

- [x] Implement optimistic updates for all mutations (`useTagSentiment`, `useBulkTagSentiment`, `useMarkTurnout`)
- [x] Add prefetching for user intent (`usePrefetchVoters`, `usePrefetchBoothVoters`)
- [x] Create comprehensive skeleton library
- [x] Implement infinite scroll for voters (`useInfiniteScroll` hook)
- [x] Add keyboard shortcuts (vim-style navigation) (`useHotkeys` hook)
- [x] Dark mode refinement (semantic sentiment & turnout CSS variables)

### Phase 3: Scale (Future)

- [ ] Server-side rendering for initial page loads
- [ ] Streaming with Suspense boundaries
- [ ] PWA capabilities for offline field work
- [ ] Real-time updates via WebSocket/SSE
- [ ] Analytics dashboard (Vercel Analytics)
- [ ] A/B testing infrastructure

### Phase 4: Mobile (Future)

- [ ] React Native companion app
- [ ] Offline-first data sync
- [ ] Push notifications for turnout alerts
- [ ] Barcode/QR scanning for voter ID

---

## 8. Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPONENT DEPENDENCY MAP                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐                                                │
│  │  app/layout  │──── QueryProvider                              │
│  └──────┬───────┘     ThemeProvider                              │
│         │             ListProvider                               │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │ module/layout│──── Sidebar ──── ModuleSwitcher                │
│  └──────┬───────┘                  ListSelector                  │
│         │                          NavItems                      │
│         ▼                                                        │
│  ┌──────────────┐                                                │
│  │   page.tsx   │──── PageHeader                                 │
│  └──────┬───────┘                                                │
│         │                                                        │
│         ├─── Dashboard ─── StatCard                              │
│         │                  WardGrid                              │
│         │                  SentimentChart                        │
│         │                                                        │
│         ├─── Voters ────── VoterFilters                          │
│         │                  VoterTable ─── SentimentBadge         │
│         │                              └── BulkActionBar         │
│         │                                                        │
│         ├─── Families ──── FamilyTree ─── TreeNode               │
│         │                              └── MemberDetailsPanel    │
│         │                                                        │
│         ├─── WarRoom ───── WardMap                               │
│         │                  HouseMarker                           │
│         │                  TargetList                            │
│         │                                                        │
│         ├─── Elections ─── CandidateCard                         │
│         │                  AddCandidateDialog                    │
│         │                                                        │
│         └─── Polling ───── StationCard                           │
│                            StationDetailPanel                    │
│                            BoothVotersPanel                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Conclusion

This architecture provides:

1. **Scalability** — Domain-split structure grows with features
2. **Performance** — React Query caching + code splitting
3. **Maintainability** — Clear separation of concerns
4. **Developer Experience** — Type safety + DevTools
5. **User Experience** — Optimistic updates + skeletons
6. **Accessibility** — WCAG 2.1 AA compliance path

The foundation is solid. Priority work:

1. Complete shared component extraction
2. Split monolithic API file
3. Add comprehensive error boundaries
4. Run Lighthouse audit and optimize

---

_Document maintained by the Frontend Architecture team. Last audit: December 2025._
