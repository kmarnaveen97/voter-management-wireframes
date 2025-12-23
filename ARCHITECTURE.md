# Frontend Architecture: Voter Management Platform

## Recommended Folder Structure

```
/app                          # Next.js App Router
├── layout.tsx                # Root layout (fonts, theme)
├── page.tsx                  # Landing/redirect page
├── globals.css               # Global styles
│
├── /voters-management        # Main module (has its own layout)
│   ├── layout.tsx            # Module layout (sidebar, providers)
│   ├── page.tsx              # Dashboard
│   ├── /voters               # Voter list + search
│   ├── /families             # Family tree view
│   ├── /war-room             # Campaign command center
│   ├── /war-room-3d          # 3D visualization
│   ├── /elections            # Candidate management
│   ├── /compare              # List comparison
│   ├── /upload               # PDF extraction
│   ├── /voter-turnout        # Election day tracking
│   └── /polling-stations     # Booth management
│
├── /website-management       # Secondary module
│   ├── layout.tsx
│   └── page.tsx
│
└── /social-media-management  # Tertiary module
    └── page.tsx

/components                   # Shared component library
├── /ui                       # shadcn/ui primitives (button, card, etc.)
├── /voters                   # Voter domain components
│   ├── index.ts              # Barrel export
│   ├── sentiment-badge.tsx
│   ├── bulk-action-bar.tsx
│   ├── voter-card.tsx
│   └── voter-filters.tsx
├── /families                 # Family domain components
├── /elections                # Election domain components
├── /war-room                 # War room domain components
├── error-boundary.tsx        # Error handling
├── page-header.tsx           # Shared page header
├── sidebar.tsx               # Navigation sidebar
└── stat-card.tsx             # Dashboard stat cards

/lib                          # Core utilities
├── /api                      # Domain-split API modules
│   ├── client.ts             # Shared fetch wrapper + types
│   ├── voters.ts             # Voter API calls
│   ├── families.ts           # Family API calls
│   ├── stats.ts              # Stats/analytics API
│   ├── lists.ts              # Voter list management
│   └── index.ts              # Barrel export
├── query-client.tsx          # React Query provider + keys
├── design-tokens.ts          # Design system tokens
├── constants/                # App constants
│   └── index.ts              # Sentiment configs, etc.
├── utils.ts                  # General utilities (cn, etc.)
└── tree-utils.ts             # Family tree utilities

/hooks                        # Custom React hooks
├── use-queries.ts            # React Query hooks
├── use-debounce.ts
├── use-infinite-scroll.ts
├── use-mobile.ts
└── use-toast.ts

/contexts                     # React Context providers
├── list-context.tsx          # Selected voter list
└── sidebar-context.tsx       # Sidebar state

/types                        # Shared TypeScript types
└── index.ts                  # Global type definitions

/styles                       # Additional styles
└── globals.css               # Tailwind directives
```

## Architecture Decisions

### 1. App Router Structure

- **Route Groups**: Not used (simple enough hierarchy)
- **Parallel Routes**: Consider for war-room split views
- **Intercepting Routes**: Could use for voter detail modals

### 2. Component Division

| Type                 | Location                 | Rendering       |
| -------------------- | ------------------------ | --------------- |
| Layout shells        | `/app/**/layout.tsx`     | Server          |
| Static UI            | `/components/ui/*`       | Either          |
| Interactive features | `/components/[domain]/*` | Client          |
| Data-bound pages     | `/app/**/page.tsx`       | Client (mostly) |

### 3. State Management

```
Server State (React Query)
├── Voters, families, stats
├── Elections, candidates
├── Polling stations, booths
└── Turnout data

Client State (Context)
├── Selected list ID
├── Sidebar collapsed state
└── Theme preference

Local State (useState)
├── Form inputs
├── Modal open/close
├── Selection state
└── Filter values
```

### 4. Data Fetching Strategy

```tsx
// Pattern 1: Page-level queries (most common)
function VotersPage() {
  const { data, isLoading } = useVoters(page, filters);
  // ...
}

// Pattern 2: Prefetching on hover/focus
function VoterCard({ voterId }) {
  const prefetch = usePrefetchVoter();
  return <Card onMouseEnter={() => prefetch(voterId)}>...</Card>;
}

// Pattern 3: Optimistic mutations
const mutation = useMutation({
  mutationFn: tagSentiment,
  onMutate: async (newData) => {
    // Optimistically update cache
  },
  onError: (err, newData, context) => {
    // Rollback on error
  },
});
```

### 5. Performance Targets

| Metric | Target  | Strategy                     |
| ------ | ------- | ---------------------------- |
| LCP    | < 2.5s  | Server components, streaming |
| FID    | < 100ms | Code splitting, minimal JS   |
| CLS    | < 0.1   | Reserved space, skeleton UI  |
| TTI    | < 3.5s  | Progressive hydration        |

### 6. Accessibility Requirements

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactions
- Screen reader announcements for dynamic content
- Focus management in modals/dialogs
- Color contrast ratios maintained

## Migration Checklist

- [x] Install React Query
- [x] Create QueryProvider
- [x] Create query keys factory
- [x] Migrate ListContext
- [x] Create shared hooks
- [x] Migrate dashboard page
- [x] Create domain components
- [x] Split API into modules
- [x] Migrate voters page (full)
- [x] Migrate families page
- [x] Migrate war-room page
- [x] Migrate polling-stations page
- [x] Migrate compare page
- [x] Migrate elections page
- [x] Migrate voter-turnout page
- [x] Add React Query DevTools
- [ ] Add error boundaries
- [ ] Add optimistic updates
- [ ] Add prefetching
- [ ] Performance audit

```

```
