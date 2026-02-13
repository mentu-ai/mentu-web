---
id: HANDOFF-BeaconSingleton-v1.0
path: docs/HANDOFF-BeaconSingleton-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

author_type: executor

parent: PRD-BeaconSingleton-v1.0
children:
  - PROMPT-BeaconSingleton-v1.0

mentu:
  commitment: cmt_228cb0ba
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: BeaconSingleton v1.0

## For the Coding Agent

Implement a singleton pattern for the Mentu Beacon to prevent multiple instances from running simultaneously, ensuring exactly one menu bar icon and consistent command claiming.

**Read the full PRD**: `docs/PRD-BeaconSingleton-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | user:dashboard |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-beacon |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Beacon Singleton",
  "tier": "T2",
  "required_files": [
    "mentu-beacon/src-tauri/src/singleton.rs",
    "mentu-beacon/src-tauri/src/main.rs"
  ],
  "checks": {
    "tsc": false,
    "build": true,
    "test": true
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
  "max_iterations": 40
}
```

---

## Mentu Protocol

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon

# Claim commitment
mentu claim cmt_XXXXXXXX

# Capture progress
mentu capture "{Progress}" --kind execution-progress
```

---

## Visual Verification

**Skip this section** - this feature has no user interface components beyond the existing menu bar icon.

---

## Build Order

### Stage 1: Create Singleton Module

Create a new module to handle singleton lock management.

**File**: `src-tauri/src/singleton.rs`

```rust
//! Singleton lock management for Beacon
//!
//! Ensures only one instance of Beacon runs at a time.
//! Uses a lock file at ~/.mentu/beacon.lock containing the PID.

use std::fs::{self, File, OpenOptions};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process;
use tracing::{info, warn};

/// Result of checking singleton status
#[derive(Debug)]
pub enum SingletonStatus {
    /// No other instance running, lock available
    Available,
    /// Another instance is running with this PID
    AlreadyRunning(u32),
    /// Lock file exists but process is dead
    StaleLock,
}

/// Manages the singleton lock file
pub struct SingletonLock {
    lock_path: PathBuf,
}

impl SingletonLock {
    /// Create a new singleton lock manager
    pub fn new() -> Self {
        let lock_path = dirs::home_dir()
            .expect("Could not find home directory")
            .join(".mentu")
            .join("beacon.lock");

        Self { lock_path }
    }

    /// Get the lock file path
    pub fn lock_path(&self) -> &PathBuf {
        &self.lock_path
    }

    /// Check if another instance is running
    pub fn check_status(&self) -> SingletonStatus {
        if !self.lock_path.exists() {
            return SingletonStatus::Available;
        }

        // Read the PID from lock file
        let mut file = match File::open(&self.lock_path) {
            Ok(f) => f,
            Err(_) => return SingletonStatus::Available,
        };

        let mut contents = String::new();
        if file.read_to_string(&mut contents).is_err() {
            return SingletonStatus::StaleLock;
        }

        let pid: u32 = match contents.trim().parse() {
            Ok(p) => p,
            Err(_) => return SingletonStatus::StaleLock,
        };

        // Check if process is still running
        if Self::is_process_running(pid) {
            SingletonStatus::AlreadyRunning(pid)
        } else {
            SingletonStatus::StaleLock
        }
    }

    /// Attempt to acquire the singleton lock
    /// Returns Ok(()) if lock acquired, Err with existing PID if already running
    pub fn acquire(&self) -> Result<(), u32> {
        // Ensure .mentu directory exists
        if let Some(parent) = self.lock_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        match self.check_status() {
            SingletonStatus::Available | SingletonStatus::StaleLock => {
                // Write our PID to the lock file
                let pid = process::id();
                let mut file = OpenOptions::new()
                    .write(true)
                    .create(true)
                    .truncate(true)
                    .open(&self.lock_path)
                    .map_err(|_| 0u32)?;

                write!(file, "{}", pid).map_err(|_| 0u32)?;
                info!("Acquired singleton lock at {:?} (PID: {})", self.lock_path, pid);
                Ok(())
            }
            SingletonStatus::AlreadyRunning(pid) => {
                warn!("Beacon is already running (PID: {})", pid);
                Err(pid)
            }
        }
    }

    /// Release the singleton lock
    pub fn release(&self) {
        if self.lock_path.exists() {
            // Only remove if we own the lock
            if let Ok(mut file) = File::open(&self.lock_path) {
                let mut contents = String::new();
                if file.read_to_string(&mut contents).is_ok() {
                    if let Ok(pid) = contents.trim().parse::<u32>() {
                        if pid == process::id() {
                            let _ = fs::remove_file(&self.lock_path);
                            info!("Released singleton lock");
                        }
                    }
                }
            }
        }
    }

