---
id: PROMPT-BeaconSynchronization-v1.0
path: docs/PROMPT-BeaconSynchronization-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-11
last_updated: 2026-01-11

tier: T2

actor: (from manifest)

parent: HANDOFF-BeaconSynchronization-v1.0

mentu:
  commitment: cmt_3969ac09
  status: pending
---

# Executable Prompt: Beacon Synchronization v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 50 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain: TECHNICAL (executor role)
- Failure in technical domain → own and fix
- Failure in safety/intent → you drifted, re-read HANDOFF

# MISSION
Diagnose and fix 401 Unauthorized errors preventing local Mac beacon from claiming commands, then verify both local and VPS beacons operate correctly with proper machine targeting.

# CONTRACT
Done when:
- completion.json checks pass (NO tsc/build/test required)
- Commitment submitted with evidence
- /tmp/beacon_verification_local.txt created by local beacon
- /tmp/beacon_verification_vps.txt verified on VPS
- docs/RESULT-BeaconSynchronization-v1.0.md created

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-BeaconSynchronization-v1.0.md (complete instructions)
3. Update .claude/completion.json with provided contract
4. Check commitment status - if already claimed, proceed. If not:
   mentu claim cmt_XXX
5. Add commitment ID to completion.json mentu.commitments.ids
6. Follow Build Order in HANDOFF (4 phases)
7. Capture evidence:
   mentu capture 'Phase complete' --kind execution-progress
8. On completion: mentu submit cmt_XXX --summary 'Fixed beacon auth and verified both local/VPS beacons operational' --include-files

# IDENTITY MODEL
- Actor: auto-resolved from .mentu/manifest.yaml (WHO)
- Author Type: executor (from HANDOFF) (ROLE)
- Context: mentu-web (WHERE)

# CONSTRAINTS
- DO NOT modify mentu-beacon source code without verification
- DO NOT restart VPS beacon without confirming it's safe
- DO NOT create commands that could interfere with production
- MUST create targeted test commands (target_machine_id specified)
- MUST verify both beacons can coexist without conflicts

# RECOVERY
- If 401 persists: check service_role_key in ~/.mentu/beacon.yaml
- If beacon won't start: check logs at /tmp/beacon.log
- If commands not claimed: verify WebSocket connection in logs
- If validation fails: check stance (mentu stance executor --failure technical)

# CONTEXT
Read: docs/HANDOFF-BeaconSynchronization-v1.0.md (build instructions)
Reference: docs/PRD-BeaconSynchronization-v1.0.md (full specification)
Reference: /tmp/beacon.log (current error state)

# EVIDENCE
Final message must include:
- Root cause of 401 error identified
- Fix applied (code change, config change, or workaround)
- Test results from both beacons
- RESULT document created and captured
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement:

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 50 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read docs/HANDOFF-BeaconSynchronization-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 50 \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BeaconSynchronization-v1.0.md and execute as the HANDOFF's author_type."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 50 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read docs/HANDOFF-BeaconSynchronization-v1.0.md and execute as the HANDOFF's author_type."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `/tmp/beacon_verification_local.txt` | Test file created by local beacon proving execution |
| `/tmp/beacon_verification_vps.txt` | Test file verified on VPS beacon |
| `docs/RESULT-BeaconSynchronization-v1.0.md` | Documentation of root cause, fix, and verification |
| Updated `~/.mentu/beacon.yaml` | Corrected configuration (if needed) |
| Beacon source fix | Code change to use correct auth key (if needed) |

---

## Expected Duration

- **Turns**: 30-50
- **Complexity**: T2 (Feature-level diagnostic and fix)
- **Commitments**: 1

---

## Verification After Completion

```bash
# Verify local beacon running without errors
tail -20 /tmp/beacon.log | grep ERROR

# Verify local beacon is running
ps aux | grep "[b]eacon --headless"

# Verify test evidence files exist
ls -lh /tmp/beacon_verification_*.txt
cat /tmp/beacon_verification_local.txt

# Verify commitment closed
mentu show cmt_XXX

# Verify RESULT document exists
cat docs/RESULT-BeaconSynchronization-v1.0.md
```

---

*Fix authentication and synchronization to enable both local Mac and VPS beacons to operate correctly with proper command routing.*
