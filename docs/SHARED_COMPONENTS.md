# Shared Components Usage Guide

This guide shows how to use the shared component library to maintain consistent UI patterns across pages.

## Quick Start

```tsx
import {
  // Layout & State
  PageLoadingSkeleton,
  QueryErrorState,
  DataPageLayout,

  // Error Boundaries
  PageErrorBoundary,
  WidgetErrorBoundary,

  // Data Display
  EnhancedStatCard,

  // Table Components
  DataTableToolbar,
  PaginationControls,

  // Filter & Selection
  FilterChips,
  BulkActionBar,
} from "@/components/shared";
```

---

## 1. DataPageLayout

The simplest way to handle loading/error/success states:

```tsx
import { DataPageLayout } from "@/components/shared";
import { useQuery } from "@tanstack/react-query";

export default function VotersPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["voters"],
    queryFn: fetchVoters,
  });

  return (
    <DataPageLayout
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      loadingVariant="table"
    >
      {/* Your content here - only renders when data is ready */}
      <VoterTable voters={data} />
    </DataPageLayout>
  );
}
```

### Props

| Prop             | Type                                                      | Default   | Description            |
| ---------------- | --------------------------------------------------------- | --------- | ---------------------- |
| `isLoading`      | `boolean`                                                 | `false`   | Shows loading skeleton |
| `error`          | `Error \| null`                                           | `null`    | Shows error state      |
| `onRetry`        | `() => void`                                              | -         | Retry callback         |
| `loadingVariant` | `"dashboard" \| "table" \| "cards" \| "detail" \| "form"` | `"table"` | Skeleton layout        |

---

## 2. PageLoadingSkeleton

Use directly when you need more control over the skeleton:

```tsx
import { PageLoadingSkeleton } from "@/components/shared";

// Dashboard skeleton (stat cards + content)
<PageLoadingSkeleton variant="dashboard" statsCount={4} />

// Table skeleton (toolbar + rows)
<PageLoadingSkeleton variant="table" rowCount={10} />

// Card grid skeleton
<PageLoadingSkeleton variant="cards" cardCount={9} />

// Detail page (sidebar + main)
<PageLoadingSkeleton variant="detail" />
```

---

## 3. QueryErrorState

Flexible error display with multiple variants:

```tsx
import { QueryErrorState } from "@/components/shared";

// Full page error (for page-level failures)
<QueryErrorState
  error={error}
  variant="full-page"
  onRetry={refetch}
  showHomeLink
/>

// Inline alert (for section errors)
<QueryErrorState
  error={error}
  variant="inline"
  onRetry={refetch}
/>

// Card error (for widgets)
<QueryErrorState
  error={error}
  variant="card"
  title="Stats unavailable"
/>

// Centered error (for empty containers)
<QueryErrorState
  error={error}
  variant="centered"
/>
```

---

## 4. Error Boundaries

Wrap pages and widgets to catch React errors:

```tsx
import { PageErrorBoundary, WidgetErrorBoundary } from "@/components/shared";

// In layout.tsx - catches all page errors
<PageErrorBoundary pageName="Voters">
  {children}
</PageErrorBoundary>

// Around individual widgets - fails gracefully
<WidgetErrorBoundary widgetName="Stats">
  <StatsWidget />
</WidgetErrorBoundary>
```

---

## 5. EnhancedStatCard

Unified stat card with trends, percentages, and links:

```tsx
import { EnhancedStatCard } from "@/components/shared";
import { Users, TrendingUp } from "lucide-react";

// Basic usage
<EnhancedStatCard
  icon={Users}
  title="Total Voters"
  value={45000}
  description="12 wards"
/>

// With link (clickable card)
<EnhancedStatCard
  icon={Users}
  title="Total Voters"
  value={45000}
  href="/voters-management/voters"
/>

// With trend indicator
<EnhancedStatCard
  icon={TrendingUp}
  title="Support"
  value={12500}
  trend={{ value: 5.2, direction: "up", label: "vs last week" }}
/>

// With progress bar
<EnhancedStatCard
  icon={Users}
  title="Tagged"
  value={30000}
  percentage={{ value: 30000, total: 45000, showBar: true }}
/>

// Size variants
<EnhancedStatCard variant="compact" ... />
<EnhancedStatCard variant="large" ... />
```

---

## 6. DataTableToolbar

Unified toolbar for data tables:

```tsx
import { DataTableToolbar } from "@/components/shared";
import { Select } from "@/components/ui/select";

<DataTableToolbar
  // Search
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Search voters..."

  // Standard actions
  onRefresh={refetch}
  onExport={handleExport}
  isRefreshing={isFetching}

  // Filter slot (your custom filters)
  filtersSlot={
    <Select value={ward} onValueChange={setWard}>
      ...
    </Select>
  }

  // Actions slot (additional buttons)
  actionsSlot={
    <Button onClick={...}>Add New</Button>
  }

  // Overflow menu
  menuItems={[
    { label: "Import", icon: Upload, onClick: handleImport },
    { label: "Delete All", icon: Trash, onClick: handleDelete, destructive: true },
  ]}
/>
```

