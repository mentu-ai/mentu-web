---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: PRD-Beacon-v1.0
path: docs/PRD-Beacon-v1.0.md
type: prd
intent: reference

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3

children:
  - HANDOFF-Beacon-v1.0
dependencies:
  - INTENT-Beacon-v1

mentu:
  commitment: cmt_1915da3a
  status: pending
---

# PRD: Beacon v1.0

## Mission

Deliver a native menu bar application (macOS) and headless daemon that bridges the Mentu ledger to local terminal execution. When spawn requests appear in the ledger, Beacon executes them locally—enabling intent captured anywhere (Slack, web, CLI) to trigger real work on user machines.

---

## Problem Statement

### Current State

```
┌─────────────────────────────────────────────────────────────────────┐
│                      FRAGMENTED INFRASTRUCTURE                       │
│                                                                      │
│   mentu-bridge (VPS)          mentu-proxy (Cloudflare)              │
│   └── Daemon                  └── Worker                             │
│   └── Separate config         └── Separate config                    │
│   └── No local execution      └── Gateway only                       │
│                                                                      │
│   User Machine (Mac)                                                 │
│   └── Manual terminal spawning                                       │
│   └── No quick intent capture                                        │
│   └── No agent status visibility                                     │
│   └── Paste commands manually                                        │
└─────────────────────────────────────────────────────────────────────┘
```

Problems:
1. **Fragmented infrastructure** — mentu-bridge and mentu-proxy are separate systems
2. **No local presence** — Mentu cannot execute on the user's laptop
3. **Manual terminal spawning** — Users must manually open terminals and paste commands
4. **No quick intent capture** — Must navigate to browser, open Kanban, create commitment
5. **No status visibility** — No way to know if agents are running or PRs waiting

### Desired State

```
┌─────────────────────────────────────────────────────────────────────┐
│                           BEACON                                     │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    Menu Bar (Local Mode)                      │  │
│   │    🟢 Mentu ▾                                                 │  │
│   │    ├── 2 agents running                                       │  │
│   │    ├── 1 PR awaiting review                                   │  │
│   │    ├── ──────────────────                                     │  │
│   │    ├── New Intent (⌘I)                                        │  │
│   │    ├── Open Kanban                                            │  │
│   │    └── Settings                                               │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   OR                                                                 │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                    Headless (VPS Mode)                        │  │
│   │    $ beacon --headless                                        │  │
│   │    [INFO] Connected to Supabase                               │  │
│   │    [INFO] Listening for spawn requests...                     │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                      │
│   Same binary. Always listening. Ledger in. Execution out.          │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Completion Contract

**First action**: Create `.claude/completion.json` in target repository:

```json
{
  "version": "2.0",
  "name": "Beacon v1.0",
  "tier": "T3",
  "required_files": [
    "src-tauri/src/main.rs",
    "src-tauri/src/config.rs",
    "src-tauri/src/supabase.rs",
    "src-tauri/src/executor.rs",
    "src-tauri/src/tray.rs",
    "src-tauri/src/notifier.rs",
    "src-tauri/src/commands.rs",
    "src-tauri/Cargo.toml",
    "src-tauri/tauri.conf.json",
    "src/App.tsx",
    "src/QuickIntent.tsx",
    "src/styles.css",
    "package.json"
  ],
  "checks": {
    "cargo_build": true,
    "npm_build": true,
    "test": false
  },
  "mentu": {
    "enabled": true,
    "actor": "agent:claude-executor",
    "commitments": {
      "mode": "dynamic",
      "min_count": 5,
      "require_closed": true,
      "require_evidence": true
    }
  },
  "max_iterations": 150
}
```

---

## Core Concepts

### Spawn Request

A request to execute a command locally. Written to Supabase by any system (Slack, web, CLI), picked up by Beacon, executed in a terminal process.

```sql
spawn_requests {
  id: uuid,
  commitment_id: text,
  workspace: text,
  prompt: text,
  status: pending | claimed | running | complete | error,
  claimed_by: text,  -- beacon instance id
  exit_code: int,
  error: text
}
```

### Quick Intent

Keyboard shortcut (⌘I) → popup → type intent → Enter → creates memory + commitment + spawn_request in one action.

### Beacon Instance

Each running Beacon has a unique instance ID. Used for claiming spawn requests to prevent duplicate execution.

### GUI Mode vs Headless Mode

- **GUI Mode**: Menu bar icon, dropdown, quick intent popup, notifications
- **Headless Mode**: No UI, runs as daemon, logs to stdout/file

---

## Specification

### Types (Rust)

```rust
// Core configuration
#[derive(Deserialize, Serialize)]
pub struct BeaconConfig {
    pub supabase: SupabaseConfig,
    pub workspaces: Vec<WorkspaceConfig>,
    pub defaults: DefaultsConfig,
    pub notifications: NotificationsConfig,
    pub shortcuts: ShortcutsConfig,
    pub log: LogConfig,
}

