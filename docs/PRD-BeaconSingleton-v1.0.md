---
id: PRD-BeaconSingleton-v1.0
path: docs/PRD-BeaconSingleton-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

children:
  - HANDOFF-BeaconSingleton-v1.0
dependencies: []

mentu:
  commitment: cmt_228cb0ba
  status: pending
---

# PRD: BeaconSingleton v1.0

## Mission

Ensure that only one instance of the Mentu Beacon application can run at a time on macOS, preventing duplicate menu bar icons, conflicting command claims, and wasted system resources. This creates a clean, predictable user experience with exactly one beacon icon in the menu bar.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│  User launches beacon manually or via automation                │
│                                                                 │
│  open /Applications/Beacon.app      (Instance 1)                │
│  open /path/to/dev/Beacon.app       (Instance 2)                │
│  ./target/release/beacon            (Instance 3)                │
│  ./target/release/beacon --headless (Instance 4)                │
│                                                                 │
│  Menu Bar: [🔵] [🔵] [🔵] [🔵]   ← 4 duplicate icons!           │
│                                                                 │
│  Each instance:                                                 │
│  - Subscribes to same WebSocket channel                         │
│  - Competes to claim same commands                              │
│  - Registers separate machine IDs                               │
│  - Consumes separate memory/CPU                                 │
└─────────────────────────────────────────────────────────────────┘
```

The beacon can be launched multiple times from:
- Different app bundle locations (/Applications vs target/release/bundle)
- Direct binary execution vs app bundle
- GUI mode vs headless mode overlapping
- Accidental double-clicks or automation scripts

### Desired State

```
┌─────────────────────────────────────────────────────────────────┐
│  User attempts to launch beacon                                 │
│                                                                 │
│  open /Applications/Beacon.app                                  │
│      ↓                                                          │
│  ┌───────────────────────────────────┐                         │
│  │ Check: Is beacon already running? │                         │
│  └───────────────────────────────────┘                         │
│      │                                                          │
│      ├── YES → Focus existing instance, exit new one            │
│      │         (or show "already running" notification)         │
│      │                                                          │
│      └── NO  → Start normally, create lock file                 │
│                                                                 │
│  Menu Bar: [🔵]   ← Exactly ONE icon, always                    │
│                                                                 │
│  Guarantees:                                                    │
│  - One WebSocket connection                                     │
│  - One machine registration                                     │
│  - Consistent command claiming                                  │
│  - Minimal resource usage                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Beacon Singleton",
  "tier": "T2",
  "required_files": [
    "mentu-beacon/src-tauri/src/main.rs",
    "mentu-beacon/src-tauri/src/singleton.rs"
  ],
  "checks": {
    "tsc": false,
    "build": true,
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
  "max_iterations": 30
}
```

---

## Core Concepts

### Singleton Pattern

A design pattern ensuring only one instance of an application exists. For macOS apps, this typically uses:
- Lock files in a known location
- Unix domain sockets
- NSRunningApplication checking
- macOS app activation (bringing existing window to front)

### Lock File

A file placed in a known location (e.g., `~/.mentu/beacon.lock`) containing the PID of the running instance. Before starting, the app checks if this file exists and if the PID is still alive.

### Instance ID

The unique identifier assigned to each beacon instance (e.g., `beacon-4b821eba`). In singleton mode, there should only ever be ONE active instance ID at a time per machine.

---

## Specification

### Types

```rust
// Singleton lock manager
pub struct SingletonLock {
    lock_path: PathBuf,
    pid: u32,
}

pub enum SingletonStatus {
    Available,           // No other instance running
    AlreadyRunning(u32), // Another instance with this PID
    StaleLock,           // Lock file exists but process dead
}
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `acquire_lock` | `lock_path` | `Result<SingletonLock, SingletonStatus>` | Attempt to acquire singleton lock |
| `release_lock` | `SingletonLock` | `()` | Release lock on shutdown |
| `check_status` | `lock_path` | `SingletonStatus` | Check if another instance is running |
| `focus_existing` | `pid` | `bool` | Attempt to focus existing instance window |

### State Machine

```
┌───────────┐      Lock Available       ┌───────────┐
│  LAUNCH   │ ─────────────────────────▶│  RUNNING  │
└───────────┘                            └───────────┘
      │                                        │
      │ Lock Held                              │ Shutdown
      ▼                                        ▼
┌───────────┐                            ┌───────────┐
│   EXIT    │                            │ RELEASED  │
│ (notify)  │                            │  (clean)  │
└───────────┘                            └───────────┘
```

| State | Meaning | Valid Transitions |
|-------|---------|-------------------|
| `LAUNCH` | App starting, checking lock | → `RUNNING`, `EXIT` |
| `RUNNING` | Lock acquired, beacon active | → `RELEASED` |
| `EXIT` | Another instance running | Terminal |
| `RELEASED` | Clean shutdown, lock removed | Terminal |

### Validation Rules

- Lock file MUST be removed on clean shutdown
- Stale lock files (dead PID) MUST be overwritten
- GUI mode and headless mode MUST share the same lock
- Lock file path MUST be in `~/.mentu/beacon.lock`

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src-tauri/src/singleton.rs` | Singleton lock management module |
| `src-tauri/src/main.rs` | Modified to check singleton before starting |

### Build Order

1. **Create Singleton Module**: Implement `SingletonLock` with acquire/release/check
2. **Integrate in Main**: Add singleton check as first action in `main()`
3. **Handle Conflicts**: Show notification and exit if already running
4. **Clean Shutdown**: Ensure lock is released on exit (signal handlers)

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| `main.rs` | First check before config load | Must happen before any engine initialization |
| `tauri::Builder` | On window close event | Release lock on app quit |
| Signal handlers | SIGTERM/SIGINT | Release lock on forced shutdown |

---

## Constraints

- MUST work on macOS (primary platform)
- MUST work for both GUI and headless modes
- MUST NOT require elevated permissions
- MUST handle crash recovery (stale locks)
- MUST allow intentional multi-instance for development (`--allow-multiple` flag)

---

## Success Criteria

### Functional

- [ ] Launching beacon when already running shows notification and exits
- [ ] Lock file is created at `~/.mentu/beacon.lock` on start
- [ ] Lock file is removed on clean shutdown
- [ ] Stale lock files (dead PID) are automatically cleaned
- [ ] `--allow-multiple` flag bypasses singleton check

### Quality

- [ ] `cargo build --release` succeeds
- [ ] No compiler warnings about singleton code
- [ ] Lock file operations are atomic (prevent race conditions)

### Integration

- [ ] Works with GUI mode (Beacon.app)
- [ ] Works with headless mode (--headless)
- [ ] Shutdown signal handlers release lock
- [ ] Tauri app close releases lock

---

## Verification Commands

```bash
# Build beacon
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo build --release

# Test singleton - first instance
./target/release/beacon &
PID1=$!
sleep 2

# Test singleton - second instance should fail
./target/release/beacon
# Expected: "Beacon is already running" message and exit

# Verify lock file
cat ~/.mentu/beacon.lock
# Expected: PID of first instance

# Clean shutdown
kill $PID1
sleep 1
cat ~/.mentu/beacon.lock 2>/dev/null || echo "Lock released (correct)"
```

---

## References

- Rust `fs2` crate: File locking primitives
- Tauri docs: App lifecycle and shutdown handling
- macOS `NSRunningApplication`: Native singleton patterns

---

*Guarantee single-instance operation for predictable beacon behavior.*