---

## 7. PaginationControls

Full-featured pagination:

```tsx
import { PaginationControls } from "@/components/shared";

// Full controls (page size + input + navigation)
<PaginationControls
  currentPage={page}
  totalPages={Math.ceil(total / pageSize)}
  totalItems={total}
  pageSize={pageSize}
  onPageChange={setPage}
  onPageSizeChange={setPageSize}
  itemLabel="voters"
/>

// Simple variant (just prev/next)
<PaginationControls
  variant="simple"
  ...
/>

// Compact variant (minimal)
<PaginationControls
  variant="compact"
  ...
/>
```

---

## 8. FilterChips

Show active filters as removable badges:

```tsx
import { FilterChips } from "@/components/shared";

const filters = [
  { key: "ward", label: "Ward", value: "5", onRemove: () => setWard(null) },
  {
    key: "gender",
    label: "Gender",
    value: "Male",
    onRemove: () => setGender(null),
  },
];

<FilterChips
  filters={filters}
  onClearAll={() => resetAllFilters()}
  maxVisible={3} // Shows "+N more" after 3
/>;
```

---

## 9. BulkActionBar

Floating action bar for selections:

```tsx
import { BulkActionBar } from "@/components/shared";
import { ThumbsUp, ThumbsDown, Trash } from "lucide-react";

{
  selectedIds.size > 0 && (
    <BulkActionBar
      selectedCount={selectedIds.size}
      onClearSelection={() => setSelectedIds(new Set())}
      itemLabel="voters"
      isLoading={isMutating}
      // Primary actions (buttons)
      actions={[
        { label: "Support", icon: ThumbsUp, onClick: () => bulkTag("support") },
        { label: "Oppose", icon: ThumbsDown, onClick: () => bulkTag("oppose") },
      ]}
      // Secondary actions (dropdown)
      dropdownActions={[
        {
          label: "Delete",
          icon: Trash,
          onClick: handleDelete,
          variant: "destructive",
        },
      ]}
    />
  );
}
```

---

## Complete Page Example

```tsx
"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  DataPageLayout,
  DataTableToolbar,
  PaginationControls,
  FilterChips,
  BulkActionBar,
  EnhancedStatCard,
} from "@/components/shared";
import { Users, ThumbsUp, ThumbsDown } from "lucide-react";

export default function VotersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [ward, setWard] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState(new Set<number>());

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["voters", { page, search, ward }],
    queryFn: () => fetchVoters({ page, search, ward }),
  });

  const filters = ward
    ? [
        {
          key: "ward",
          label: "Ward",
          value: ward,
          onRemove: () => setWard(null),
        },
      ]
    : [];

  return (
    <DataPageLayout
      isLoading={isLoading}
      error={error}
      onRetry={refetch}
      loadingVariant="table"
    >
      <div className="p-6 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <EnhancedStatCard icon={Users} title="Total" value={data.total} />
          <EnhancedStatCard
            icon={ThumbsUp}
            title="Support"
            value={data.supportCount}
          />
          ...
        </div>

        {/* Toolbar */}
        <DataTableToolbar
          searchValue={search}
          onSearchChange={setSearch}
          onRefresh={refetch}
          isRefreshing={isFetching}
        />

        {/* Active filters */}
        <FilterChips filters={filters} />

        {/* Table */}
        <VoterTable
          voters={data.voters}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />

        {/* Pagination */}
        <PaginationControls
          currentPage={page}
          totalPages={data.totalPages}
          totalItems={data.total}
          pageSize={25}
          onPageChange={setPage}
          itemLabel="voters"
        />

        {/* Bulk actions */}
        <BulkActionBar
          selectedCount={selectedIds.size}
          onClearSelection={() => setSelectedIds(new Set())}
          actions={[
            { label: "Tag Support", onClick: () => bulkTag("support") },
          ]}
        />
      </div>
    </DataPageLayout>
  );
}
```

---

## Migration Checklist

When updating existing pages:

1. ✅ Replace custom loading skeletons with `PageLoadingSkeleton`
2. ✅ Replace inline error alerts with `QueryErrorState`
3. ✅ Wrap page content in `DataPageLayout` for unified state handling
4. ✅ Replace custom stat cards with `EnhancedStatCard`
5. ✅ Replace search/filter/action headers with `DataTableToolbar`
6. ✅ Replace custom pagination with `PaginationControls`
7. ✅ Add `FilterChips` for active filter display
8. ✅ Use `BulkActionBar` for selection actions

---

## File Locations

```
components/shared/
├── index.ts                    # Barrel exports
├── page-loading-skeleton.tsx   # Loading states
├── query-error-state.tsx       # Error states
├── data-page-layout.tsx        # Combined loader/error/content
├── error-boundary.tsx          # React error boundaries
├── enhanced-stat-card.tsx      # Stat display cards
├── data-table-toolbar.tsx      # Search/filter/action toolbar
├── pagination-controls.tsx     # Full pagination
├── filter-chips.tsx            # Active filter badges
└── bulk-action-bar.tsx         # Selection action bar
```
