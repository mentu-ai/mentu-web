---
id: PRD-BeaconSynchronization-v1.0
path: docs/PRD-BeaconSynchronization-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

children:
  - HANDOFF-BeaconSynchronization-v1.0

mentu:
  commitment: cmt_3969ac09
  status: pending
---

# PRD: Beacon Synchronization v1.0

## Mission

Resolve authentication and command routing issues preventing the local Mac beacon from claiming and executing bridge commands, while ensuring both local (macbook-rashid) and VPS (vps-mentu-01) beacons operate correctly with proper machine targeting and no command conflicts.

---

## Problem Statement

### Current State

```
Local Beacon (beacon-ae0eee9f):
- Running in headless mode ✓
- WebSocket connected to Supabase ✓
- Getting 401 Unauthorized errors on scheduler tick ✗
- NOT claiming commands ✗

VPS Beacon (vps-mentu-01):
- Running and operational ✓
- Claims commands faster than local ✓
- Executes non-targeted commands ✓

Command Flow:
┌──────────────┐
│ Create       │
│ Command      │
└──────┬───────┘
       │
       ▼
┌──────────────┐      401 Error
│ Local Beacon │◄─────────────── Scheduler fails
│ (Mac)        │      Can't fetch commands
└──────────────┘

┌──────────────┐      ✓ Claims
│ VPS Beacon   │◄─────────────── Gets all commands
└──────────────┘
```

**Issues:**
1. Local beacon scheduler returns 401 Unauthorized every 60 seconds
2. Commands without target_machine_id go to VPS (faster claim)
3. Even targeted commands (target_machine_id='beacon-ae0eee9f') stay pending
4. No verification that both beacons can execute test commands

### Desired State

```
┌──────────────────────────────────────────────────────────────┐
│ Both Beacons Operating Correctly                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Local Beacon (beacon-ae0eee9f):                             │
│  - WebSocket: Connected ✓                                    │
│  - Scheduler: No auth errors ✓                               │
│  - Claims targeted commands ✓                                │
│  - Executes successfully ✓                                   │
│                                                              │
│  VPS Beacon (vps-mentu-01):                                  │
│  - Claims non-targeted commands ✓                            │
│  - Respects machine targeting ✓                              │
│  - No conflicts with local ✓                                 │
│                                                              │
│  Command Routing:                                            │
│  ┌──────────────────┐                                        │
│  │ Command Created  │                                        │
│  └────────┬─────────┘                                        │
│           │                                                  │
│     ┌─────┴──────┐                                          │
│     │            │                                           │
│  Has target?   No target?                                   │
│     │            │                                           │
│     ▼            ▼                                           │
│  [Local]      [VPS or Local]                                │
│   Picks up     (whoever claims first)                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Benefits:**
- Local development with instant command execution
- VPS handles production/remote tasks
- Both beacons tested and verified
- Clear machine targeting works correctly

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Beacon Synchronization",
  "tier": "T2",
  "required_files": [
    "~/.mentu/beacon.yaml",
    "/tmp/beacon_verification_local.txt",
    "/tmp/beacon_verification_vps.txt"
  ],
  "checks": {
    "tsc": false,
    "build": false,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "commitments": {
      "mode": "dynamic",
      "min_count": 1,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 50
}
```

---

## Core Concepts

### Machine Targeting

Commands can specify `target_machine_id` to route to a specific beacon:
- `beacon-ae0eee9f` = Local Mac (macbook-rashid)
- `vps-mentu-01` = VPS remote machine
- `null` = Any beacon can claim (first come, first served)

### Scheduler vs WebSocket

Beacons use two mechanisms to discover commands:
- **WebSocket (Realtime)**: Immediate notification when commands are inserted
- **Scheduler (Polling)**: Backup polling every 60 seconds via API

The 401 error affects scheduler polling but WebSocket should still work.

### Authentication Layers

- **Supabase WebSocket**: Uses `anon_key` for realtime connection
- **Supabase API**: Uses `anon_key` or `service_role_key` for REST calls
- **Mentu Proxy**: Uses `api_key` for mentu-specific operations

The 401 suggests scheduler API calls may need service_role_key instead of anon_key.

---

## Specification

### Diagnostic Operations

