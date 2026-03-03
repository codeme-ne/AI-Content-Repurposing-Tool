---
status: pending
priority: p2
issue_id: "007"
tags: [code-review, security]
dependencies: []
---

# P2: Stripe Checkout priceId Not Validated Server-Side

## Problem Statement

The `priceId` from the client is passed directly to `stripe.checkout.sessions.create()` without validation against known price IDs. An attacker could substitute a different valid Stripe price ID to get a subscription at a manipulated price. The webhook handler has anomaly detection for unknown prices, but that is reactive, not preventive.

## Findings

- **Source:** Security Sentinel (P2-01)
- **Location:** `api/stripe/create-checkout.ts` lines 66-111
- **Fix:** Add allowlist: `const ALLOWED_PRICE_IDS = [process.env.STRIPE_MONTHLY_PRICE_ID, process.env.STRIPE_YEARLY_PRICE_ID].filter(Boolean)`

## Proposed Solutions

### Option A: Server-side allowlist (Recommended)
- Validate priceId against env var allowlist before creating session
- **Effort:** Small (15 min) | **Risk:** Low

## Acceptance Criteria

- [ ] Only configured price IDs accepted
- [ ] Unknown priceId returns 400 error
- [ ] Existing checkout flows unaffected

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Security Sentinel |
