# PLAN: Executor Simplification

## Audit Summary

### Current State (Over-Engineered)

We have **3 layers of conflict prevention** that overlap:

| Layer | Mechanism | Location | Purpose |
|-------|-----------|----------|---------|
| 1. Singleton Lock | `~/.mentu/executor.lock` file | Local filesystem | Prevent Bridge + Beacon on same machine |
| 2. Machine Registration | `bridge_machines` table | Supabase | Track online executors |
| 3. Atomic Claiming | `UPDATE WHERE status='pending'` | Supabase | Prevent duplicate execution |

**Problem**: Layer 3 (atomic claiming) already prevents duplicate execution. Layers 1 and 2 add complexity without clear benefit for parallel scenarios.

---

## Key Inconsistencies Found

### 1. Machine ID Generation (CRITICAL)

| Executor | Machine ID Source | Persistence |
|----------|------------------|-------------|
| Bridge | `~/.mentu/bridge.yaml` config | Permanent |
| Beacon | `beacon-{random-8-chars}` | Per-startup (ephemeral) |

**Impact**: Beacon can't be reliably targeted via `target_machine_id` because its ID changes every restart.

### 2. Subscription Model

| Executor | How it gets commands | Latency |
|----------|---------------------|---------|
| Bridge | Polling every 60s | 0-60s delay |
| Beacon | WebSocket realtime | Immediate |

### 3. Actor Identity

| Location | Actor String |
|----------|-------------|
| manifest.yaml | `agent:claude-executor` |
| genesis enforcement | `agent:bridge-daemon` |
| Beacon code | `agent:beacon` (implied) |

---

## Proposed Simplification

### Option A: Keep Singleton, Fix Inconsistencies (Conservative)

**Philosophy**: One machine = one executor. Simple and safe.

**Changes**:
1. Fix Beacon machine_id to be persistent (read from/write to config)
2. Standardize actor identity to `agent:executor`
3. Keep singleton lock as-is
4. Document: "Use Beacon on Mac, Bridge on VPS"

**Pros**:
- Minimal code changes
- No race condition risk
- Clear mental model

**Cons**:
- Can't run parallel agents on same machine
- May limit throughput

---

### Option B: Trust DB Claiming, Remove Singleton (Progressive)

**Philosophy**: Let Supabase be the source of truth.

**Changes**:
1. Remove singleton lock entirely
2. Allow multiple executors on same machine
3. Fix Beacon machine_id to be persistent
4. Each executor claims its own commands atomically
5. Add `--id <name>` flag to differentiate instances

**Pros**:
- Enables parallel execution
- Simpler local state (no lock file)
- More flexible deployment

**Cons**:
- Multiple Claude processes could compete for resources
- Harder to debug "which executor is doing what"
- Risk of resource exhaustion

---

### Option C: Hybrid - Registry Instead of Mutex (Recommended)

**Philosophy**: Allow parallelism with visibility, not blocking.

**Changes**:
1. Change `executor.lock` to `executor-registry.json` (array, not mutex)
2. Each executor registers itself on startup (append to array)
3. Remove on shutdown (cleanup on process exit)
4. **No blocking** - just visibility
5. Add `--solo` flag that enforces singleton behavior (opt-in)

```json
// ~/.mentu/executor-registry.json
{
  "executors": [
    { "type": "beacon", "pid": 1234, "machine_id": "beacon-main", "started_at": "..." },
    { "type": "bridge", "pid": 5678, "machine_id": "bridge-vps", "started_at": "..." }
  ]
}
```

**Pros**:
- Visibility into what's running
- No accidental conflicts (same command won't execute twice - DB handles it)
- Parallel when deliberate, solo when needed
- `mentu status --executors` can show what's running

**Cons**:
- More complex than Option A
- Registry file cleanup on crash

---

## Recommendation: Option A for Now

**Rationale**:
- We just implemented the singleton correctly
- The real problem is **Beacon's ephemeral machine_id**
- Parallel execution adds complexity we don't need yet
- "One machine = one executor" is a clear, simple rule

### Immediate Fix (1 hour)

1. **Make Beacon machine_id persistent**
   - Read from `~/.mentu/beacon.yaml` if exists
   - Generate once and save if not exists
   - Use format: `beacon-{hostname}` for clarity

2. **Standardize actor identity**
   - Use `agent:executor` everywhere
   - Update genesis enforcement

3. **Update documentation**
   - CLAUDE.md in each repo
   - Clear guidance: "Mac = Beacon, VPS = Bridge"

### Future (When Needed)

If parallel execution becomes necessary:
- Implement Option C (registry)
- Add `--parallel` flag
- Trust DB claiming

---

## Nomenclature Standardization

### Canonical Terms

| Term | Definition | Example |
|------|-----------|---------|
| **Executor** | Any process that claims and runs commands | Beacon, Bridge |
| **Machine** | Physical/virtual host running executor(s) | MacBook, VPS |
| **Instance** | Running process of an executor | `beacon-macbook`, `bridge-vps-01` |
| **Command** | Unit of work in `bridge_commands` | Prompt + working directory |
| **Commitment** | User task in Mentu ledger | `cmt_xxx` |
| **Agent** | CLI tool invoked by executor | `claude` binary |

### Naming Conventions

| Item | Format | Example |
|------|--------|---------|
| Beacon instance ID | `beacon-{hostname}` | `beacon-macbook` |
| Bridge instance ID | `bridge-{hostname}` | `bridge-vps-01` |
| Lock file | `~/.mentu/executor.lock` | JSON with type, pid, id |
| Config (Beacon) | `~/.mentu/beacon.yaml` | Contains machine.id |
| Config (Bridge) | `~/.mentu/bridge.yaml` | Contains machine.id |

---

## Decision Needed

**Question**: Do we need parallel agent execution on the same machine right now?

- **If NO**: Implement Option A (fix inconsistencies only)
- **If YES**: Implement Option C (registry + parallel)

Given the "dial things back" request, **Option A is recommended**.
