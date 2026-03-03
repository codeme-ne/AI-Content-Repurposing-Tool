---
status: pending
priority: p2
issue_id: "009"
tags: [code-review, architecture]
dependencies: []
---

# P2: Architecture Consistency Issues (Zod, CORS, env, useAuth)

## Problem Statement

Multiple architecture inconsistencies reduce maintainability:
1. **No Zod validation at API boundaries** — Edge Functions use ad-hoc `typeof` checks despite Zod being installed
2. **Inconsistent CORS handling** — `extract.ts` uses manual headers instead of `createCorsResponse()`
3. **env-validation.ts duplicates app.config.ts** — Two files provide overlapping environment config
4. **useAuth name collision** — Two different `useAuth` exports from different modules
5. **import.meta.env scattered** — 20 files directly access env vars instead of centralized config
6. **DB_ID hardcoded in 2 places** — `social_transformer` string literal in client and server

## Findings

- **Source:** Architecture Strategist (P2-2 through P2-8) + Code Simplicity Reviewer
- **Locations:**
  - Zod: `api/openrouter/v1/chat.ts`, `api/extract.ts`, `api/stripe/create-checkout.ts`
  - CORS: `api/extract.ts` vs `api/utils/cors.ts`
  - Env: `src/lib/env-validation.ts` vs `src/config/app.config.ts`
  - useAuth: `src/hooks/useAuth.ts` vs `src/contexts/AuthContext.tsx`
  - DB_ID: `src/api/appwrite.ts:37` and `api/utils/appwrite.ts:3`

## Proposed Solutions

### Option A: Address each incrementally (Recommended)
1. Add Zod schemas to Edge Function request validation (integrate with `parseJsonSafely`)
2. Standardize `extract.ts` CORS to use `createCorsResponse()`
3. Consolidate env config (keep `app.config.ts` as owner, trim `env-validation.ts`)
4. Rename `src/hooks/useAuth.ts` export to `useAuthUI`
5. Funnel all `import.meta.env` through config module
6. Extract `DB_ID` to shared constants
- **Effort:** Medium (4-6 hours total) | **Risk:** Low

## Acceptance Criteria

- [ ] All Edge Functions use Zod schemas for request validation
- [ ] All non-webhook endpoints use `createCorsResponse()`
- [ ] Single canonical env config module
- [ ] No ambiguous `useAuth` imports
- [ ] No direct `import.meta.env` in components/hooks

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Architecture Strategist |
