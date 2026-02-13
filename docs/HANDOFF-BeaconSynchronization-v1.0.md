---
id: HANDOFF-BeaconSynchronization-v1.0
path: docs/HANDOFF-BeaconSynchronization-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

author_type: executor

parent: PRD-BeaconSynchronization-v1.0
children:
  - PROMPT-BeaconSynchronization-v1.0

mentu:
  commitment: cmt_3969ac09
  status: pending

validation:
  required: true
  tier: T2
---

# HANDOFF: Beacon Synchronization v1.0

## For the Coding Agent

Diagnose and fix the 401 Unauthorized errors preventing the local Mac beacon from claiming commands, then verify both local and VPS beacons operate correctly with proper machine targeting.

**Read the full PRD**: `docs/PRD-BeaconSynchronization-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

Your actor identity comes from the repository manifest (`.mentu/manifest.yaml`).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-web |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

**Quick reference**: `mentu stance executor` or `mentu stance executor --failure technical`

---

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "Beacon Synchronization",
  "tier": "T2",
  "required_files": [
    "/tmp/beacon_verification_local.txt",
    "/tmp/beacon_verification_vps.txt",
    "docs/RESULT-BeaconSynchronization-v1.0.md"
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

## Mentu Protocol

### Identity Resolution

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ACTOR (WHO)              AUTHOR TYPE (ROLE)          CONTEXT (WHERE)     │
│  ─────────────            ──────────────────          ───────────────     │
│  From manifest            From this HANDOFF           From working dir    │
│  .mentu/manifest.yaml     author_type: executor       repository name     │
│                                                                           │
│  Actor is auto-resolved. Author type declares your role. Context tracks. │
└───────────────────────────────────────────────────────────────────────────┘
```

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-web

# Check your actor identity (auto-resolved from manifest)
cat .mentu/manifest.yaml | grep actor

# Claim commitment (actor auto-resolved)
mentu claim cmt_XXXXXXXX

# Capture progress (actor auto-resolved, role declared)
mentu capture "Phase complete" --kind execution-progress
```

Save the commitment ID. You will close it with evidence.

---

## Build Order

### Phase 1: Diagnose Auth Issue

**Goal**: Understand why scheduler is getting 401 Unauthorized

#### Step 1: Examine Beacon Source Code

Check scheduler implementation:

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri

# Find scheduler code
grep -r "Scheduler tick error" src/engine/
grep -r "401" src/engine/scheduler.rs -A 5 -B 5
```

Look for:
- Which API endpoint is being called
- Which authentication key is used (anon_key vs service_role_key)
- Whether the endpoint requires elevated permissions

#### Step 2: Check Supabase Permissions

The scheduler likely calls REST API endpoints that require `service_role_key` instead of `anon_key`.

Check current beacon configuration:

```bash
cat ~/.mentu/beacon.yaml | grep -A 3 "supabase:"
```

Expected structure:
```yaml
supabase:
  url: https://nwhtjzgcbjuewuhapjua.supabase.co
  anon_key: {key}
  service_role_key: {key}
```

#### Step 3: Verify Current State

```bash
# Check local beacon logs
tail -50 /tmp/beacon.log | grep -E "ERROR|401|Unauthorized"

# Check if beacon is running
ps aux | grep "[b]eacon --headless"

# Check database for pending commands
```

Use SQL to check:
```sql
SELECT id, status, target_machine_id, created_at
FROM bridge_commands
WHERE status = 'pending'
AND workspace_id = '9584ae30-14f5-448a-9ff1-5a6f5caf6312'
ORDER BY created_at DESC LIMIT 5;
```

---

### Phase 2: Fix Authentication

**Goal**: Ensure scheduler uses correct auth and doesn't error

#### Option A: Fix Requires Code Change

If beacon source code uses wrong key for scheduler API calls:

1. Navigate to beacon source:
   ```bash
   cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri/src/engine
   ```

2. Find and fix scheduler.rs to use service_role_key for API calls

3. Rebuild beacon:
   ```bash
   cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
   cargo build --release
   ```

4. Restart beacon (see Phase 2 Step 3)

#### Option B: Fix Requires Config Change

If beacon config is missing service_role_key or using wrong one:

1. Update ~/.mentu/beacon.yaml with correct service_role_key
2. Restart beacon (see Phase 2 Step 3)

#### Option C: Permission Issue

If Supabase RLS policies block scheduler endpoint:

1. Document the issue
2. Note that WebSocket should still work for realtime
3. Focus on WebSocket-based command delivery

#### Step 3: Restart Local Beacon

```bash
# Kill existing beacon
pkill -f "beacon --headless"

# Start new beacon in background
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
nohup ./target/release/beacon --headless > /tmp/beacon.log 2>&1 &

# Wait for startup
sleep 5

# Check logs for errors
tail -30 /tmp/beacon.log
```

**Success criteria**: No more "401 Unauthorized" or "Scheduler tick error" in logs after 60+ seconds

---

### Phase 3: Test Command Execution

**Goal**: Verify both beacons can execute test commands

#### Step 1: Test Local Beacon

Create command targeted to local machine:

