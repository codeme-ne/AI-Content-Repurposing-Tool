---
status: pending
priority: p2
issue_id: "008"
tags: [code-review, security, reliability]
dependencies: []
---

# P2: Webhook Processing Continues After Idempotency Check Failure

## Problem Statement

When the idempotency document creation fails for reasons other than a duplicate (e.g., Appwrite connectivity error), the webhook processing continues instead of returning 500. During database outages, webhook events could be processed multiple times.

## Findings

- **Source:** Security Sentinel (P2-05)
- **Location:** `api/stripe-webhook-simplified.ts` lines 86-97
- **Evidence:** The catch block only checks for `code === 409` (duplicate), then falls through to event processing on any other error.
- **Fix:** Return 500 on non-duplicate errors so Stripe retries later.

## Proposed Solutions

### Option A: Return 500 on non-duplicate idempotency errors (Recommended)
- Add `return new Response('Idempotency check failed', { status: 500 })` after the console.error
- **Effort:** Small (10 min) | **Risk:** Low

## Acceptance Criteria

- [ ] Non-duplicate DB errors return 500
- [ ] Stripe retries the webhook later
- [ ] Duplicate webhooks still handled correctly (409 → 200)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Security Sentinel |
