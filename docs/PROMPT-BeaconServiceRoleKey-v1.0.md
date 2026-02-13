---
id: PROMPT-BeaconServiceRoleKey-v1.0
path: docs/PROMPT-BeaconServiceRoleKey-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

actor: (from manifest)

parent: HANDOFF-BeaconServiceRoleKey-v1.0

mentu:
  commitment: cmt_4d823f33
  status: pending
---

# Executable Prompt: BeaconServiceRoleKey v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 30 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain is TECHNICAL. Fix technical failures, defer on intent/safety.
The Rule: Failure in YOUR domain → own and fix. Failure elsewhere → you drifted.

# MISSION
Fix mentu-beacon supabase.rs to use service_role_key for REST API calls, enabling command claiming.

# CONTRACT
Done when:
- cargo build --release succeeds
- Beacon starts without 401 errors
- Beacon can claim commands
- Commitment submitted with evidence
- RESULT document created

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-BeaconServiceRoleKey-v1.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Claim commitment: mentu claim cmt_XXX
5. Follow Build Order in HANDOFF (5 stages)
6. On completion: create RESULT, capture, submit

# CONSTRAINTS
- DO NOT modify realtime_url() - keep using anon_key for WebSocket
- DO NOT change RLS policies - only update supabase.rs code
- DO NOT log or expose service_role_key values

# RECOVERY
- If cargo check fails: fix compile errors before proceeding
- If cargo build fails: check all method calls are correct
- If mentu commands fail: verify .mentu/ exists

# CONTEXT
Read: docs/HANDOFF-BeaconServiceRoleKey-v1.0.md (build instructions)
Reference: docs/PRD-BeaconServiceRoleKey-v1.0.md (full specification)
Reference: docs/RESULT-BeaconSynchronization-v1.0.md (issue discovery)

# EVIDENCE
Final message must include:
- Files modified (supabase.rs)
- Build status (cargo build --release)
- Test results (beacon running, no 401)
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 30 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-BeaconServiceRoleKey-v1.0.md and execute."
```

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 30 \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-BeaconServiceRoleKey-v1.0.md and execute."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 30 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-BeaconServiceRoleKey-v1.0.md and execute."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `supabase.rs` | Updated with `api_key()` method using service_role_key |
| Beacon binary | Rebuilt with `cargo build --release` |
| RESULT document | Evidence of completion |

---

## Expected Duration

- **Turns**: 15-25
- **Complexity**: T2 (Single feature, Rust code modification)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify build passes
cd /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri
cargo build --release

# Verify beacon starts without 401
pkill -f "beacon --headless"
nohup ./target/release/beacon --headless > /tmp/beacon.log 2>&1 &
sleep 10
grep -E "401|Unauthorized" /tmp/beacon.log | wc -l  # Should be 0

# Verify commitment closed
mentu show cmt_XXX
```

---

*Enable full beacon command execution by using service_role_key for RLS bypass.*
