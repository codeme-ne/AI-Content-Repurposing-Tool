---
status: pending
priority: p1
issue_id: "004"
tags: [code-review, architecture, security]
dependencies: []
---

# P1: Dual Usage Tracking — Client vs Server Race Condition

## Problem Statement

Free-tier usage is tracked in two places with no synchronization:
1. **Client-side**: `localStorage` with key `usage_YYYY-MM-DD` (in `useSubscription.ts`)
2. **Server-side**: Appwrite `generation_usage` collection (in `chat.ts`)

The client check happens before the API call, but the server also independently checks. Users can bypass client-side limits by clearing localStorage. If the server write fails silently (`.catch(() => {})`), usage is consumed client-side but never recorded server-side, allowing drift.

## Findings

- **Source:** Architecture Strategist (P1-2) + Security Sentinel (P3-02) + Performance Oracle (P1-4 related)
- **Location:** `src/hooks/useSubscription.ts` lines 138-188, `api/openrouter/v1/chat.ts` lines 137-151 and 293-298
- **Evidence:** Server-side write uses `.catch(() => { /* non-critical */ })` — silent failure. Client-side uses `localStorage` — trivially manipulable.

## Proposed Solutions

### Option A: Server-side SSOT with client UI hint (Recommended)
- Make server the single source of truth for usage counting
- Return `{ remaining: number }` in API response
- Client localStorage becomes a display-only cache, updated from server response
- **Pros:** Tamper-proof, single source of truth, consistent
- **Cons:** Requires API response format change
- **Effort:** Medium (2-3 hours)
- **Risk:** Low

### Option B: Remove client-side tracking entirely
- Only check server-side; fetch count on page load
- **Pros:** Simplest; eliminates drift entirely
- **Cons:** Requires server round-trip to show remaining count
- **Effort:** Medium (2-3 hours)
- **Risk:** Low

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `api/openrouter/v1/chat.ts` — return remaining usage in response
- `src/hooks/useSubscription.ts` — remove localStorage-based counting, use server response
- `src/hooks/useContentGeneration.ts` — read remaining from API response

## Acceptance Criteria

- [ ] Server-side usage count is authoritative
- [ ] API response includes remaining generation count
- [ ] Clearing localStorage does not reset usage
- [ ] Free-tier limit still enforced correctly

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Cross-cutting finding from 3 agents |
