# Instruction: Fix Kanban Data Synchronization

**Version**: 1.0
**Created**: 2026-01-04
**Status**: ACTIVE
**Priority**: HIGH

---

## Problem Statement

The Kanban board at `https://mentu-web-five.vercel.app/workspace/mentu-ai/kanban` shows "No commitments" in the **In Review** column, despite Supabase containing valid data.

**Evidence from database (verified via MCP):**
- Total operations: 2271
- Commits: 74
- Submits: 36
- In Review commitments: 2 (`cmt_d84aa500`, `cmt_1a55e41b`)

**What user sees:**
- To Do: 5 commitments
- In Progress: 1 commitment
- **In Review: 0 commitments** (WRONG - should be 2)
- Done: 44 commitments

---

## Audit Findings

### 1. Fixed Issues (Already Pushed - commit 45d4873)

| Issue | Location | Fix Applied |
|-------|----------|-------------|
| Realtime query key mismatch | `useRealtime.ts:32` | Changed `['operations', workspaceId]` to `['operations', workspaceId, 'v2']` |
| Stale cache | `useOperations.ts:43-44` | Changed `staleTime: Infinity` to `5 * 60 * 1000` |
| No refetch on mount | `useOperations.ts:44` | Added `refetchOnMount: 'always'` |
| Missing console logs | Multiple files | Added comprehensive logging |

### 2. Verified Working

| Component | Status | Evidence |
|-----------|--------|----------|
| RLS Policy | OK | User `rashid.azarang.eg@gmail.com` is member of `mentu-ai` workspace |
| Data in Supabase | OK | 2271 operations synced, latest at 02:02:33 UTC |
| State computation logic | OK | `computeCommitmentState` correctly handles `submit` operation |
| Workspace resolution | OK | Page correctly resolves `mentu-ai` to UUID `9584ae30-14f5-448a-9ff1-5a6f5caf6312` |

### 3. Potential Remaining Issues

| Hypothesis | Likelihood | Investigation Needed |
|------------|------------|---------------------|
| Vercel hasn't deployed latest commit | HIGH | Check Vercel dashboard deployment status |
| Browser cache serving old bundle | MEDIUM | Hard refresh (Cmd+Shift+R) and check console logs |
| Query returning stale/cached data | MEDIUM | Check React Query devtools |
| Supabase client initialization issue | LOW | Verify auth token in requests |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  DATA FLOW: Supabase → Kanban Board                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  1. PAGE LOAD                                                                │
│     KanbanPage.tsx → useKanbanCommitments(workspaceId)                      │
│                              ↓                                               │
│  2. FETCH OPERATIONS                                                         │
│     useCommitments(workspaceId) → useOperations(workspaceId)                │
│                              ↓                                               │
│  3. SUPABASE QUERY                                                          │
│     supabase.from('operations')                                              │
│       .select('*', { count: 'exact' })                                       │
│       .eq('workspace_id', workspaceId)                                       │
│       .order('synced_at', { ascending: true })                               │
│       .limit(10000)                                                          │
│                              ↓                                               │
│  4. COMPUTE STATE                                                            │
│     computeCommitments(operations) → for each op where op.op === 'commit'   │
│       → computeCommitmentState(ops, cmtId)                                   │
│       → looks for claim, release, submit, approve, close, reopen            │
│                              ↓                                               │
│  5. GROUP BY COLUMN                                                          │
│     stateToColumn(state) → 'in_review' → columns.in_review.push()           │
│                              ↓                                               │
│  6. RENDER                                                                   │
│     KanbanBoard.tsx → KanbanColumn.tsx → CommitmentCard.tsx                 │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Console Logs Added (Check Browser DevTools)

When the fix is deployed, you should see these logs in the browser console:

```
[useOperations] Fetching operations for workspace: 9584ae30-14f5-448a-9ff1-5a6f5caf6312
[useOperations] Fetched 2271 operations (total count: 2271)
[useOperations] Operation breakdown: {capture: 120, commit: 74, claim: 50, ...}
[useCommitments] Computed 74 commitments: {open: 5, claimed: 1, in_review: 2, closed: 66}
[useCommitments] In Review commitments: [{id: 'cmt_d84aa500', body: 'Validate Kanban...'}]
[computeCommitmentState] Found in_review commitment: cmt_d84aa500
[useKanbanCommitments] Column counts: {todo: 5, in_progress: 1, in_review: 2, done: 66}
```

**If you don't see these logs**, the deployment hasn't updated yet.

---

## Agent Instructions

### Step 1: Verify Deployment

