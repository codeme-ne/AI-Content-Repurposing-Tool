---
status: pending
priority: p3
issue_id: "014"
tags: [code-review, quality, cleanup]
dependencies: []
---

# P3: Cleanup Artifacts and Minor Inconsistencies

## Problem Statement

Several leftover artifacts and minor inconsistencies reduce codebase clarity:

1. **`supabase/` directory** still present despite migration to Appwrite being complete
2. **`lib/` vs `libs/` split** — two utility directories with no clear boundary
3. **`logs/` directory** in project root, not in `.gitignore`
4. **Backward-compat Claude aliases** in `api-client.ts` (migration complete)
5. **`EnhancedTest.tsx`** in pages directory (covered by dead code removal 003)
6. **Stripe API version mismatch** — hardcoded in checkout/webhook, missing in portal
7. **CORS `x-api-key` header** allowed but unused
8. **OpenTelemetry packages** in `dependencies` instead of `devDependencies`
9. **`zod` installed but never imported**

## Findings

- **Source:** Architecture Strategist (P3-1 through P3-8) + Security Sentinel (P3-07) + Code Simplicity (P3)

## Proposed Solutions

### Option A: Batch cleanup (Recommended)
- Remove `supabase/` directory
- Consolidate `lib/` and `libs/` into `src/lib/`
- Add `logs/` to `.gitignore`
- Remove Claude aliases from `api-client.ts`
- Centralize Stripe initialization with consistent API version
- Remove `x-api-key` from CORS allowed headers
- Move OTel packages to `devDependencies`
- Remove `zod` dependency (or start using it per 009)
- **Effort:** Small (1-2 hours) | **Risk:** Low

## Acceptance Criteria

- [ ] No leftover migration artifacts
- [ ] Single utility directory convention
- [ ] Build passes, tests pass

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Multiple agents |
