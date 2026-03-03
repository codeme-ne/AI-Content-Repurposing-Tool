---
status: pending
priority: p1
issue_id: "005"
tags: [code-review, performance]
dependencies: []
---

# P1: Appwrite Client Re-instantiation on Every Server Request

## Problem Statement

Every Edge Function invocation creates a brand new Appwrite `Client`, `Databases`, and `Users` instance via `createServerClient()`. Additionally, `verifyJWT()` uses a dynamic `import('node-appwrite')` despite `node-appwrite` being statically imported at line 1. This adds unnecessary object allocation overhead and prevents connection reuse.

## Findings

- **Source:** Performance Oracle (P1-1 + P1-2)
- **Location:** `api/utils/appwrite.ts` lines 12-23 (createServerClient), 26-43 (verifyJWT)
- **Evidence:** `getServerDatabases()` calls `createServerClient()` which creates new instances every call. `verifyJWT()` uses `await import('node-appwrite')` redundantly.

## Proposed Solutions

### Option A: Module-scope lazy singleton (Recommended)
- Cache the server client at module scope
- Replace dynamic import with static import reference
- **Effort:** Small (30 min)
- **Risk:** Low

```typescript
let _serverClient: { databases: Databases; users: Users } | null = null;
function getServerClient() {
  if (!_serverClient) {
    const client = new Client()
      .setEndpoint(requireEnv('APPWRITE_ENDPOINT'))
      .setProject(requireEnv('APPWRITE_PROJECT_ID'))
      .setKey(requireEnv('APPWRITE_API_KEY'));
    _serverClient = { databases: new Databases(client), users: new Users(client) };
  }
  return _serverClient;
}
```

### Option B: Add JWT verification caching (30s TTL)
- Cache verified user info keyed by token hash
- Eliminates repeated Appwrite round-trips for same JWT
- **Effort:** Medium (1-2 hours)
- **Risk:** Low (30s TTL means stale data window is small)

## Recommended Action

<!-- Filled during triage -->

## Acceptance Criteria

- [ ] Server client created once per isolate lifecycle
- [ ] Dynamic import replaced with static reference
- [ ] All Edge Functions still work correctly
- [ ] Measurable reduction in cold-start overhead

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-03-03 | Created from code review | Found by Performance Oracle |