```bash
# Check if latest commit is deployed
curl -s https://mentu-web-five.vercel.app | grep -o 'buildId":"[^"]*"' | head -1

# Compare with local build
cat /Users/rashid/Desktop/Workspaces/mentu-web/.next/BUILD_ID
```

Or check Vercel dashboard: https://vercel.com/mentu-ai/mentu-web/deployments

### Step 2: Check Browser Console

1. Open https://mentu-web-five.vercel.app/workspace/mentu-ai/kanban
2. Open DevTools (F12 or Cmd+Option+I)
3. Go to Console tab
4. Hard refresh (Cmd+Shift+R)
5. Look for `[useOperations]`, `[useCommitments]`, `[useKanbanCommitments]` logs

### Step 3: If No Logs Appear

The console logging code hasn't been deployed. Either:
- Wait for Vercel to complete deployment (check dashboard)
- Trigger a manual deployment: `vercel --prod`
- Check for build errors in Vercel

### Step 4: If Logs Show 0 Operations

The Supabase query is failing. Check:

```typescript
// In useOperations.ts - add error boundary
const { data, error, count } = await supabase
  .from('operations')
  .select('*', { count: 'exact' })
  .eq('workspace_id', workspaceId)
  .order('synced_at', { ascending: true })
  .limit(10000);

if (error) {
  console.error('[useOperations] Supabase error:', error);
  // Check if this is an auth/RLS issue
}
```

### Step 5: If Logs Show Operations But Wrong Count

The state computation might have a bug. Add more specific logging:

```typescript
// In state.ts computeCommitmentState
console.log(`[computeCommitmentState] ${cmtId}: claim=${hasClaim}, submit=${hasSubmit}, close=${hasClose}`);
```

### Step 6: If Logs Show Correct Count But UI Doesn't Update

React Query cache issue. Force invalidation:

```typescript
// In KanbanPage.tsx - add a manual refetch button for debugging
<Button onClick={() => refetch()}>Force Refresh</Button>
```

---

## Key Files to Modify

| File | Purpose | Lines to Check |
|------|---------|----------------|
| `src/hooks/useOperations.ts` | Fetches from Supabase | 12-44 |
| `src/hooks/useCommitments.ts` | Computes commitments | 10-31 |
| `src/hooks/useKanbanCommitments.ts` | Groups by column | 44-74 |
| `src/hooks/useRealtime.ts` | Handles live updates | 30-46 |
| `src/lib/mentu/state.ts` | State machine | 19-60 |

---

## Verification Query

Run this to verify data exists in Supabase:

```sql
-- Via Supabase MCP or SQL editor
SELECT
  c.id,
  c.payload->>'body' as body,
  CASE
    WHEN EXISTS(SELECT 1 FROM operations WHERE op='approve' AND payload->>'commitment'=c.id) THEN 'closed'
    WHEN EXISTS(SELECT 1 FROM operations WHERE op='close' AND payload->>'commitment'=c.id) THEN 'closed'
    WHEN EXISTS(SELECT 1 FROM operations WHERE op='submit' AND payload->>'commitment'=c.id) THEN 'in_review'
    WHEN EXISTS(SELECT 1 FROM operations WHERE op='claim' AND payload->>'commitment'=c.id) THEN 'claimed'
    ELSE 'open'
  END as computed_state
FROM operations c
WHERE c.workspace_id = '9584ae30-14f5-448a-9ff1-5a6f5caf6312'
  AND c.op = 'commit'
ORDER BY c.ts DESC
LIMIT 20;
```

---

## Success Criteria

1. Console logs appear in browser DevTools
2. Logs show correct operation count (~2271)
3. Logs show in_review count >= 2
4. Kanban "In Review" column shows commitments
5. `cmt_d84aa500` ("Validate Kanban board...") is visible

---

## Trace

| Timestamp | Actor | Action |
|-----------|-------|--------|
| 2026-01-04 01:29 | agent:claude-code | Created test commitment `cmt_d84aa500` |
| 2026-01-04 01:30 | agent:claude-code | Submitted to in_review |
| 2026-01-04 01:44 | agent:claude-code | Synced 27 ops to Supabase |
| 2026-01-04 01:58 | agent:claude-code | Fixed realtime query key bug |
| 2026-01-04 02:02 | agent:claude-code | Pushed fix (commit 45d4873) |
| 2026-01-04 02:15 | agent:claude-code | Created this instruction |

---

## Next Agent Checklist

- [ ] Verify Vercel deployment is complete
- [ ] Check browser console for logging output
- [ ] If no logs, wait or trigger redeploy
- [ ] If logs show data, trace where it's lost
- [ ] Add more specific debugging if needed
- [ ] Test approve flow once data appears

---

*This instruction documents the audit trail for the Kanban data sync issue.*
