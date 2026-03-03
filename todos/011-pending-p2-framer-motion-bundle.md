---
status: pending
priority: p2
issue_id: "011"
tags: [code-review, performance]
dependencies: []
---

# P2: framer-motion Adds ~45KB gzipped for One Animation Component

## Problem Statement

`framer-motion` is imported for a single component (`FlyingSaveCard.tsx`, 68 lines) that performs a simple spring animation from point A to point B with scale/opacity. The full library adds ~45KB gzipped to the GeneratorV2 chunk (the largest at 228KB / 75KB gzipped).

## Findings

- **Source:** Performance Oracle (P2-1)
- **Location:** `src/components/animations/FlyingSaveCard.tsx`, build output shows `GeneratorV2-B3BikvWa.js 227.70 kB | gzip: 74.68 kB`
- **Evidence:** The animation is a positional spring motion with opacity/scale — achievable with CSS `@keyframes` + `cubic-bezier()`

## Proposed Solutions

### Option A: Replace with CSS animation (Recommended)
- Use CSS `@keyframes` + `cubic-bezier()` for the fly-to effect
- Remove `framer-motion` dependency entirely
- **Effort:** Medium (1-2 hours) | **Risk:** Low (visual parity may need tuning)

### Option B: Lazy-load FlyingSaveCard
- `React.lazy(() => import('./FlyingSaveCard'))` since it only renders during save
- **Effort:** Small (15 min) | **Risk:** Low

## Acceptance Criteria

- [ ] FlyingSaveCard animation visually equivalent
- [ ] GeneratorV2 chunk reduced by ~45KB gzipped
- [ ] `framer-motion` removed from package.json (Option A) or lazy-loaded (Option B)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Performance Oracle |
