---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PROMPT-Beacon-v1.0
path: docs/PROMPT-Beacon-v1.0.md
type: prompt
intent: execute

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3
actor: (from manifest)

parent: HANDOFF-Beacon-v1.0

mentu:
  commitment: cmt_1915da3a
  status: pending
---

# Executable Prompt: Beacon v1.0

## Launch Commands

### Option A: Native Claude (NO mentu-enforcer)

Use this when you do NOT need stop-time commitment enforcement:

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 150 \
  "
# IDENTITY
Your actor identity comes from the repository manifest (.mentu/manifest.yaml).
Your role (author_type) comes from the HANDOFF document you are executing.

Read .mentu/manifest.yaml to discover your actor.
Read the HANDOFF to discover your author_type (executor).

# COGNITIVE STANCE
Your domain is TECHNICAL (executor role).
- Failure in YOUR domain → own and fix. Don't explain.
- Failure elsewhere → you drifted. Re-read the HANDOFF.

# MISSION
Build the Mentu Beacon native application - a Tauri-based menu bar app (macOS) and headless daemon that bridges the Mentu ledger to local terminal execution.

# CONTRACT
Done when:
- Repository mentu-beacon created at /Users/rashid/Desktop/Workspaces/mentu-beacon
- completion.json checks pass (cargo build, npm build)
- All 13 required files exist and compile
- Commitment submitted with RESULT evidence
- Binary executes in both GUI and headless modes

# PROTOCOL
1. Read .mentu/manifest.yaml to discover your actor identity
2. Read docs/HANDOFF-Beacon-v1.0.md (complete build instructions)
3. Create new repository at /Users/rashid/Desktop/Workspaces/mentu-beacon
4. Create .mentu/manifest.yaml and CLAUDE.md in new repo
5. Create .claude/completion.json with provided contract
6. Check commitment status - if not claimed:
   mentu claim cmt_XXX --author-type executor
7. Follow Build Order in HANDOFF (9 stages)
8. Capture progress after each stage:
   mentu capture 'Completed Stage N' --kind execution-progress --author-type executor
9. Run cargo build --release and npm run build
10. Create RESULT document
11. Submit: mentu submit cmt_XXX --summary 'Beacon v1.0 complete' --include-files

# IDENTITY MODEL
- Actor: auto-resolved from .mentu/manifest.yaml (WHO)
- Author Type: executor from HANDOFF (ROLE)
- Context: mentu-beacon repository (WHERE)

# CONSTRAINTS
- DO NOT modify existing Workspaces repositories (only create mentu-beacon)
- DO NOT skip any stage in the Build Order
- DO NOT skip validation before submit
- Target binary size < 10MB
- macOS only for v1.0

# RECOVERY
- If cargo build fails: check Cargo.toml dependencies
- If npm build fails: check package.json and tsconfig.json
- If mentu commands fail: verify .mentu/ exists
- If validation fails: check stance, fix, don't argue

# CONTEXT
Read: /Users/rashid/Desktop/Workspaces/mentu-web/docs/HANDOFF-Beacon-v1.0.md (build instructions)
Reference: /Users/rashid/Desktop/Workspaces/mentu-web/docs/PRD-Beacon-v1.0.md (full specification)
Reference: /Users/rashid/Desktop/Workspaces/mentu-web/docs/INTENT-Beacon-v1.md (original intent)

# EVIDENCE
Final message must include:
- All files created (list of 13+ files)
- Build status (cargo build --release, npm run build)
- Binary size
- Commitment ID submitted
"
```

---

### Option B: With Mentu Enforcer (WRAPPER SCRIPT)

Use this when you NEED stop-time commitment enforcement (agent cannot stop until commitments are closed):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 150 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor, then read /Users/rashid/Desktop/Workspaces/mentu-web/docs/HANDOFF-Beacon-v1.0.md and execute."
```

> **IMPORTANT**: `--mentu-enforcer` is a CUSTOM FLAG that ONLY works with the wrapper script.
> The native `claude` command does NOT recognize this flag and will error.

---

## Minimal Prompts

### Without Enforcer (native claude):

```bash
claude \
  --dangerously-skip-permissions \
  --max-turns 150 \
  "Read .mentu/manifest.yaml for your actor identity, then read /Users/rashid/Desktop/Workspaces/mentu-web/docs/HANDOFF-Beacon-v1.0.md and execute as the HANDOFF's author_type."
```

### With Enforcer (wrapper script):

```bash
~/claude-code-app/run-claude.sh \
  --dangerously-skip-permissions \
  --max-turns 150 \
  --mentu-enforcer \
  "Read .mentu/manifest.yaml for your actor identity, then read /Users/rashid/Desktop/Workspaces/mentu-web/docs/HANDOFF-Beacon-v1.0.md and execute as the HANDOFF's author_type."
```

---

## What This Prompt Delivers

| Deliverable | Description |
|-------------|-------------|
| `mentu-beacon/` | New repository with .mentu governance |
| `src-tauri/src/main.rs` | Entry point with GUI/headless mode detection |
| `src-tauri/src/config.rs` | YAML config loading from ~/.mentu/beacon.yaml |
| `src-tauri/src/supabase.rs` | Supabase client with realtime subscription |
| `src-tauri/src/executor.rs` | Process spawning and output streaming |
| `src-tauri/src/tray.rs` | macOS menu bar icon and dropdown |
| `src-tauri/src/notifier.rs` | Native OS notifications |
| `src-tauri/src/commands.rs` | Tauri commands for frontend |
| `src/QuickIntent.tsx` | Quick intent popup UI |
| `beacon` binary | Native executable < 10MB |

---

## Expected Duration

- **Turns**: 80-150
- **Complexity**: T3 (multi-part, new repository)
- **Commitments**: 5+ (one per major stage)

---

## Verification After Completion

```bash
# Verify repository exists
ls -la /Users/rashid/Desktop/Workspaces/mentu-beacon

# Verify deliverables exist
ls -la /Users/rashid/Desktop/Workspaces/mentu-beacon/src-tauri/src/

# Verify Rust build passes
cd /Users/rashid/Desktop/Workspaces/mentu-beacon && cargo build --release

# Verify frontend build passes
cd /Users/rashid/Desktop/Workspaces/mentu-beacon && npm run build

# Verify binary size
ls -lh /Users/rashid/Desktop/Workspaces/mentu-beacon/target/release/beacon

# Test GUI mode
./target/release/beacon

# Test headless mode
./target/release/beacon --headless

# Test status
./target/release/beacon --status

# Verify commitment closed
mentu show cmt_XXX
```

---

## Database Prerequisite

Before running Beacon, ensure the Supabase tables exist:

```sql
-- Run in Supabase SQL editor
create table if not exists spawn_requests (
  id uuid primary key default gen_random_uuid(),
  commitment_id text not null,
  workspace text not null,
  prompt text not null,
  status text default 'pending',
  claimed_by text,
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  exit_code int,
  error text
);

create table if not exists spawn_logs (
  id uuid primary key default gen_random_uuid(),
  spawn_id uuid references spawn_requests(id),
  stream text,
  line text,
  timestamp timestamptz default now()
);

create index if not exists spawn_logs_spawn_id_idx on spawn_logs(spawn_id);

-- Enable realtime
alter publication supabase_realtime add table spawn_requests;
```

---

*One binary. Always listening. Ledger in. Execution out.*