#[derive(Deserialize, Serialize)]
pub struct SupabaseConfig {
    pub url: String,
    pub anon_key: String,
}

#[derive(Deserialize, Serialize)]
pub struct WorkspaceConfig {
    pub path: String,
    pub name: String,
}

// Spawn request from ledger
#[derive(Deserialize, Serialize)]
pub struct SpawnRequest {
    pub id: Uuid,
    pub commitment_id: String,
    pub workspace: String,
    pub prompt: String,
    pub status: SpawnStatus,
    pub claimed_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub exit_code: Option<i32>,
    pub error: Option<String>,
}

#[derive(Deserialize, Serialize)]
pub enum SpawnStatus {
    Pending,
    Claimed,
    Running,
    Complete,
    Error,
}
```

### Operations

| Operation | Input | Output | Description |
|-----------|-------|--------|-------------|
| `subscribe_spawn_requests` | - | Stream<SpawnRequest> | Subscribe to Supabase realtime for new spawn requests |
| `claim_spawn_request` | `id`, `instance_id` | Result<()> | Claim a spawn request for execution |
| `execute_spawn` | `SpawnRequest` | Result<i32> | Spawn terminal process, stream output, return exit code |
| `update_spawn_status` | `id`, `status` | Result<()> | Update spawn request status in ledger |
| `stream_output` | `spawn_id`, `line`, `stream` | Result<()> | Insert line into spawn_logs table |
| `create_quick_intent` | `text`, `workspace` | Result<()> | Create memory + commitment + spawn_request |
| `send_notification` | `title`, `body`, `url` | Result<()> | Send native OS notification |

### State Machine (Spawn Request)

```
                    ┌─────────────┐
                    │   pending   │
                    └──────┬──────┘
                           │ claim
                           ▼
                    ┌─────────────┐
                    │   claimed   │
                    └──────┬──────┘
                           │ start process
                           ▼
                    ┌─────────────┐
          error ←───│   running   │───→ complete
            │       └─────────────┘         │
            ▼                               ▼
     ┌─────────────┐                ┌─────────────┐
     │    error    │                │  complete   │
     └─────────────┘                └─────────────┘
