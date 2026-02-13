---
id: PRD-ExecutorSingleton-v1.0
path: docs/PRD-ExecutorSingleton-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

children:
  - HANDOFF-ExecutorSingleton-v1.0
dependencies: []

mentu:
  commitment: pending
  status: pending
---

# PRD: ExecutorSingleton v1.0

## Mission

Prevent mentu-beacon and mentu-bridge from running simultaneously on the same machine, ensuring exactly one executor claims and processes commands without race conditions or duplicate work.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────┐
│  Same Machine (Mac)                                             │
│                                                                 │
│  ┌─────────────────┐       ┌─────────────────┐                 │
│  │  mentu-beacon   │       │  mentu-bridge   │                 │
│  │  (Rust/Tauri)   │       │  (TypeScript)   │                 │
│  │                 │       │                 │                 │
│  │  Has singleton  │       │  No singleton   │                 │
│  │  ~/.mentu/      │       │  Can run        │                 │
│  │  beacon.lock    │       │  unlimited      │                 │
│  └────────┬────────┘       └────────┬────────┘                 │
│           │                         │                          │
│           └──────────┬──────────────┘                          │
│                      │                                          │
│                      ▼                                          │
│           ┌─────────────────────┐                              │
│           │  Supabase           │                              │
│           │  bridge_commands    │                              │
│           │                     │                              │
│           │  Command arrives    │                              │
│           │       │             │                              │
│           │  ┌────┴────┐        │                              │
│           │  ▼         ▼        │                              │
│           │ Beacon   Bridge     │  ← RACE CONDITION!           │
│           │ claims   claims     │                              │
│           └─────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
1. Both executors subscribe to same WebSocket channel
2. Both compete to claim same commands
3. One might win claim, other processes anyway
4. Duplicate machine registrations in bridge_machines
5. Wasted resources (CPU, memory, API calls)

### Desired State

```
┌─────────────────────────────────────────────────────────────────┐
│  Same Machine (Mac)                                             │
│                                                                 │
│  User starts Beacon...                                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Check: Is ANY executor running?                         │   │
│  │                                                          │   │
│  │  ~/.mentu/executor.lock                                  │   │
│  │  {                                                       │   │
│  │    "type": "bridge",                                     │   │
│  │    "pid": 12345,                                         │   │
│  │    "started_at": "2026-01-11T10:00:00Z"                 │   │
│  │  }                                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                      │                                          │
│                      ▼                                          │
│           Lock exists & PID alive?                              │
│                      │                                          │
│           ├── YES → "Bridge is running. Stop it first."        │
│           │         Exit with helpful message                   │
│           │                                                     │
│           └── NO  → Acquire lock, start normally                │
│                                                                 │
│  Result: Exactly ONE executor per machine                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Executor Lock

A shared lock file at `~/.mentu/executor.lock` that both Beacon and Bridge check before starting. Contains JSON with executor type, PID, and timestamp.

```json
{
  "type": "beacon",
  "pid": 12345,
  "workspace_id": "9584ae30-14f5-448a-9ff1-5a6f5caf6312",
  "started_at": "2026-01-11T22:15:50.335Z"
}
```

### Cross-Detection

Each executor checks for the OTHER executor before starting:
- Beacon checks: Is Bridge running?
- Bridge checks: Is Beacon running?

If found, exit with a helpful message explaining which executor is running and how to stop it.

---

## Specification

### Lock File Format

**Path:** `~/.mentu/executor.lock`

**Schema:**
```typescript
interface ExecutorLock {
  type: 'beacon' | 'bridge';
  pid: number;
  workspace_id: string;
  started_at: string;  // ISO 8601
}
```

### Operations

| Operation | Description |
|-----------|-------------|
| `checkLock()` | Read lock file, check if PID is alive |
| `acquireLock()` | Write lock file with current executor info |
| `releaseLock()` | Remove lock file on shutdown |
| `isProcessAlive(pid)` | Platform-specific process check |

### State Machine

```
┌───────────────┐
│    START      │
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────┐
│  Read ~/.mentu/executor.lock      │
└───────────────┬───────────────────┘
        │
        ├── File not found ────────────────────┐
        │                                      │
        ├── File exists, parse JSON            │
        │       │                              │
        │       ▼                              │
        │  ┌─────────────────────────────┐    │
        │  │ Check: is PID alive?        │    │
        │  └─────────────┬───────────────┘    │
        │                │                     │
        │       ┌────────┴────────┐           │
        │       ▼                 ▼           │
        │   PID alive         PID dead        │
        │       │                 │           │
        │       ▼                 ▼           │
        │   ┌───────────┐    ┌───────────┐   │
        │   │   EXIT    │    │ Stale lock│   │
        │   │ (already  │    │ (remove)  │───┤
        │   │  running) │    └───────────┘   │
        │   └───────────┘                     │
        │                                      │
        └──────────────────────────────────────┤
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  Write lock file    │
                                    │  with our info      │
                                    └──────────┬──────────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │  Continue startup   │
                                    └─────────────────────┘
