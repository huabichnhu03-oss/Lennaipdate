# Drag-and-Drop Reorder Update

## Changed Files

### `artifacts/lenna-portfolio/src/pages/admin-sortable.tsx` (NEW)
Reusable `AdminSortableList<T>` component built on @dnd-kit/core + @dnd-kit/sortable.
Renders a 6-dot grip handle on each row via a `renderItem` render-prop.
Supports PointerSensor (desktop, distance=5px) and TouchSensor (tablet/mobile, 200ms delay).
Fires `onReorder(newArray)` after drop using `arrayMove`.

### `artifacts/lenna-portfolio/src/pages/admin.tsx` (MODIFIED)
- Added import for `AdminSortableList` from `./admin-sortable`.
- **Projects tab**: sidebar wrapped with `AdminSortableList`; selectedIdx tracks item by ID.
- **Experience tab**: same pattern for experience sidebar list.
- **Education tab**: full-width cards wrapped; grip handle in card header next to entry label.
- **Studio/Gallery tab**: each kind group (Big Projects, Artworks) has its own sortable context.
  After drop, items are slotted back at their original kind-group positions.
  Gallery sidebar uses array position order (vestigial `order` field no longer drives display).

### `artifacts/lenna-portfolio/src/pages/studio.tsx` (MODIFIED)
Removed `.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))` from both `bigItems`
and `smallItems`. Public Studio page now renders in array order, matching admin drag order.

### `artifacts/lenna-portfolio/package.json` (MODIFIED)
Added: `@dnd-kit/core ^6.3.1`, `@dnd-kit/sortable ^10.0.0`, `@dnd-kit/utilities ^3.2.2`.

### `pnpm-lock.yaml` (MODIFIED)
Updated lockfile to include the new @dnd-kit packages.

## How to Apply
1. Copy all files into your repo preserving folder structure.
2. Run `pnpm install` to install the new @dnd-kit packages.
3. No backend changes needed — Save to Site sends array order as-is.
