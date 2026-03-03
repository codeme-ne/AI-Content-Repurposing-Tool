---
status: pending
priority: p2
issue_id: "013"
tags: [code-review, quality]
dependencies: []
---

# P2: 58 console.log/warn/error Calls Across 29 Files

## Problem Statement

The project rule states "No console.log" yet there are 58 console calls across 29 files. While many are gated by `import.meta.env.DEV`, some are in production-reachable code paths.

## Findings

- **Source:** Architecture Strategist (P2-1)
- **Production console calls (ungated):**
  - `src/config/app.config.ts:337` — `console.warn`
  - `src/libs/promptBuilder.ts:234,240` — `console.warn`/`console.error`
  - `src/libs/promptBuilder.v2.ts:297` — `console.warn` (dead code, remove with 003)
  - `src/hooks/usePostGeneratorState.ts:526` — `console.error`

## Proposed Solutions

### Option A: Gate remaining calls behind `import.meta.env.DEV` (Recommended)
- Wrap ungated console calls in dev check
- **Effort:** Small (30 min) | **Risk:** Low

### Option B: Introduce logger abstraction
- Create thin `logger.ts` that is no-op in production
- **Effort:** Medium (1 hour) | **Risk:** Low

## Acceptance Criteria

- [ ] No ungated console calls in production code
- [ ] Dev-mode logging still works

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Architecture Strategist |