```sql
INSERT INTO bridge_commands (
  workspace_id,
  target_machine_id,
  prompt,
  working_directory,
  agent,
  status,
  timeout_seconds,
  approval_required
) VALUES (
  '9584ae30-14f5-448a-9ff1-5a6f5caf6312',
  'beacon-ae0eee9f',
  'echo "Local beacon test $(date)" > /tmp/beacon_verification_local.txt && echo "Machine: $(hostname)" >> /tmp/beacon_verification_local.txt && cat /tmp/beacon_verification_local.txt',
  '/Users/rashid/Desktop/Workspaces',
  'bash',
  'pending',
  300,
  false
) RETURNING id, status, target_machine_id, created_at;
```

Wait 60 seconds, then check:

```bash
# Check if command was claimed
# (Query database for command status)

# Check if file was created
ls -lh /tmp/beacon_verification_local.txt
cat /tmp/beacon_verification_local.txt

# Check beacon logs
tail -50 /tmp/beacon.log | grep -E "Claimed|Executing|Completed"
```

**Expected**: File exists with local hostname

#### Step 2: Test VPS Beacon

Create command targeted to VPS:

```sql
INSERT INTO bridge_commands (
  workspace_id,
  target_machine_id,
  prompt,
  working_directory,
  agent,
  status,
  timeout_seconds,
  approval_required
) VALUES (
  '9584ae30-14f5-448a-9ff1-5a6f5caf6312',
  'vps-mentu-01',
  'echo "VPS beacon test $(date)" > /tmp/beacon_verification_vps.txt && echo "Machine: $(hostname)" >> /tmp/beacon_verification_vps.txt',
  '/home/mentu/Workspaces',
  'bash',
  'pending',
  300,
  false
) RETURNING id, status, target_machine_id, created_at;
```

**Expected**: Command claimed by VPS (check database status)

#### Step 3: Test Non-Targeted Command

Create command without target:

```sql
INSERT INTO bridge_commands (
  workspace_id,
  prompt,
  working_directory,
  agent,
  status,
  timeout_seconds,
  approval_required
) VALUES (
  '9584ae30-14f5-448a-9ff1-5a6f5caf6312',
  'echo "Non-targeted command test $(date)"',
  '/tmp',
  'bash',
  'pending',
  300,
  false
) RETURNING id, status, created_at;
```

**Expected**: Either beacon claims it (first one to see it)

---

### Phase 4: Verification and Documentation

**Goal**: Confirm both beacons operational and document findings

#### Step 1: Collect Evidence

```bash
# Local beacon evidence
cat /tmp/beacon_verification_local.txt

# Check beacon logs
tail -100 /tmp/beacon.log > /tmp/beacon_final_logs.txt

# Verify both beacons running
ps aux | grep beacon
```

#### Step 2: Document Findings

Create RESULT document with:
- Root cause of 401 error
- Fix applied (code change, config change, or workaround)
- Test results showing both beacons working
- Configuration recommendations

#### Step 3: Capture Evidence

```bash
mentu capture "Created RESULT-BeaconSynchronization: Fixed beacon auth and verified both local/VPS beacons operational" --kind result-document --path docs/RESULT-BeaconSynchronization-v1.0.md --refs cmt_XXXXXXXX
```

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

Read the template and create the RESULT document:

```bash
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md
```

Create: `docs/RESULT-BeaconSynchronization-v1.0.md`

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was fixed
- Root cause analysis of 401 error
- Fix applied (code/config/workaround)
- Test results showing both beacons working
- Files created as proof (verification txt files)

### Step 2: Capture RESULT as Evidence

```bash
mentu capture "Created RESULT-BeaconSynchronization: Fixed auth issue and verified beacon synchronization" \
  --kind result-document \
  --path docs/RESULT-BeaconSynchronization-v1.0.md \
  --refs cmt_XXXXXXXX
```

### Step 3: Update RESULT Front Matter

Update the YAML front matter with the evidence ID:

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY  # ← The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
mentu submit cmt_XXXXXXXX \
  --summary "Fixed beacon 401 auth error. Both local (beacon-ae0eee9f) and VPS (vps-mentu-01) beacons now operational and tested." \
  --include-files
```

**The RESULT document IS the closure proof. Do not submit without it.**

---

## Verification Checklist

### Diagnostic

- [ ] Identified cause of 401 Unauthorized error
- [ ] Located relevant code in beacon source (scheduler.rs or supabase.rs)
- [ ] Determined which auth key is needed

### Fix Applied

- [ ] Beacon configuration updated (if needed)
- [ ] Beacon source code fixed (if needed)
- [ ] Local beacon restarted successfully
- [ ] No more 401 errors in logs after 60+ seconds

### Testing

- [ ] Created test command for local beacon (target_machine_id='beacon-ae0eee9f')
- [ ] Local beacon claimed and executed command
- [ ] File `/tmp/beacon_verification_local.txt` exists with correct content
- [ ] Created test command for VPS beacon
- [ ] VPS beacon claimed command (verified in database)
- [ ] Non-targeted command handled without error

### Documentation

- [ ] RESULT document created with findings
- [ ] Root cause explained
- [ ] Fix documented
- [ ] Test evidence included
- [ ] RESULT captured as evidence
- [ ] RESULT front matter updated with evidence ID
- [ ] Commitment submitted

### Final State

- [ ] Local beacon: Running, no errors, claims targeted commands ✅
- [ ] VPS beacon: Running, respects targeting ✅
- [ ] Both beacons coexist without conflicts ✅

---

*Fix authentication and synchronization to enable both local Mac and VPS beacons to operate correctly with proper command routing.*