    /// Check if a process with given PID is running
    #[cfg(unix)]
    fn is_process_running(pid: u32) -> bool {
        use std::process::Command;

        // Use kill -0 to check if process exists
        Command::new("kill")
            .args(["-0", &pid.to_string()])
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    }

    #[cfg(windows)]
    fn is_process_running(pid: u32) -> bool {
        // On Windows, use tasklist
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
    use std::fs;

    fn test_lock_path() -> PathBuf {
        env::temp_dir().join("beacon-test.lock")
    }

    #[test]
    fn test_singleton_available_when_no_lock() {
        let lock_path = test_lock_path();
        let _ = fs::remove_file(&lock_path);

        let lock = SingletonLock { lock_path: lock_path.clone() };
        assert!(matches!(lock.check_status(), SingletonStatus::Available));
    }

    #[test]
    fn test_singleton_acquire_and_release() {
        let lock_path = test_lock_path();
        let _ = fs::remove_file(&lock_path);

        let lock = SingletonLock { lock_path: lock_path.clone() };
        assert!(lock.acquire().is_ok());
        assert!(lock_path.exists());

        // Check we're recorded as running
        let mut contents = String::new();
        File::open(&lock_path)
            .unwrap()
            .read_to_string(&mut contents)
            .unwrap();
        assert_eq!(contents.trim(), process::id().to_string());

        lock.release();
        assert!(!lock_path.exists());
    }

    #[test]
    fn test_singleton_detects_stale_lock() {
        let lock_path = test_lock_path();

        // Write a fake PID that definitely doesn't exist
        fs::write(&lock_path, "999999999").unwrap();

        let lock = SingletonLock { lock_path: lock_path.clone() };
        assert!(matches!(lock.check_status(), SingletonStatus::StaleLock));

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

### Stage 2: Add Singleton Module to Main

Declare the singleton module in the module tree.

**File**: `src-tauri/src/main.rs`

Add after the existing mod declarations:

```rust
mod singleton;
```

And add the use statement:

```rust
use singleton::SingletonLock;
```

**Verification**:
```bash
cargo check
```

---

### Stage 3: Integrate Singleton Check in Main

Modify the `main()` function to check for existing instances before starting.

**File**: `src-tauri/src/main.rs`

Add a new flag to Args struct:

```rust
    /// Allow multiple instances (for development)
    #[arg(long)]
    allow_multiple: bool,
```

Add singleton check at the start of `main()`, after parsing args but before loading config:

```rust
    // Singleton check (skip if --allow-multiple)
    let singleton_lock = if !args.allow_multiple && !args.headless {
        let lock = SingletonLock::new();
        match lock.acquire() {
            Ok(()) => Some(lock),
            Err(existing_pid) => {
                eprintln!("Beacon is already running (PID: {})", existing_pid);
                eprintln!("Use --allow-multiple to run additional instances");
                std::process::exit(1);
            }
        }
    } else if !args.allow_multiple && args.headless {
        // Headless mode also uses singleton
        let lock = SingletonLock::new();
        match lock.acquire() {
            Ok(()) => Some(lock),
            Err(existing_pid) => {
                eprintln!("Beacon is already running (PID: {})", existing_pid);
                eprintln!("Use --allow-multiple to run additional instances");
                std::process::exit(1);
            }
        }
    } else {
        info!("Running with --allow-multiple, skipping singleton check");
        None
    };

    // Keep lock alive for the duration of the program
    let _singleton_guard = singleton_lock;
```

**Verification**:
```bash
cargo check
```

---

### Stage 4: Build and Test

Build the release version and run comprehensive tests.

**Build**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo build --release
```

**Run Unit Tests**:
```bash
cargo test singleton
```

**Integration Test Script**:
```bash
#!/bin/bash
# Test singleton behavior

BEACON="/Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri/target/release/beacon"
LOCK_FILE="$HOME/.mentu/beacon.lock"

# Clean up any existing locks
rm -f "$LOCK_FILE"

echo "=== Test 1: First instance should start ==="
$BEACON --headless &
PID1=$!
sleep 3

if [ -f "$LOCK_FILE" ]; then
    echo "PASS: Lock file created"
    cat "$LOCK_FILE"
else
    echo "FAIL: Lock file not created"
    exit 1
fi

echo ""
echo "=== Test 2: Second instance should fail ==="
$BEACON --headless 2>&1 &
PID2=$!
sleep 2

# Check if second instance exited
if ! kill -0 $PID2 2>/dev/null; then
    echo "PASS: Second instance exited as expected"
else
    echo "FAIL: Second instance should have exited"
    kill $PID2 2>/dev/null
fi

echo ""
echo "=== Test 3: --allow-multiple should work ==="
$BEACON --headless --allow-multiple &
PID3=$!
sleep 2

if kill -0 $PID3 2>/dev/null; then
    echo "PASS: Third instance started with --allow-multiple"
    kill $PID3 2>/dev/null
else
    echo "FAIL: Third instance should have started"
fi

echo ""
echo "=== Test 4: Lock should be released on shutdown ==="
kill $PID1 2>/dev/null
sleep 2

if [ -f "$LOCK_FILE" ]; then
    # Check if it's a stale lock (PID1 should be dead)
    LOCK_PID=$(cat "$LOCK_FILE")
    if ! kill -0 $LOCK_PID 2>/dev/null; then
        echo "PASS: Process dead, lock is stale (will be cleaned on next start)"
    else
        echo "FAIL: Lock file still held by running process"
    fi
else
    echo "PASS: Lock file released"
fi

echo ""
echo "=== Test 5: Stale lock should be overwritten ==="
echo "999999999" > "$LOCK_FILE"
$BEACON --headless &
PID5=$!
sleep 3

if kill -0 $PID5 2>/dev/null; then
    echo "PASS: Started despite stale lock"
    NEW_PID=$(cat "$LOCK_FILE")
    if [ "$NEW_PID" = "$PID5" ]; then
        echo "PASS: Lock file contains new PID"
    else
        echo "FAIL: Lock file should contain PID $PID5, got $NEW_PID"
    fi
    kill $PID5 2>/dev/null
else
    echo "FAIL: Should have started"
fi

echo ""
echo "=== Cleanup ==="
rm -f "$LOCK_FILE"
pkill -f "beacon --headless" 2>/dev/null
echo "Done"
```

Save as `test-singleton.sh` and run:
```bash
chmod +x test-singleton.sh
./test-singleton.sh
```

**Rebuild App Bundle**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon
npm run tauri build
```

**Copy to Applications**:
```bash
rm -rf /Applications/Beacon.app
cp -R src-tauri/target/release/bundle/macos/Beacon.app /Applications/
```

---

### Stage 5: GUI Mode Testing

Test the singleton in GUI mode:

```bash
# Kill any running beacons
pkill -f Beacon

# Start first instance
open /Applications/Beacon.app
sleep 3

# Check menu bar - should show ONE icon

# Try to start second instance - should fail
open /Applications/Beacon.app
# Expected: No new icon appears, original stays

# Verify only one process
ps aux | grep -i beacon | grep -v grep
# Should show only ONE beacon process
```

---

## Before Submitting

This is a Rust-only change. Run validators:

1. Use Task tool with `subagent_type="technical-validator"` for Rust code review
2. Use Task tool with `subagent_type="intent-validator"` to verify singleton matches PRD

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

```bash
# Read the template
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-BeaconSingleton-v1.0.md
```

Include:
- Summary of singleton implementation
- Files created (singleton.rs) and modified (main.rs)
- Test results (unit tests, integration tests)
- Build verification

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-BeaconSingleton: Singleton pattern implemented with lock file" \
  --kind result-document \
  --path docs/RESULT-BeaconSingleton-v1.0.md \
  --refs cmt_XXXXXXXX
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY  # ← The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "Implemented beacon singleton pattern with lock file at ~/.mentu/beacon.lock" \
  --include-files
```

---

## Verification Checklist

### Files
- [ ] `src-tauri/src/singleton.rs` created
- [ ] `src-tauri/src/main.rs` modified with singleton check
- [ ] `--allow-multiple` flag added

### Checks
- [ ] `cargo build --release` succeeds
- [ ] `cargo test singleton` passes
- [ ] Integration tests pass (test-singleton.sh)

### Mentu
- [ ] Commitment claimed
- [ ] **RESULT document created**
- [ ] **RESULT captured as evidence**
- [ ] Commitment submitted

### Functionality
- [ ] First instance starts normally
- [ ] Second instance exits with "already running" message
- [ ] Lock file created at `~/.mentu/beacon.lock`
- [ ] Lock file released on clean shutdown
- [ ] Stale locks are overwritten
- [ ] `--allow-multiple` bypasses singleton check
- [ ] GUI mode shows exactly one menu bar icon

---

*Ensure exactly one beacon instance for predictable operation.*
