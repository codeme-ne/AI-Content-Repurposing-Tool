---
status: pending
priority: p1
issue_id: "006"
tags: [code-review, performance]
dependencies: []
---

# P1: useMemo Dependencies Cause Full Re-render Cascades on Every Keystroke

## Problem Statement

In `GeneratorV2.tsx`, both `InputArea` and `OutputArea` are wrapped in `useMemo` for performance, but include the `actions` object as a dependency. The `actions` object from `usePostGeneratorState` is recreated on every state change, meaning both memoized areas re-render on every keystroke — completely defeating the purpose of `useMemo`.

## Findings

- **Source:** Performance Oracle (P1-3)
- **Location:** `src/pages/GeneratorV2.tsx` lines 243-277 (InputArea), 280-372 (OutputArea)
- **Evidence:** `OutputArea` has 14 dependencies. `actions` is the entire action creators object, recreated on every reducer dispatch. Every keystroke triggers `SET_INPUT_TEXT` → state change → new `actions` → invalidates both memoized areas.

## Proposed Solutions

### Option A: Memoize `actions` object in `usePostGeneratorState` (Recommended)
- All action creators are already individually wrapped in `useCallback` with `[]` deps
- Wrap the returned `actions` object in `useMemo` to maintain reference stability
- **Effort:** Small (30 min)
- **Risk:** Low

### Option B: Destructure individual actions in GeneratorV2
- Instead of passing `actions` as a single dep, destructure and pass only used actions
- **Effort:** Medium (1 hour)
- **Risk:** Low

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `src/hooks/usePostGeneratorState.ts` — wrap actions in `useMemo`
- `src/pages/GeneratorV2.tsx` — verify memoization works after fix

## Acceptance Criteria

- [ ] `actions` reference is stable across state changes
- [ ] InputArea and OutputArea only re-render when their actual data changes
- [ ] No functional regressions

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Performance Oracle |
