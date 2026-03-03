---
status: pending
priority: p1
issue_id: "002"
tags: [code-review, security]
dependencies: []
---

# P1: SSRF Bypass via DNS Rebinding and IP Encoding Variants

## Problem Statement

The SSRF protection in `api/utils/urlValidation.ts` has multiple bypass vectors: DNS rebinding, IP encoding variants (octal, hex, decimal integer, IPv6-mapped IPv4), and missing blocks for `.local`/`.internal`/`.localhost` suffixes. An attacker could access internal services or cloud metadata endpoints.

## Findings

- **Source:** Security Sentinel
- **Location:** `api/utils/urlValidation.ts` lines 10-54
- **Evidence:** IP encoding variants like `0177.0.0.1` (octal for 127.0.0.1), `0x7f000001` (hex), `2130706433` (decimal integer), `::ffff:127.0.0.1` (IPv6-mapped) are not blocked
- **Mitigation:** The URL is proxied through Jina Reader (not fetched directly), which reduces the blast radius since Jina's servers do the actual fetch. However, the validation should still be comprehensive.

## Proposed Solutions

### Option A: Extend blocklist with encoding variants + suffix checks
- **Pros:** Direct fix, builds on existing pattern
- **Cons:** Still susceptible to DNS rebinding (validation before fetch)
- **Effort:** Small (1-2 hours)
- **Risk:** Low

### Option B: Post-resolution IP validation
- **Pros:** Covers DNS rebinding; most robust approach
- **Cons:** Complex in Edge runtime (no `dns.resolve`); may not apply since Jina Reader does the actual fetch
- **Effort:** Large (complex)
- **Risk:** Medium

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected files:**
- `api/utils/urlValidation.ts` — extend `BLOCKED_HOSTS`, add encoding detection regex, add suffix blocklist

**Add these patterns:**
```typescript
const BLOCKED_SUFFIXES = ['.local', '.internal', '.localhost'];
const ENCODED_IP_PATTERNS = [
  /^0[xX][0-9a-fA-F]+$/,   // hex integer
  /^0[0-7]+/,                // octal
  /^\d{8,}$/,                // decimal integer
  /^::ffff:/i,               // IPv6-mapped IPv4
];
```

## Acceptance Criteria

- [ ] Octal IPs (0177.0.0.1) blocked
- [ ] Hex IPs (0x7f000001) blocked
- [ ] Decimal integer IPs (2130706433) blocked
- [ ] IPv6-mapped IPv4 (::ffff:127.0.0.1) blocked
- [ ] `.local`, `.internal`, `.localhost` suffixes blocked
- [ ] Existing valid URLs still pass validation

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Security Sentinel |

## Resources

- OWASP SSRF Prevention Cheat Sheet
- `api/extract.ts` — consumer of urlValidation