| Operation | Purpose | Expected Result |
|-----------|---------|-----------------|
| Check beacon logs | Identify auth errors | No 401 errors in scheduler |
| Create targeted command | Test machine routing | Local beacon claims and executes |
| Create non-targeted command | Test claim race | Either beacon claims (no errors) |
| Verify test file output | Confirm execution | Files created with correct content |

### Beacon State Verification

```
Local Beacon Health Check:
┌────────────────────────────────────────┐
│ ✓ Process running                      │
│ ✓ WebSocket connected                  │
│ ✓ Scheduler not erroring (401 fixed)   │
│ ✓ Can claim targeted commands          │
│ ✓ Can execute bash commands            │
│ ✓ Test files created successfully      │
└────────────────────────────────────────┘

VPS Beacon Health Check:
┌────────────────────────────────────────┐
│ ✓ Process running                      │
│ ✓ Claims non-targeted commands         │
│ ✓ Respects target_machine_id           │
│ ✓ No conflicts with local              │
└────────────────────────────────────────┘
```

### Configuration Fix

The beacon.yaml may need:
```yaml
supabase:
  url: https://nwhtjzgcbjuewuhapjua.supabase.co
  anon_key: {existing}
  service_role_key: {existing}  # May need to be used for scheduler
```

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `~/.mentu/beacon.yaml` | Updated beacon configuration (if needed) |
| `/tmp/beacon_verification_local.txt` | Proof local beacon executed test command |
| `/tmp/beacon_verification_vps.txt` | Proof VPS beacon can still execute |
| `docs/RESULT-BeaconSynchronization-v1.0.md` | Documentation of fix and verification |

### Build Order

1. **Phase 1: Diagnose Auth Issue**
   - Examine beacon source code for scheduler implementation
   - Identify which API key is used for REST calls
   - Determine if service_role_key is needed

2. **Phase 2: Fix Configuration**
   - Update beacon.yaml if needed
   - Restart local beacon
   - Verify no more 401 errors in logs

3. **Phase 3: Test Command Execution**
   - Create targeted command for local beacon
   - Create targeted command for VPS beacon
   - Create non-targeted command
   - Verify all execute correctly

4. **Phase 4: Verify Synchronization**
   - Check test output files
   - Confirm both beacons operational
   - Document configuration and results

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| Local Beacon | Runs on Mac, claims targeted commands | beacon-ae0eee9f |
| VPS Beacon | Runs on VPS, claims any/non-targeted | vps-mentu-01 |
| Supabase | bridge_commands table, realtime | Both beacons subscribe |
| Mentu CLI | Creates test commands via SQL | Used for verification |

---

## Constraints

- Must NOT break existing VPS beacon functionality
- Must NOT change database schema
- Must maintain backwards compatibility with command structure
- Local beacon must run in headless mode (no GUI required)
- Both beacons must respect target_machine_id when specified

---

## Success Criteria

### Functional

- [ ] Local beacon runs without 401 Unauthorized errors
- [ ] Local beacon claims and executes targeted commands
- [ ] VPS beacon continues to work correctly
- [ ] Machine targeting works (local gets local-targeted, VPS gets VPS-targeted)
- [ ] Non-targeted commands can be claimed by either beacon

### Quality

- [ ] Beacon logs show clean operation (no recurring errors)
- [ ] Test commands execute within 60 seconds of creation
- [ ] Both beacon processes remain stable

### Integration

- [ ] Local and VPS beacons coexist without conflicts
- [ ] WebSocket and scheduler both functional
- [ ] Evidence files created proving execution

---

## Verification Commands

```bash
# Check local beacon status
tail -20 /tmp/beacon.log | grep ERROR

# Verify local beacon is running
ps aux | grep "[b]eacon --headless"

# Check for test evidence
ls -lh /tmp/beacon_verification_*.txt
cat /tmp/beacon_verification_local.txt
cat /tmp/beacon_verification_vps.txt

# Verify in database
mentu status
```

---

## References

- `mentu-beacon/src-tauri/src/engine/scheduler.rs`: Scheduler implementation
- `mentu-beacon/src-tauri/src/engine/supabase.rs`: WebSocket and API client
- `~/.mentu/beacon.yaml`: Beacon configuration file

---

*Fix authentication and synchronization issues to enable both local and VPS beacons to operate correctly with proper command routing and machine targeting.*
