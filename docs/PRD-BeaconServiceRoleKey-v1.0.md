---
id: PRD-BeaconServiceRoleKey-v1.0
path: docs/PRD-BeaconServiceRoleKey-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

children:
  - HANDOFF-BeaconServiceRoleKey-v1.0
dependencies:
  - RESULT-BeaconSynchronization-v1.0

mentu:
  commitment: cmt_4d823f33
  status: pending
---

# PRD: BeaconServiceRoleKey v1.0

## Mission

Fix the mentu-beacon's Supabase client to use `service_role_key` for REST API calls, enabling the local beacon to claim and execute bridge_commands that are currently blocked by Row Level Security (RLS) policies.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────────┐
│ beacon.yaml                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ supabase:                                                            │
│   anon_key: eyJhbG...anon...           ← Used by all REST calls     │
│   service_role_key: eyJhbG...service... ← Never used by supabase.rs │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ supabase.rs (ALL API calls use anon_key)                            │
├─────────────────────────────────────────────────────────────────────┤
│ .header("apikey", &self.config.anon_key)                            │
│ .header("Authorization", format!("Bearer {}", &self.config.anon_key))│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Supabase RLS: bridge_commands                                        │
├─────────────────────────────────────────────────────────────────────┤
│ ❌ anon_key blocked by RLS policies                                  │
│ ✓  service_role_key bypasses RLS                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Problem**: The beacon code always uses `anon_key` for Supabase REST API authentication. The `bridge_commands` table has RLS policies that block anonymous access, preventing the local beacon from:
- Fetching pending commands
- Claiming commands
- Updating command status
- Inserting results

The VPS beacon works because it uses a stable machine ID that RLS permits.

### Desired State

```
┌─────────────────────────────────────────────────────────────────────┐
│ beacon.yaml                                                          │
├─────────────────────────────────────────────────────────────────────┤
│ supabase:                                                            │
│   anon_key: eyJhbG...anon...           ← For realtime WebSocket     │
│   service_role_key: eyJhbG...service... ← For REST API calls        │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ supabase.rs (Uses service_role_key when available)                   │
├─────────────────────────────────────────────────────────────────────┤
│ fn api_key(&self) -> &str {                                         │
│   self.config.service_role_key.as_deref()                           │
│     .unwrap_or(&self.config.anon_key)                               │
│ }                                                                    │
│                                                                      │
│ .header("apikey", self.api_key())                                   │
│ .header("Authorization", format!("Bearer {}", self.api_key()))      │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│ Supabase RLS: bridge_commands                                        │
├─────────────────────────────────────────────────────────────────────┤
│ ✓  service_role_key bypasses RLS                                     │
│ ✓  Local beacon can claim and execute commands                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Beacon Service Role Key",
  "tier": "T2",
  "required_files": [
    "mentu-beacon/src-tauri/src/engine/supabase.rs"
  ],
  "checks": {
    "tsc": false,
    "build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "actor": "agent:claude-executor",
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 30
}
```

---

## Core Concepts

### Service Role Key

The Supabase service role key (`service_role`) bypasses all Row Level Security policies. It should only be used server-side where the client is trusted.

### Anon Key

The Supabase anonymous key (`anon`) is subject to RLS policies. It's appropriate for client-side code where the user identity determines access.

### Effective API Key Pattern

The beacon config already has an `effective_api_key()` method in `config.rs:395-399` that returns `service_role_key` if available, falling back to `anon_key`. The `supabase.rs` module should use this pattern.

---

## Specification

### Types

```rust
// Current SupabaseConfig (in config.rs)
pub struct SupabaseConfig {
    pub url: String,
    pub anon_key: String,
    pub service_role_key: Option<String>,  // Already exists!
}
```

### Operations

| Operation | Current Auth | Required Auth | Description |
|-----------|--------------|---------------|-------------|
| `claim_command` | anon_key | service_role_key | Claim a pending command |
| `update_command_status` | anon_key | service_role_key | Update command status |
| `insert_result` | anon_key | service_role_key | Insert execution result |
| `fetch_pending_commands` | anon_key | service_role_key | Fetch pending commands |
| `register_machine` | anon_key | service_role_key | Register machine heartbeat |
| `heartbeat` | anon_key | service_role_key | Update machine status |
| `realtime_url` | anon_key | anon_key (keep) | WebSocket subscription |

### Validation Rules

- If `service_role_key` is set in config, use it for all REST API calls
- If `service_role_key` is not set, fall back to `anon_key` (current behavior)
- WebSocket realtime subscription should continue using `anon_key`
- Never log or expose the service_role_key value

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `mentu-beacon/src-tauri/src/engine/supabase.rs` | Add `api_key()` method, update all REST calls |

### Build Order

1. **Add api_key() method**: Create helper method that returns service_role_key or anon_key
2. **Update REST calls**: Replace all `&self.config.anon_key` with `self.api_key()` for REST calls
3. **Keep WebSocket auth**: Ensure realtime_url still uses anon_key
4. **Test build**: Run `cargo build --release`

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| `config.rs` | Reads SupabaseConfig | Already has service_role_key field |
| `beacon.yaml` | Config file | Already has service_role_key set |
| `bridge_commands` | Supabase table | RLS will be bypassed with service_role |

---

## Constraints

- **No schema changes**: RLS policies remain unchanged
- **Backward compatible**: If service_role_key is not set, behavior unchanged
- **Security**: service_role_key must never be logged or exposed
- **WebSocket unchanged**: Realtime subscription continues using anon_key

---

## Success Criteria

### Functional

- [ ] Local beacon can fetch pending commands via REST API
- [ ] Local beacon can claim commands targeted at its instance ID
- [ ] Local beacon can update command status to running/completed/failed
- [ ] Local beacon can insert results into bridge_results

### Quality

- [ ] `cargo build --release` succeeds without errors
- [ ] No service_role_key values in log output
- [ ] Fallback to anon_key works if service_role_key not configured

### Integration

- [ ] VPS beacon continues to work unchanged
- [ ] WebSocket realtime still connects and receives events
- [ ] Machine registration succeeds (no more 401)

---

## Verification Commands

```bash
# Build the beacon
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo build --release

# Start beacon and verify no 401 errors
pkill -f "beacon --headless"
nohup ./target/release/beacon --headless > /tmp/beacon.log 2>&1 &
sleep 10

# Check for 401 errors (should be none)
grep -E "401|Unauthorized" /tmp/beacon.log

# Test command claiming (insert test command and verify claim)
# Via Supabase MCP - insert pending command, verify beacon claims it
```

---

## References

- `RESULT-BeaconSynchronization-v1.0`: Documents the RLS issue discovery
- `mentu-beacon/src-tauri/src/engine/supabase.rs`: Current implementation
- `mentu-beacon/src-tauri/src/config.rs:395-399`: existing `effective_api_key()` pattern

---

*Enable the local beacon to fully participate in command execution by using service_role_key for RLS bypass.*
