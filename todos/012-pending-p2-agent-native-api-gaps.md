---
status: pending
priority: p2
issue_id: "012"
tags: [code-review, agent-native, architecture]
dependencies: []
---

# P2: Agent-Native API Gaps — 18/26 Capabilities Have No Server Endpoint

## Problem Statement

Only 6 of 26 user-facing capabilities are fully accessible via server API. Core workflows (save/retrieve/manage posts, auth, usage tracking) use Appwrite client SDK directly from the browser, making them inaccessible to agents, scripts, or non-browser clients. The generation endpoint is a raw LLM proxy — agents must reimplement prompt engineering and response parsing.

## Findings

- **Source:** Agent-Native Reviewer
- **Score:** 6/26 capabilities fully agent-accessible

### Missing Endpoints (Priority Order)
1. **Saved posts CRUD** — `POST/GET/PUT/DELETE /api/posts` (currently Appwrite client SDK only)
2. **Auth token exchange** — `POST /api/auth/token` for email/password → JWT
3. **Domain-specific generation** — `POST /api/generate` with prompt building server-side
4. **Usage query** — `GET /api/usage` returning remaining generations
5. **Subscription status** — `GET /api/subscription`
6. **API discovery** — `GET /api` listing available endpoints

### What Works Well
- Machine-readable error codes with `{ error, code }` format
- `Retry-After` headers on rate limits
- JWT Bearer auth pattern on existing endpoints
- Non-streaming fallback on extract endpoint

## Proposed Solutions

### Option A: Incremental API surface expansion (Recommended)
- Start with saved posts CRUD (highest value)
- Add auth token exchange
- Add high-level generation endpoint
- **Effort:** Large (1-2 days) | **Risk:** Medium

### Option B: Full API-first redesign
- Design OpenAPI spec first, then implement
- **Effort:** Very Large | **Risk:** Medium

## Recommended Action

<!-- Filled during triage -->

## Acceptance Criteria

- [ ] Agent can authenticate without browser session
- [ ] Agent can save, list, update, delete posts via API
- [ ] Agent can generate posts with a single API call (no prompt building needed)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Agent-Native Reviewer |