```

---

## Implementation

### Changes to mentu-bridge

**File:** `src/executor-lock.ts` (new)

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface ExecutorLock {
  type: 'beacon' | 'bridge';
  pid: number;
  workspace_id: string;
  started_at: string;
}

const LOCK_PATH = path.join(os.homedir(), '.mentu', 'executor.lock');

export function checkExecutorLock(): ExecutorLock | null {
  // Read and validate lock, check if PID is alive
}

export function acquireExecutorLock(workspaceId: string): void {
  // Write lock file
}

export function releaseExecutorLock(): void {
  // Remove lock file if we own it
}

export function isProcessAlive(pid: number): boolean {
  // Platform-specific check
}
```

**File:** `src/index.ts` (modify)

Add lock check before `daemon.start()`:

```typescript
import { checkExecutorLock, acquireExecutorLock } from './executor-lock';

async function main() {
  // Check for existing executor
  const existingLock = checkExecutorLock();
  if (existingLock) {
    console.error(`Another executor is already running:`);
    console.error(`  Type: ${existingLock.type}`);
    console.error(`  PID: ${existingLock.pid}`);
    console.error(`  Started: ${existingLock.started_at}`);
    console.error('');
    if (existingLock.type === 'beacon') {
      console.error('To stop Beacon: Click menu bar icon → Quit');
    } else {
      console.error('To stop Bridge: kill ' + existingLock.pid);
    }
    process.exit(1);
  }

  // Acquire lock
  acquireExecutorLock(config.workspace.id);

  // ... rest of startup
}
```

**File:** `src/daemon.ts` (modify)

Add lock release in `shutdown()`:

```typescript
import { releaseExecutorLock } from './executor-lock';

async shutdown(): Promise<void> {
  this.log('Shutting down...');

  // Release executor lock
  releaseExecutorLock();

  // ... rest of shutdown
}
```

### Changes to mentu-beacon

**File:** `src-tauri/src/singleton.rs` (modify)

Update to use shared executor.lock instead of beacon.lock:

```rust
// Change lock path
let lock_path = dirs::home_dir()
    .expect("Could not find home directory")
    .join(".mentu")
    .join("executor.lock");  // Changed from beacon.lock

// Change lock format to JSON
#[derive(Serialize, Deserialize)]
struct ExecutorLock {
    #[serde(rename = "type")]
    executor_type: String,  // "beacon"
    pid: u32,
    workspace_id: String,
    started_at: String,
}
```

---

## Success Criteria

### Functional

- [ ] Bridge refuses to start if Beacon is running
- [ ] Beacon refuses to start if Bridge is running
- [ ] Lock file created at `~/.mentu/executor.lock`
- [ ] Lock file contains JSON with type, pid, workspace_id, started_at
- [ ] Stale locks (dead PID) are automatically cleaned
- [ ] Lock released on clean shutdown (both executors)

### Quality

- [ ] `npm run build` succeeds for mentu-bridge
- [ ] `cargo build --release` succeeds for mentu-beacon
- [ ] Unit tests pass for lock module

### Messages

- [ ] Clear error message when Beacon blocks Bridge
- [ ] Clear error message when Bridge blocks Beacon
- [ ] Instructions on how to stop the running executor

---

## Migration

### Beacon Lock Migration

Beacon currently uses `~/.mentu/beacon.lock` with plain PID format. Migration:

1. On startup, check for old `beacon.lock`
2. If exists and PID alive, migrate to new `executor.lock` format
3. Remove old `beacon.lock`
4. If stale, just remove old file

---

## Verification Commands

```bash
# Test 1: Start Bridge, then try Beacon
cd /Users/rashid/Desktop/Workspaces/mentu-bridge
npm start &
# Wait for startup

cd /Users/rashid/Desktop/Workspaces/mentu-beacon
./src-tauri/target/release/beacon --headless
# Expected: "Bridge is already running (PID: xxxxx)"

# Test 2: Start Beacon, then try Bridge
pkill -f mentu-bridge
./src-tauri/target/release/beacon --headless &
# Wait for startup

cd /Users/rashid/Desktop/Workspaces/mentu-bridge
npm start
# Expected: "Beacon is already running (PID: xxxxx)"

# Test 3: Verify lock file
cat ~/.mentu/executor.lock
# Expected: JSON with type, pid, workspace_id, started_at
```

---

*Ensure single executor per machine for predictable command processing.*
