# Workflow Type Normalization Implementation Plan

**Goal:** Centralize all workflow step type mappings into a single dictionary so that all 19 templates preview and render correctly across editor, builder canvas, preview modal, and preview page.

**Architecture:** Create a shared `lib/workflow-type-map.ts` module that provides: (1) a canonical type enum, (2) a mapping from all ~30 variant type strings to canonical categories, (3) an icon map, and (4) a helper to normalize options. Then refactor 5 consumer files to import from this single source of truth instead of maintaining their own incomplete maps.

---

## Task 1: Create `lib/workflow-type-map.ts`
## Task 2: Update `builder-context.tsx` to use shared types
## Task 3: Update `workflow-preview-modal.tsx` to use shared mapping
## Task 4: Update `builder-canvas.tsx` to use shared mapping
## Task 5: Update `preview-client.tsx` to use shared mapping
## Task 6: Fix `page.tsx` normalization — flatten `extraAttributes`
## Task 7: Fix `templates/index.ts` normalization
## Task 8: Expand `lib/types/workflow.ts` canonical types
## Task 9: Update `property-editor.tsx`
## Task 10: Final verification (build + lint)
