---
status: pending
priority: p3
issue_id: "015"
tags: [code-review, performance]
dependencies: []
---

# P3: Minor Performance Improvements

## Problem Statement

Several low-impact but easy-to-fix performance issues:

1. **localStorage auto-save not debounced** — every keystroke triggers `JSON.stringify` + `setItem`
2. **Landing page video `preload="auto"`** — downloads entire video eagerly on mobile
3. **`truncateContent` linear scan** — 40+ `indexOf` calls instead of single compiled RegExp
4. **Guardrail check on 100% of generations** — doubles API cost; sampling would suffice
5. **`DecorativeBackground` 4x `animate-pulse`** with `blur-3xl` — heavy on mobile GPU
6. **Chat endpoint sequential DB queries** — JWT verify + subscription check could be parallelized
7. **Dead LRU cache code** — `useContentGeneration` LRU can never trigger (max 3 keys vs threshold 50)

## Findings

- **Source:** Performance Oracle (P2-5 through P2-7, P3-1 through P3-6)

## Proposed Solutions

### Quick wins (30 min each):
1. Debounce localStorage save (500ms)
2. Change video preload to `metadata`
3. Compile end markers into single RegExp
4. Add `GUARDRAIL_SAMPLE_RATE` env var (default 10%)
5. Remove dead LRU code

### Medium effort (1-2 hours):
6. Parallelize JWT + subscription check with `Promise.all()`
7. Add `will-change: opacity` to decorative elements, reduce count on mobile

## Acceptance Criteria

- [ ] No regression in functionality
- [ ] Measurable improvement in mobile performance (video, animations)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Performance Oracle |
