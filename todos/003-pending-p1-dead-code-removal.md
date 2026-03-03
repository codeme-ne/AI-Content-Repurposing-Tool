---
status: pending
priority: p1
issue_id: "003"
tags: [code-review, quality, simplicity]
dependencies: []
---

# P1: Remove ~3,350 Lines of Dead Code (~18% of Codebase)

## Problem Statement

The codebase contains ~3,350 lines of completely unreachable, unused, or over-engineered code across 25+ files. This includes an entire parallel "enhanced" generation pipeline (1,213 lines) that was never routed, a full feature flag system (280 lines) that resolves to a constant `true`, a performance monitoring system (321 lines) that sends to nonexistent analytics, and numerous unused hooks and utilities.

## Findings

- **Source:** Code Simplicity Reviewer (primary) + Architecture Strategist (confirming)
- **Key dead code clusters:**

### Phase 1 — Unreachable enhanced generation system (~1,213 lines)
| File | Lines | Reason |
|------|-------|--------|
| `src/hooks/useEnhancedContentGeneration.ts` | 322 | Never routed |
| `src/api/claude-enhanced.ts` | 142 | Never routed |
| `src/libs/promptBuilder.v2.ts` | 313 | Never routed |
| `src/components/enhanced/EnhancedGenerator.tsx` | 327 | Never routed |
| `src/pages/EnhancedTest.tsx` | 109 | Never routed |

### Phase 1 — Infrastructure without backends (~758 lines)
| File | Lines | Reason |
|------|-------|--------|
| `src/hooks/useFeatureFlag.ts` | ~280 | Only call is `useFeatureFlag('NEW_UX', {rolloutPercentage: 100})` = constant `true` |
| `src/utils/performance.ts` | 321 | Sends to nonexistent `window.analytics`/`window.gtag` |
| `src/utils/errorHandler.ts` | 157 | Zero imports anywhere |

### Phase 1 — Duplicate config (~200 lines)
| File | Lines | Reason |
|------|-------|--------|
| `src/lib/env-validation.ts` | ~200 removable | ~85% unused, duplicates `app.config.ts` |

### Phase 2 — Dead hooks and components (~555 lines)
| File | Lines | Reason |
|------|-------|--------|
| `src/hooks/useUsageTracking.ts` | 124 | Redundant wrapper, return values discarded |
| `src/hooks/usePostEditing.ts` | 35 | Zero imports |
| `src/hooks/useDebounce.ts` | 17 | Zero imports |
| `src/hooks/useIntersectionObserver.ts` | 53 | Zero imports |
| `src/hooks/use-toast.ts` | 7 | Deprecated tombstone |
| `src/components/optimized/MemoizedCard.tsx` | 38 | Zero imports |
| `src/libs/stripe.ts` | 215 | Server-side code in client bundle, zero imports |
| 6 skeleton components in SkeletonLoaders.tsx | ~115 | Zero consumers |

### Phase 2 — Unused design system tokens (~411 lines)
| File | Lines | Reason |
|------|-------|--------|
| `src/design-system/tokens/spacing.ts` | 91 | Zero imports |
| `src/design-system/tokens/typography.ts` | 99 | Zero imports |
| `src/design-system/tokens/colors.ts` | 100 | Zero imports |
| `src/design-system/typography-hierarchy.ts` | 121 | Zero imports |

### Phase 3 — Minor cleanup (~100 lines)
- Backward-compat Claude aliases in `api-client.ts` (6 lines)
- Unused HTTP methods (`put`, `del`, `patch`) in `ApiClient` (25 lines)
- LinkedIn draft API in `src/api/linkedin.ts` (85 lines, feature disabled)
- `api/test-email.ts` (67 lines, dev utility in production)
- Unused `zod` dependency in package.json

## Proposed Solutions

### Option A: Phased removal (Recommended)
- Phase 1: Remove enhanced pipeline + infrastructure (2,171 lines) — highest impact, no consumers
- Phase 2: Remove dead hooks, components, tokens (966 lines)
- Phase 3: Minor cleanup (~100 lines)
- **Effort:** Medium (2-3 hours total)
- **Risk:** Low — all items have zero consumers

### Option B: Big-bang removal
- Remove all dead code in one commit
- **Effort:** Small (1-2 hours)
- **Risk:** Medium — harder to bisect if something breaks

## Recommended Action

<!-- Filled during triage -->

## Acceptance Criteria

- [ ] Build passes after each phase
- [ ] Tests pass after each phase
- [ ] No broken imports (grep for removed exports)
- [ ] Total lines removed matches estimate (~3,350)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Code Simplicity Reviewer |

## Resources

- Code Simplicity Reviewer full report (detailed per-file analysis)