```

| State | Meaning | Valid Transitions |
|-------|---------|-------------------|
| `pending` | Waiting for Beacon to claim | → `claimed` |
| `claimed` | Beacon has claimed, about to start | → `running` |
| `running` | Process is executing | → `complete`, `error` |
| `complete` | Process exited with code 0 | (terminal) |
| `error` | Process failed or exited non-zero | (terminal) |

### Validation Rules

- Spawn request MUST have valid workspace path before execution
- Beacon MUST claim before executing (atomic operation)
- Only one Beacon instance can claim a spawn request
- Output MUST be streamed to spawn_logs in real-time
- Beacon MUST update status on process exit

---

## Implementation

### Deliverables

| File | Purpose |
|------|---------|
| `src-tauri/src/main.rs` | Entry point, mode detection (GUI vs headless) |
| `src-tauri/src/config.rs` | Config loading/saving from `~/.mentu/beacon.yaml` |
| `src-tauri/src/supabase.rs` | Supabase client + realtime subscription |
| `src-tauri/src/executor.rs` | Process spawning + output streaming |
| `src-tauri/src/tray.rs` | Menu bar icon and dropdown (GUI mode only) |
| `src-tauri/src/notifier.rs` | OS notifications |
| `src-tauri/src/commands.rs` | Tauri commands for frontend |
| `src-tauri/Cargo.toml` | Rust dependencies |
| `src-tauri/tauri.conf.json` | Tauri configuration |
| `src/App.tsx` | React app entry (quick intent UI only) |
| `src/QuickIntent.tsx` | Quick intent popup component |
| `src/styles.css` | Minimal styles |
| `package.json` | Node dependencies |

### Build Order

1. **Repository Setup**: Initialize Tauri project, configure Cargo.toml
2. **Config Module**: Load/save beacon.yaml, validate configuration
3. **Supabase Client**: Connect, subscribe to spawn_requests realtime
4. **Executor Module**: Spawn processes, stream output to spawn_logs
5. **Tray Module**: Menu bar icon, dropdown menu (GUI mode)
6. **Notifier Module**: OS notifications for completions/PRs
7. **Quick Intent UI**: React popup for intent capture
8. **Mode Detection**: CLI args for headless vs GUI
9. **Integration**: Wire all modules together

### Integration Points

| System | Integration | Notes |
|--------|-------------|-------|
| Supabase | Realtime subscription | Uses existing project instance |
| spawn_requests | Read + write | Main data source |
| spawn_logs | Write only | Output streaming |
| memories | Write only | Quick intent creates memories |
| commitments | Write only | Quick intent creates commitments |
| macOS | System tray + notifications | Tauri system tray API |

---

## Constraints

- **Tauri (Rust)**: Not Electron. Binary size < 10MB.
- **Single binary**: No installers, no dependencies, no runtime.
- **v1.0 is macOS only**: Windows/Linux in future versions.
- **No agent logic**: Beacon spawns agents, doesn't contain agent logic.
- **No git operations**: Agents handle git, Beacon just runs commands.
- **No validation**: Validators run inside agent sessions.
- **Stateless**: All state lives in ledger (Supabase), not in Beacon.
- **Minimal UI**: Menu bar + dropdown + quick intent popup only.

---

## Success Criteria

### Functional

- [ ] Beacon subscribes to Supabase `spawn_requests` table
- [ ] Beacon spawns terminal process with received prompt
- [ ] Beacon updates spawn request status (claimed, running, complete, error)
- [ ] Beacon streams stdout/stderr to ledger
- [ ] Beacon runs in headless mode without GUI
- [ ] Menu bar icon shows connection status (green/yellow/red)
- [ ] Dropdown shows count of running agents
- [ ] Dropdown shows count of PRs awaiting review
- [ ] Quick intent popup captures text and creates memory + commitment
- [ ] Native notification when agent completes
- [ ] Native notification when PR is created
- [ ] Config file at `~/.mentu/beacon.yaml` persists settings

### Quality

- [ ] Binary size < 10MB
- [ ] Memory usage (idle) < 50MB
- [ ] Startup time < 1s
- [ ] Spawn latency < 500ms
- [ ] `cargo build --release` passes
- [ ] `npm run build` passes

### Integration

- [ ] Works with existing Supabase instance
- [ ] Works with existing mentu-ai CLI
- [ ] Compatible with launchd (Mac) and systemd (Linux) for daemon mode

---

## Verification Commands

```bash
# Verify Rust build
cd mentu-beacon && cargo build --release

# Verify frontend build
cd mentu-beacon && npm run build

# Verify binary size
ls -lh target/release/beacon

# Run GUI mode
./target/release/beacon

# Run headless mode
./target/release/beacon --headless

# Check status
./target/release/beacon --status

# Verify Mentu state
mentu list commitments --state open
```

---

## Database Schema

### spawn_requests

```sql
create table spawn_requests (
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

-- Enable realtime
alter publication supabase_realtime add table spawn_requests;
```

### spawn_logs

```sql
create table spawn_logs (
  id uuid primary key default gen_random_uuid(),
  spawn_id uuid references spawn_requests(id),
  stream text,  -- stdout, stderr
  line text,
  timestamp timestamptz default now()
);

-- Index for efficient queries
create index spawn_logs_spawn_id_idx on spawn_logs(spawn_id);
```

---

## References

- `INTENT-Beacon-v1`: Original intent document with architecture diagrams
- `mentu-bridge`: Current daemon to be superseded
- `mentu-proxy`: Current gateway to remain for API routing
- Tauri documentation: https://tauri.app
- Supabase Realtime: https://supabase.com/docs/guides/realtime

---

*One binary. Always listening. Ledger in. Execution out.*
