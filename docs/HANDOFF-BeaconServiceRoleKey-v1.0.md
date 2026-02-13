---
id: HANDOFF-BeaconServiceRoleKey-v1.0
path: docs/HANDOFF-BeaconServiceRoleKey-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

author_type: executor

parent: PRD-BeaconServiceRoleKey-v1.0
children:
  - PROMPT-BeaconServiceRoleKey-v1.0

mentu:
  commitment: cmt_4d823f33
  status: pending

validation:
  required: false
  tier: T2
---

# HANDOFF: BeaconServiceRoleKey v1.0

## For the Coding Agent

Fix `mentu-beacon/src-tauri/src/engine/supabase.rs` to use `service_role_key` for REST API calls instead of `anon_key`, enabling the beacon to claim commands blocked by RLS.

**Read the full PRD**: `docs/PRD-BeaconServiceRoleKey-v1.0.md`

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

## Mentu Protocol

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon

# Claim commitment
mentu claim cmt_4d823f33

# Capture progress
mentu capture "{Progress}" --kind execution-progress
```

---

## Visual Verification

**Skip this section** - this feature has no user interface components.

---

## Build Order

### Stage 1: Add api_key() Helper Method

Add a method to return the effective API key for REST calls.

**File**: `src-tauri/src/engine/supabase.rs`

After line 159 (`pub fn anon_key(&self) -> &str`), add:

```rust
    /// Get the effective API key for REST calls.
    /// Uses service_role_key if available (bypasses RLS), otherwise anon_key.
    pub fn api_key(&self) -> &str {
        self.config.service_role_key
            .as_deref()
            .unwrap_or(&self.config.anon_key)
    }
```

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo check
```

---

### Stage 2: Update SupabaseConfig to Include service_role_key

Check that `SupabaseConfig` already has `service_role_key`. If not, add it.

**File**: `src-tauri/src/config.rs` (line ~67-75)

Verify this exists:
```rust
pub struct SupabaseConfig {
    pub url: String,
    pub anon_key: String,
    #[serde(default)]
    pub service_role_key: Option<String>,
}
```

**No change needed if already present**.

---

### Stage 3: Update REST API Calls to Use api_key()

Replace all hardcoded `&self.config.anon_key` in REST API calls with `self.api_key()`.

**File**: `src-tauri/src/engine/supabase.rs`

Update these lines (approximately):
- Line 178: `.header("apikey", &self.config.anon_key)` → `.header("apikey", self.api_key())`
- Line 179: `format!("Bearer {}", &self.config.anon_key)` → `format!("Bearer {}", self.api_key())`
- And all similar patterns at lines: 203-204, 412-415, 445-448, 511-514, 559-562, 596-599, 628-631, 676-679, 722-725, 757-760, 786-789, 820-823

**Pattern to find and replace**:
```rust
// BEFORE
.header("apikey", &self.config.anon_key)
.header("Authorization", format!("Bearer {}", &self.config.anon_key))

// AFTER
.header("apikey", self.api_key())
.header("Authorization", format!("Bearer {}", self.api_key()))
```

**Important**: Keep `realtime_url()` using `anon_key` (line ~220) since WebSocket auth works differently.

**Verification**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo check
```

---

### Stage 4: Build and Test

**Build the beacon**:
```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo build --release
```

**Restart the beacon**:
```bash
pkill -f "beacon --headless"
nohup ./target/release/beacon --headless > /tmp/beacon.log 2>&1 &
sleep 10
```

**Verify no errors**:
```bash
# Should see NO 401 errors
tail -50 /tmp/beacon.log | grep -E "401|Unauthorized" || echo "No 401 errors!"

# Should see machine registration succeed
tail -50 /tmp/beacon.log | grep -E "Registered machine|Machine ID"
```

---

### Stage 5: Test Command Claiming

Insert a test command and verify the beacon claims it.

```bash
# Use Supabase MCP to insert test command
# Then check if beacon claims it within 15 seconds
```

**Success criteria**: Command status changes from `pending` to `claimed` with the local beacon's instance ID.

---

## Before Submitting

This is a code-only change with no UI, so skip validator subagents.

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

```bash
# Read the template
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-BeaconServiceRoleKey-v1.0.md
```

Include:
- Summary of the fix
- Files modified (supabase.rs)
- Build result (cargo build)
- Test results (401 errors gone, command claiming works)

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-BeaconServiceRoleKey: Fixed supabase.rs to use service_role_key" \
  --kind result-document \
  --path docs/RESULT-BeaconServiceRoleKey-v1.0.md \
  --refs cmt_4d823f33
```

### Step 3: Update RESULT Front Matter

```yaml
mentu:
  commitment: cmt_4d823f33
  evidence: mem_YYYYYYYY  # ← The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_4d823f33 \
  --summary "Fixed beacon supabase.rs to use service_role_key for REST calls" \
  --include-files
```

---

## Verification Checklist

### Files
- [ ] `src-tauri/src/engine/supabase.rs` modified with `api_key()` method
- [ ] All REST calls use `self.api_key()` instead of `&self.config.anon_key`
- [ ] `realtime_url()` still uses `anon_key` (unchanged)

### Checks
- [ ] `cargo build --release` succeeds
- [ ] No compiler warnings about unused `service_role_key`

### Mentu
- [ ] Commitment claimed
- [ ] **RESULT document created**
- [ ] **RESULT captured as evidence**
- [ ] Commitment submitted

### Functionality
- [ ] Beacon starts without 401 errors on REST calls
- [ ] Machine registration succeeds (no warning in logs)
- [ ] Beacon can claim commands targeted at its instance ID
- [ ] WebSocket realtime still connects

---

*Enable full command execution capability for the local beacon.*
