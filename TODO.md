# Implementation Todos

## Issue 2: Search Ignores Selected List

**Problem**: When searching voters, the search queries ALL lists instead of the currently selected list.
**Location**: `app/voters/page.tsx` line 74-77

### Tasks:

- [x] 2.1 Pass `selectedListId` to `api.searchVoters()` in voters page
- [x] 2.2 Verify the API accepts and uses `list_id` parameter (already does)
- [x] 2.3 Add visual indicator showing "Searching in [List Name]"

---

## Issue 3: List Discovery is Broken (Max 10 Lists)

**Problem**: `getVoterLists()` probes list_ids 1-10 only. Campaign with 11+ lists won't see them all.
**Location**: `lib/api.ts` line 428-456

### Tasks:

- [x] 3.1 Add proper `/api/lists` endpoint call first (if backend supports it)
- [x] 3.2 If not, increase probe range to 100 with batching
- [x] 3.3 Add caching to avoid re-probing on every page load
- [x] 3.4 Show loading indicator during list discovery

---

## Issue 6: Family Search Loads 1000 Families

**Problem**: `searchFamily()` loads 1000 families then filters client-side. Extremely wasteful.
**Location**: `lib/api.ts` line 686-696

### Tasks:

- [x] 6.1 Use the existing `getFamilyMembers()` API which takes ward_no + house_no directly
- [x] 6.2 Remove the wasteful 1000-family fetch pattern
- [x] 6.3 Add proper error handling if family not found

---

## Issue: No Bulk Operations UI

**Problem**: Can select voters but bulk actions are limited. No batch assignment, export, etc.

### Tasks:

- [x] B.1 Add "Select All on Page" vs "Select All Matching" distinction
- [x] B.2 Add bulk action dropdown with more options (export CSV, print list, assign to worker)
- [x] B.3 Show selection count prominently
- [x] B.4 Add keyboard shortcut hints for bulk tagging (already partial)

---

## Issue 15: No Quick Actions

**Problem**: Tagging a voter requires too many clicks. Need one-click tagging.

### Tasks:

- [x] 15.1 Add inline sentiment buttons on voter table rows (hover to reveal)
- [x] 15.2 Add quick-tag dropdown that appears on row hover
- [x] 15.3 Support keyboard shortcuts in table (arrow keys to navigate, 1-4 to tag)

---

## Issue 18: No Loading States in War Room

**Problem**: Clicking house/ward shows no feedback while data loads.
**Location**: `app/war-room/page.tsx`

### Tasks:

- [x] 18.1 Add loading spinner when house dialog opens
- [x] 18.2 Add loading overlay when tagging sentiment
- [x] 18.3 Add skeleton loading for ward panel when switching wards
- [x] 18.4 Disable buttons during API calls to prevent double-clicks

---

## Implementation Order:

1. ✅ Issue 2 (Search scope) - Quick fix, high impact
2. ✅ Issue 6 (Family search) - Quick fix, performance win
3. ✅ Issue 3 (List discovery) - Medium effort, essential for scale
4. ✅ Issue 18 (War room loading) - UX improvement
5. ✅ Issue 15 (Quick actions) - UX improvement
6. ✅ Bulk operations - Feature enhancement
