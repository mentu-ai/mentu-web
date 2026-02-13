---
id: HANDOFF-ExecutorSingleton-v1.0
path: docs/HANDOFF-ExecutorSingleton-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

author_type: executor

parent: PRD-ExecutorSingleton-v1.0
children:
  - PROMPT-ExecutorSingleton-v1.0

mentu:
  commitment: pending
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: ExecutorSingleton v1.0

## For the Coding Agent

Implement cross-detection between mentu-beacon and mentu-bridge to prevent both from running simultaneously on the same machine.

**Read the full PRD**: `docs/PRD-ExecutorSingleton-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | user:dashboard |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directories | mentu-bridge, mentu-beacon |

---

## Build Order

### Stage 1: Create Executor Lock Module for Bridge

**File**: `mentu-bridge/src/executor-lock.ts`

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

export interface ExecutorLock {
  type: 'beacon' | 'bridge';
  pid: number;
  workspace_id: string;
  started_at: string;
}

const LOCK_DIR = path.join(os.homedir(), '.mentu');
const LOCK_PATH = path.join(LOCK_DIR, 'executor.lock');

/**
 * Check if a process with given PID is running
 */
function isProcessAlive(pid: number): boolean {
  try {
    // kill -0 doesn't actually kill, just checks if process exists
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check for an existing executor lock
 * Returns the lock info if another executor is running, null otherwise
 */
export function checkExecutorLock(): ExecutorLock | null {
  if (!fs.existsSync(LOCK_PATH)) {
    return null;
  }

  try {
    const content = fs.readFileSync(LOCK_PATH, 'utf-8');
    const lock: ExecutorLock = JSON.parse(content);

    // Check if the process is still alive
    if (isProcessAlive(lock.pid)) {
      return lock;
    }

    // Stale lock - process is dead
    console.log(`Removing stale executor lock (PID ${lock.pid} is dead)`);
    fs.unlinkSync(LOCK_PATH);
    return null;
  } catch (error) {
    // Invalid lock file - remove it
    console.log('Removing invalid executor lock file');
    try {
      fs.unlinkSync(LOCK_PATH);
    } catch {
      // Ignore
    }
    return null;
  }
}

/**
 * Acquire the executor lock
 * Throws if lock cannot be acquired
 */
export function acquireExecutorLock(workspaceId: string): void {
  // Ensure .mentu directory exists
  if (!fs.existsSync(LOCK_DIR)) {
    fs.mkdirSync(LOCK_DIR, { recursive: true });
  }

  const lock: ExecutorLock = {
    type: 'bridge',
    pid: process.pid,
    workspace_id: workspaceId,
    started_at: new Date().toISOString(),
  };

  fs.writeFileSync(LOCK_PATH, JSON.stringify(lock, null, 2));
  console.log(`Acquired executor lock (PID: ${process.pid})`);
}

/**
 * Release the executor lock
 * Only removes if we own the lock
 */
export function releaseExecutorLock(): void {
  if (!fs.existsSync(LOCK_PATH)) {
    return;
  }

  try {
    const content = fs.readFileSync(LOCK_PATH, 'utf-8');
    const lock: ExecutorLock = JSON.parse(content);

    // Only release if we own the lock
    if (lock.pid === process.pid) {
      fs.unlinkSync(LOCK_PATH);
      console.log('Released executor lock');
    }
  } catch {
    // Ignore errors during release
  }
}

/**
 * Get a helpful message for stopping the other executor
 */
export function getStopInstructions(lock: ExecutorLock): string {
  if (lock.type === 'beacon') {
    return 'To stop Beacon: Click the menu bar icon → Quit, or run: pkill -f beacon';
  } else {
    return `To stop Bridge: kill ${lock.pid}`;
  }
}
```

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-bridge
npx tsc --noEmit
```

---

### Stage 2: Integrate Lock in Bridge Entry Point

**File**: `mentu-bridge/src/index.ts`

Replace contents with:

```typescript
import { loadConfig } from './config';
import { BridgeDaemon } from './daemon';
import { checkExecutorLock, acquireExecutorLock, getStopInstructions } from './executor-lock';

