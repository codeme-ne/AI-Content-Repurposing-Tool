---
status: pending
priority: p1
issue_id: "001"
tags: [code-review, security]
dependencies: []
---

# P1: File Extraction Endpoint Has No Authentication

## Problem Statement

The `api/extract-file.ts` endpoint accepts file uploads (PDF, DOCX, images, audio) up to 20MB with **zero authentication**. Unlike `api/extract.ts` which verifies JWT tokens and applies rate limiting, this endpoint is completely open. Any attacker can upload arbitrary files and consume Unstructured API and Deepgram API quotas, potentially causing denial-of-wallet attacks.

## Findings

- **Source:** Security Sentinel + Agent-Native Reviewer (convergent finding)
- **Location:** `api/extract-file.ts` lines 122-189
- **Evidence:** The handler function has no `Authorization` header check, no `verifyJWT()` call, and no `checkRateLimit()` call. Compare with `api/extract.ts` which does both.
- **Impact:** Unlimited abuse of third-party API quotas (Unstructured, Deepgram), potential denial-of-wallet

## Proposed Solutions

### Option A: Add JWT auth + rate limiting (matching extract.ts pattern)
- **Pros:** Consistent with existing patterns, reuses `verifyJWT()` and `checkRateLimit()` utilities
- **Cons:** None significant
- **Effort:** Small (30 min)
- **Risk:** Low

### Option B: Add API key auth for non-interactive access
- **Pros:** Supports agent/automated use cases
- **Cons:** Requires new auth mechanism, more complex
- **Effort:** Medium (2-4 hours)
- **Risk:** Medium

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `api/extract-file.ts` — add auth check at handler entry
- `api/utils/appwrite.ts` — already has `verifyJWT()` utility
- `api/utils/rateLimit.ts` — already has `checkRateLimit()` utility

## Acceptance Criteria

- [ ] `extract-file.ts` requires valid JWT Bearer token
- [ ] Rate limiting applied (e.g., 10 req/min per IP)
- [ ] Unauthenticated requests return 401
- [ ] Existing authenticated extract flows still work

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Security Sentinel |

## Resources

- `api/extract.ts` — reference implementation for auth pattern
- `api/utils/appwrite.ts` — `verifyJWT()` utility
