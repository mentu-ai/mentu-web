---
id: RESULT-BeaconServiceRoleKey-v1.0
path: docs/RESULT-BeaconServiceRoleKey-v1.0.md
type: result
intent: reference

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

actor: user:dashboard

parent: HANDOFF-BeaconServiceRoleKey-v1.0

mentu:
  commitment: cmt_4d823f33
  evidence: pending
  status: pending
---

# RESULT: BeaconServiceRoleKey v1.0

**Completed:** 2026-01-11

---

## Summary

Fixed the Mentu Beacon's Supabase client to use `service_role_key` for REST API calls instead of `anon_key`, enabling the beacon to claim commands that were previously blocked by Row Level Security (RLS) policies. This change allows the beacon to operate as a service with elevated privileges while maintaining WebSocket connections with the standard anon key.

---

## Activation

The fix is automatically applied when running the beacon with a `service_role_key` configured in `~/.mentu/beacon.yaml`.

```bash
# Verify your beacon.yaml has service_role_key configured
cat ~/.mentu/beacon.yaml | grep service_role_key

# Start the beacon (GUI mode with menu bar)
open /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri/target/release/bundle/macos/Beacon.app

# Or headless mode for VPS
./target/release/beacon --headless
```

---

## How It Works

```
REST API Calls (claim, update, insert)
       │
       ▼
┌──────────────────────────────────────┐
│  api_key() helper method             │
│  ├── service_role_key exists? ──────▶ Use service_role_key (bypasses RLS)
│  └── otherwise ─────────────────────▶ Fall back to anon_key
└──────────────────────────────────────┘
       │
       ▼
   Supabase REST API
   (Full CRUD access)

WebSocket Realtime (unchanged)
       │
       ▼
┌──────────────────────────────────────┐
│  realtime_url()                      │
│  └── Always uses anon_key            │
└──────────────────────────────────────┘
       │
       ▼
   Supabase Realtime
   (Subscription only)
```

---

## Files Created

None.

---

## Files Modified

| File | Change |
|------|--------|
| `mentu-beacon/src-tauri/src/engine/supabase.rs` | Added `api_key()` helper method and updated all REST API calls to use it |
| `mentu-beacon/src-tauri/tauri.conf.json` | Fixed bundle icon configuration to include icns file |
| `mentu-beacon/src-tauri/icons/icon.icns` | Regenerated proper macOS icon file (was empty) |

---

## Test Results

| Test | Command | Result |
|------|---------|--------|
| Rust Compilation | `cargo check` | Pass |
| Release Build | `cargo build --release` | Pass |
| macOS Bundle | `npm run tauri build` | Pass |
| No 401 Errors | `grep "401\|Unauthorized" /tmp/beacon.log` | Pass (no matches) |
| WebSocket Connection | Log inspection | Pass (connected and subscribed) |

---

## Design Decisions

### 1. Helper Method Pattern

**Rationale:** Created an `api_key()` method on `SupabaseClient` rather than modifying the config struct. This keeps the change minimal, maintains backward compatibility (falls back to anon_key if service_role_key isn't set), and makes the intent clear in the code.

### 2. WebSocket Uses anon_key

**Rationale:** The Supabase Realtime WebSocket connection continues to use `anon_key` because WebSocket authentication works differently and RLS on subscriptions uses different policies. The beacon only needs elevated permissions for REST operations (claiming commands, updating status, etc.).

### 3. Replace All Pattern

**Rationale:** Used `replace_all` for the edit to ensure all 24+ occurrences of the hardcoded `&self.config.anon_key` in REST calls were updated consistently, reducing the risk of missing any instances.

---

## Mentu Ledger Entry

```
Commitment: cmt_4d823f33
Status: pending (commitment did not exist in ledger)
Evidence: pending
Actor: user:dashboard
Body: "Fix beacon supabase.rs to use service_role_key for REST calls"
```

Note: The commitment cmt_4d823f33 specified in the HANDOFF did not exist in the Mentu ledger. The work was completed as specified regardless.

---

## Usage Examples

### Example 1: Verify Service Role Key in Use

```bash
# Check beacon logs for successful operations (no 401 errors)
tail -f /tmp/beacon.log | grep -E "Claimed|Updated|Inserted"
```

Expected: Commands are claimed and updated without authorization errors.

### Example 2: Insert Test Command

```sql
-- Insert a command targeted at your beacon
INSERT INTO bridge_commands (
  workspace_id,
  prompt,
  working_directory,
  agent,
  status,
  target_machine_id
) VALUES (
  'your-workspace-uuid',
  'echo "test"',
  '/tmp',
  'claude',
  'pending',
  'beacon-xxxxxxxx'
);
```

Expected: Beacon claims the command and executes it within 15 seconds.

---

## Constraints and Limitations

- The `service_role_key` must be configured in `~/.mentu/beacon.yaml` for RLS bypass to work
- If `service_role_key` is not set, the beacon falls back to `anon_key` behavior
- The fix only applies to REST API calls; WebSocket realtime still uses anon_key

---

## Future Considerations

1. **Key Rotation Support**: Add support for rotating the service_role_key without restarting the beacon
2. **Per-Operation Key Selection**: Allow choosing anon vs service_role key per operation type
3. **Audit Logging**: Log when service_role_key is used vs anon_key for security audit trails

---

*Enabled full command execution capability for the local beacon by fixing RLS authentication.*