async function main() {
  try {
    // Check for existing executor BEFORE loading config
    const existingLock = checkExecutorLock();
    if (existingLock) {
      console.error('');
      console.error('╔════════════════════════════════════════════════════════════╗');
      console.error('║  Another executor is already running on this machine       ║');
      console.error('╠════════════════════════════════════════════════════════════╣');
      console.error(`║  Type:    ${existingLock.type.padEnd(48)}║`);
      console.error(`║  PID:     ${String(existingLock.pid).padEnd(48)}║`);
      console.error(`║  Started: ${existingLock.started_at.padEnd(48)}║`);
      console.error('╠════════════════════════════════════════════════════════════╣');
      console.error(`║  ${getStopInstructions(existingLock).padEnd(57)}║`);
      console.error('╚════════════════════════════════════════════════════════════╝');
      console.error('');
      process.exit(1);
    }

    const config = loadConfig();

    // Acquire lock after config is loaded (need workspace_id)
    acquireExecutorLock(config.workspace.id);

    const daemon = new BridgeDaemon(config);
    await daemon.start();
  } catch (error) {
    console.error('Failed to start daemon:', error);
    process.exit(1);
  }
}

main();
```

**Verification**:
```bash
npx tsc --noEmit
```

---

### Stage 3: Add Lock Release to Bridge Shutdown

**File**: `mentu-bridge/src/daemon.ts`

Add import at top:

```typescript
import { releaseExecutorLock } from './executor-lock.js';
```

Modify `shutdown()` method (around line 681):

```typescript
async shutdown(): Promise<void> {
  this.log('Shutting down...');

  // Release executor lock FIRST
  releaseExecutorLock();

  // Stop scheduler
  this.scheduler.stop();
  // ... rest of existing shutdown code
```

**Verification**:
```bash
npx tsc --noEmit
npm run build
```

---

### Stage 4: Update Beacon Singleton to Use Shared Lock

**File**: `mentu-beacon/src-tauri/src/singleton.rs`

Replace the entire file with:

```rust
//! Executor lock management for Beacon
//!
//! Ensures only one executor (Beacon OR Bridge) runs at a time.
//! Uses a shared lock file at ~/.mentu/executor.lock containing JSON.

use serde::{Deserialize, Serialize};
use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process;
use tracing::{info, warn};

/// Lock file content
#[derive(Debug, Serialize, Deserialize)]
pub struct ExecutorLock {
    #[serde(rename = "type")]
    pub executor_type: String,
    pub pid: u32,
    pub workspace_id: String,
    pub started_at: String,
}

/// Result of checking lock status
#[derive(Debug)]
pub enum LockStatus {
    /// No other executor running, lock available
    Available,
    /// Another executor is running
    AlreadyRunning(ExecutorLock),
    /// Lock file exists but process is dead
    StaleLock,
}

/// Manages the shared executor lock file
pub struct SingletonLock {
    lock_path: PathBuf,
    workspace_id: String,
}

impl SingletonLock {
    /// Create a new singleton lock manager
    pub fn new(workspace_id: String) -> Self {
        let lock_path = dirs::home_dir()
            .expect("Could not find home directory")
            .join(".mentu")
            .join("executor.lock");

        Self { lock_path, workspace_id }
    }

    /// Check if another executor is running
    pub fn check_status(&self) -> LockStatus {
        if !self.lock_path.exists() {
            return LockStatus::Available;
        }

        // Read the lock file
        let mut file = match File::open(&self.lock_path) {
            Ok(f) => f,
            Err(_) => return LockStatus::Available,
        };

        let mut contents = String::new();
        if file.read_to_string(&mut contents).is_err() {
            return LockStatus::StaleLock;
        }

        // Parse JSON
        let lock: ExecutorLock = match serde_json::from_str(&contents) {
            Ok(l) => l,
            Err(_) => return LockStatus::StaleLock,
        };

        // Check if process is still running
        if Self::is_process_running(lock.pid) {
            LockStatus::AlreadyRunning(lock)
        } else {
            LockStatus::StaleLock
        }
    }

    /// Attempt to acquire the executor lock
    pub fn acquire(&self) -> Result<(), ExecutorLock> {
        // Ensure .mentu directory exists
        if let Some(parent) = self.lock_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        match self.check_status() {
            LockStatus::Available | LockStatus::StaleLock => {
                // Write our lock
                let lock = ExecutorLock {
                    executor_type: "beacon".to_string(),
                    pid: process::id(),
                    workspace_id: self.workspace_id.clone(),
                    started_at: chrono::Utc::now().to_rfc3339(),
                };

                let json = serde_json::to_string_pretty(&lock)
                    .map_err(|_| lock.clone())?;

                let mut file = OpenOptions::new()
                    .write(true)
                    .create(true)
                    .truncate(true)
                    .open(&self.lock_path)
                    .map_err(|_| lock.clone())?;

                write!(file, "{}", json).map_err(|_| lock.clone())?;
                info!("Acquired executor lock at {:?} (PID: {})", self.lock_path, process::id());
                Ok(())
            }
            LockStatus::AlreadyRunning(lock) => {
                warn!("{} is already running (PID: {})", lock.executor_type, lock.pid);
                Err(lock)
            }
        }
    }

    /// Release the executor lock
    pub fn release(&self) {
        if !self.lock_path.exists() {
            return;
        }

        // Only remove if we own the lock
        if let Ok(mut file) = File::open(&self.lock_path) {
            let mut contents = String::new();
            if file.read_to_string(&mut contents).is_ok() {
                if let Ok(lock) = serde_json::from_str::<ExecutorLock>(&contents) {
                    if lock.pid == process::id() {
                        let _ = fs::remove_file(&self.lock_path);
                        info!("Released executor lock");
                    }
                }
            }
        }
    }

    /// Get stop instructions for the running executor
    pub fn get_stop_instructions(lock: &ExecutorLock) -> String {
        if lock.executor_type == "beacon" {
            "To stop Beacon: Click the menu bar icon → Quit, or run: pkill -f beacon".to_string()
        } else {
            format!("To stop Bridge: kill {}", lock.pid)
        }
    }

    /// Check if a process with given PID is running
    #[cfg(unix)]
    fn is_process_running(pid: u32) -> bool {
        use std::process::Command;

        Command::new("kill")
            .args(["-0", &pid.to_string()])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }

    #[cfg(windows)]
    fn is_process_running(pid: u32) -> bool {
        use std::process::Command;

        Command::new("tasklist")
            .args(["/FI", &format!("PID eq {}", pid)])
            .output()
            .map(|output| {
                String::from_utf8_lossy(&output.stdout).contains(&pid.to_string())
            })
            .unwrap_or(false)
    }
}

impl Drop for SingletonLock {
    fn drop(&mut self) {
        self.release();
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    fn unique_test_lock_path(suffix: &str) -> PathBuf {
        env::temp_dir().join(format!("executor-test-{}-{}.lock", process::id(), suffix))
    }

    #[test]
    fn test_lock_available_when_no_file() {
        let lock_path = unique_test_lock_path("available");
        let _ = fs::remove_file(&lock_path);

        let lock = SingletonLock {
            lock_path: lock_path.clone(),
            workspace_id: "test".to_string(),
        };
        assert!(matches!(lock.check_status(), LockStatus::Available));
    }

    #[test]
    fn test_lock_acquire_and_release() {
        let lock_path = unique_test_lock_path("acquire");
        let _ = fs::remove_file(&lock_path);

        let lock = SingletonLock {
            lock_path: lock_path.clone(),
            workspace_id: "test".to_string(),
        };
        assert!(lock.acquire().is_ok());
        assert!(lock_path.exists());

        // Verify JSON content
        let content = fs::read_to_string(&lock_path).unwrap();
        let parsed: ExecutorLock = serde_json::from_str(&content).unwrap();
        assert_eq!(parsed.executor_type, "beacon");
        assert_eq!(parsed.pid, process::id());

        lock.release();
        assert!(!lock_path.exists());
    }

    #[test]
    fn test_lock_detects_stale() {
        let lock_path = unique_test_lock_path("stale");

        // Write a lock with a fake PID
        let fake_lock = ExecutorLock {
            executor_type: "bridge".to_string(),
            pid: 999999999,
            workspace_id: "test".to_string(),
            started_at: "2026-01-01T00:00:00Z".to_string(),
        };
        fs::write(&lock_path, serde_json::to_string(&fake_lock).unwrap()).unwrap();

        let lock = SingletonLock {
            lock_path: lock_path.clone(),
            workspace_id: "test".to_string(),
        };
        assert!(matches!(lock.check_status(), LockStatus::StaleLock));

        // Should be able to acquire after stale lock
        assert!(lock.acquire().is_ok());
        let _ = fs::remove_file(&lock_path);
    }
}
```

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo check
```

---

### Stage 5: Update Beacon Main to Pass Workspace ID

**File**: `mentu-beacon/src-tauri/src/main.rs`

Update the singleton check section (around line 81) to pass workspace_id and handle the new error type:

Find:
```rust
    // Singleton check (skip if --allow-multiple or simple info commands)
    let _singleton_guard = if !args.allow_multiple && !args.config && !args.setup && !args.status {
        let lock = SingletonLock::new();
        match lock.acquire() {
            Ok(()) => Some(lock),
            Err(existing_pid) => {
                eprintln!("Beacon is already running (PID: {})", existing_pid);
                eprintln!("Use --allow-multiple to run additional instances");
                std::process::exit(1);
            }
        }
```

Replace with:
```rust
    // Load config early to get workspace_id for singleton lock
    let config = match BeaconConfig::load() {
        Ok(c) => c,
        Err(e) => {
            // For info commands, config errors are fatal
            if args.config || args.setup {
                // These don't need config
            } else {
                eprintln!("Error: {}", e);
                std::process::exit(1);
            }
            BeaconConfig::create_default() // Fallback for --config/--setup
        }
    };

    // Singleton check (skip if --allow-multiple or simple info commands)
    let _singleton_guard = if !args.allow_multiple && !args.config && !args.setup && !args.status {
        let lock = SingletonLock::new(config.workspace.id.clone());
        match lock.acquire() {
            Ok(()) => Some(lock),
            Err(existing_lock) => {
                eprintln!("");
                eprintln!("╔════════════════════════════════════════════════════════════╗");
                eprintln!("║  Another executor is already running on this machine       ║");
                eprintln!("╠════════════════════════════════════════════════════════════╣");
                eprintln!("║  Type:    {:<48}║", existing_lock.executor_type);
                eprintln!("║  PID:     {:<48}║", existing_lock.pid);
                eprintln!("║  Started: {:<48}║", existing_lock.started_at);
                eprintln!("╠════════════════════════════════════════════════════════════╣");
                eprintln!("║  {:<57}║", SingletonLock::get_stop_instructions(&existing_lock));
                eprintln!("╚════════════════════════════════════════════════════════════╝");
                eprintln!("");
                std::process::exit(1);
            }
        }
```

Also remove the duplicate config loading later in main() since we now load it earlier.

**Verification**:
```bash
cargo check
cargo build --release
```

---

### Stage 6: Build and Test

**Build Bridge**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-bridge
npm run build
```

**Build Beacon**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo build --release
```

**Run Unit Tests**:
```bash
# Bridge
cd /Users/rashid/Desktop/Workspaces/mentu-bridge
npm test

# Beacon
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo test singleton
```

**Integration Tests**:

```bash
#!/bin/bash
# test-cross-detection.sh

BEACON="/Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri/target/release/beacon"
BRIDGE_DIR="/Users/rashid/Desktop/Workspaces/mentu-bridge"
LOCK_FILE="$HOME/.mentu/executor.lock"

# Cleanup
rm -f "$LOCK_FILE"
pkill -f beacon 2>/dev/null
pkill -f "node.*mentu-bridge" 2>/dev/null
sleep 2

echo "=== Test 1: Bridge blocks Beacon ==="
cd "$BRIDGE_DIR"
npm start &
BRIDGE_PID=$!
sleep 5

echo "Lock file contents:"
cat "$LOCK_FILE"
echo ""

echo "Attempting to start Beacon..."
$BEACON --headless 2>&1 | head -20
BEACON_EXIT=$?

if [ $BEACON_EXIT -ne 0 ]; then
    echo "PASS: Beacon refused to start (exit $BEACON_EXIT)"
else
    echo "FAIL: Beacon should have been blocked"
fi

kill $BRIDGE_PID 2>/dev/null
sleep 2

echo ""
echo "=== Test 2: Beacon blocks Bridge ==="
rm -f "$LOCK_FILE"

$BEACON --headless &
BEACON_PID=$!
sleep 3

echo "Lock file contents:"
cat "$LOCK_FILE"
echo ""

echo "Attempting to start Bridge..."
cd "$BRIDGE_DIR"
timeout 5 npm start 2>&1 | head -20
BRIDGE_EXIT=$?

if [ $BRIDGE_EXIT -ne 0 ]; then
    echo "PASS: Bridge refused to start"
else
    echo "FAIL: Bridge should have been blocked"
fi

kill $BEACON_PID 2>/dev/null

echo ""
echo "=== Cleanup ==="
rm -f "$LOCK_FILE"
echo "Done"
```

---

## Verification Checklist

### Files
- [ ] `mentu-bridge/src/executor-lock.ts` created
- [ ] `mentu-bridge/src/index.ts` modified
- [ ] `mentu-bridge/src/daemon.ts` modified
- [ ] `mentu-beacon/src-tauri/src/singleton.rs` updated
- [ ] `mentu-beacon/src-tauri/src/main.rs` updated

### Checks
- [ ] `npm run build` succeeds (mentu-bridge)
- [ ] `cargo build --release` succeeds (mentu-beacon)
- [ ] Unit tests pass (both)

### Functionality
- [ ] Bridge blocks Beacon when running first
- [ ] Beacon blocks Bridge when running first
- [ ] Lock file at `~/.mentu/executor.lock`
- [ ] Lock contains JSON with type, pid, workspace_id, started_at
- [ ] Helpful error messages with stop instructions
- [ ] Stale locks cleaned automatically
- [ ] Lock released on clean shutdown

---

*Single executor per machine ensures predictable command processing.*
