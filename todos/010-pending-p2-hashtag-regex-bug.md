---
status: pending
priority: p2
issue_id: "010"
tags: [code-review, performance, bug]
dependencies: []
---

# P2: Global Regex Bug — Half of Instagram Hashtags Not Highlighted

## Problem Statement

In `PlatformPreviewCard.tsx`, the `HighlightedContent` component uses a regex with the `g` flag for both `split()` and `test()`. Using `.test()` on a global regex advances `lastIndex`, causing alternating true/false results. Roughly half the hashtags are not highlighted.

## Findings

- **Source:** Performance Oracle (P2-8)
- **Location:** `src/components/common/PlatformPreviewCard.tsx` lines 36-56
- **Evidence:** `const hashtagRegex = /(#\w+)/g` — the `g` flag causes `.test()` to alternate

## Proposed Solutions

### Option A: Use `part.startsWith('#')` instead of regex test (Recommended)
- Since `split(/(#\w+)/g)` already isolates hashtags, just check prefix
- **Effort:** Small (5 min) | **Risk:** None

```typescript
parts.map((part, i) =>
  part.startsWith('#') ? (
    <span key={i} className="text-purple-600 font-medium">{part}</span>
  ) : (
    <span key={i}>{part}</span>
  )
)
```

## Acceptance Criteria

- [ ] All Instagram hashtags are highlighted (not just every other one)
- [ ] No regex-related warnings

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Performance Oracle |
