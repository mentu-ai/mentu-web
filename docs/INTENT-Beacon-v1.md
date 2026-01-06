## INTENT: Beacon v1.0

---

```yaml
# ============================================================
# INTENT DOCUMENT
# ============================================================
id: INTENT-Beacon-v1.0
type: intent
tier: T3
created: 2026-01-05
author: architect:human+claude
status: ready

target_repo: mentu-beacon
```

---

## What

A tiny native application that runs in the menu bar (local) or as a headless daemon (VPS). It connects the Mentu ledger to local terminal execution. When agents or humans create spawn requests in the ledger, Beacon sees them and executes them locally.

**One sentence:** Beacon is the bridge between intent and execution.

---

## Why

### Problems Solved

1. **Fragmented infrastructure.** Currently mentu-bridge (VPS daemon) and mentu-proxy (Cloudflare Worker) are separate systems with separate configs. Beacon unifies them.

2. **No local presence.** Mentu has no way to execute on the user's laptop. Work only happens on VPS. Beacon brings execution home.

3. **Manual terminal spawning.** Users must manually open terminals and paste commands. Beacon automates this entirely.

4. **No quick intent capture.** Users must open browser, navigate to Kanban, create commitment. Beacon provides keyboard shortcut → instant capture.

5. **No status visibility.** Users don't know if agents are running or PRs are waiting. Beacon shows status at a glance.

### Value Created

- **Spawn from anywhere.** Any system that can write to the ledger (Slack, ChatGPT, web, CLI) can trigger local execution.
- **One binary, two modes.** Same code runs as menu bar app or headless server.
- **Invisible infrastructure.** Users don't manage daemons or proxies. They install Beacon. It works.
- **Instant intent.** Keyboard shortcut → type → enter → commitment created → agent spawns.

---

## Constraints

### Design Constraints

1. **Minimal UI.** Menu bar icon + dropdown + quick intent popup. Nothing more.
2. **No Kanban rendering.** Beacon does not display the Kanban. It links to the web Kanban.
3. **No state storage.** Beacon is stateless. All state lives in the ledger (Supabase).
4. **Single binary.** One executable. No installers, no dependencies, no runtime.

### Technical Constraints

1. **Tauri (Rust).** Not Electron. Target binary size < 10MB.
2. **Cross-platform.** macOS first. Windows and Linux follow.
3. **Supabase Realtime.** Use existing Supabase infrastructure for ledger subscription.
4. **Native terminal.** Spawn real OS processes, not emulated terminals.

### Scope Constraints

1. **No agent logic.** Beacon spawns agents. It doesn't contain agent logic.
2. **No git operations.** Agents handle git. Beacon just runs commands.
3. **No validation.** Validators run inside agent sessions, not in Beacon.
4. **v1.0 is Mac only.** Windows/Linux in v1.1.

---

## Expected Outcome

A user installs Beacon. It appears in their menu bar. They connect it to their Supabase instance (one-time config).

From that moment:
- Any spawn request in the ledger executes on their machine
- They can hit ⌘I to capture intent instantly
- They see agent status at a glance
- They get notified when PRs are ready

On VPS:
- Same binary runs headless via systemd
- 24/7 execution without laptop
- Same ledger, same flow

---

## Acceptance Criteria

### Core Functionality

| # | Criterion | Testable |
|---|-----------|----------|
| 1 | Beacon subscribes to Supabase `spawn_requests` table | Insert row → Beacon logs receipt |
| 2 | Beacon spawns terminal process with received prompt | Spawn request → terminal opens → command runs |
| 3 | Beacon updates spawn request status (claimed, running, complete, error) | Status visible in ledger |
| 4 | Beacon streams stdout/stderr to ledger | Output appears in `spawn_logs` table |
| 5 | Beacon runs in headless mode without GUI | `beacon --headless` runs as daemon |

### Menu Bar UI (Local Mode)

| # | Criterion | Testable |
|---|-----------|----------|
| 6 | Menu bar icon shows connection status (green/yellow/red) | Disconnect Supabase → icon turns red |
| 7 | Dropdown shows count of running agents | 2 agents running → "2 agents running" |
| 8 | Dropdown shows count of PRs awaiting review | Query ledger → display count |
| 9 | "Open Kanban" menu item opens web Kanban | Click → browser opens |
| 10 | "New Intent" menu item (or ⌘I) opens quick intent popup | Shortcut → popup appears |

### Quick Intent

| # | Criterion | Testable |
|---|-----------|----------|
| 11 | Quick intent popup captures single-line text | Type → submit → memory created |
| 12 | Quick intent creates memory + commitment in ledger | Check Supabase tables |
| 13 | Quick intent auto-selects workspace (or prompts if multiple) | Config has workspaces → correct one selected |

### Notifications

| # | Criterion | Testable |
|---|-----------|----------|
| 14 | Native notification when agent completes | Agent finishes → notification appears |
| 15 | Native notification when PR is created | PR created → notification appears |
| 16 | Click notification opens relevant URL (PR or Kanban) | Click → browser opens |

### Configuration

| # | Criterion | Testable |
|---|-----------|----------|
| 17 | Config file at `~/.mentu/beacon.yaml` | File exists after first run |
| 18 | Config stores Supabase URL and key | Credentials persist |
| 19 | Config stores workspace paths | Paths persist |
| 20 | Settings UI allows editing config | Change setting → file updates |

### Headless Mode

| # | Criterion | Testable |
|---|-----------|----------|
| 21 | `beacon --headless` runs without GUI | No window, no menu bar |
| 22 | Headless mode reads same config file | Same `beacon.yaml` |
| 23 | Headless mode logs to stdout/file | Logs appear |
| 24 | Graceful shutdown on SIGTERM | `kill` → clean exit |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│                              BEACON                                         │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                         Supabase Client                             │  │
│   │                                                                     │  │
│   │   - Realtime subscription to spawn_requests                        │  │
│   │   - CRUD for memories, commitments                                 │  │
│   │   - Insert spawn_logs                                              │  │
│   │                                                                     │  │
│   └───────────────────────────────┬─────────────────────────────────────┘  │
│                                   │                                        │
│   ┌───────────────────────────────┼─────────────────────────────────────┐  │
│   │                               │                                     │  │
│   │   ┌───────────────────┐   ┌───┴───────────────┐   ┌──────────────┐ │  │
│   │   │    Tray Manager   │   │  Spawn Executor   │   │   Notifier   │ │  │
│   │   │                   │   │                   │   │              │ │  │
│   │   │  - Icon state     │   │  - Process spawn  │   │  - OS notif  │ │  │
│   │   │  - Dropdown menu  │   │  - Output stream  │   │  - Deep link │ │  │
│   │   │  - Quick intent   │   │  - Status update  │   │              │ │  │
│   │   │                   │   │                   │   │              │ │  │
│   │   └───────────────────┘   └───────────────────┘   └──────────────┘ │  │
│   │                                                                     │  │
│   │                         GUI MODE ONLY                               │  │
│   │           (Headless mode skips Tray Manager)                       │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Spawn Request Flow

```
1. External system (Slack, web, CLI) inserts into spawn_requests:
   {
     id: uuid,
     commitment_id: "cmt_xxx",
     prompt: "You are Executor...",
     workspace: "/path/to/repo",
     status: "pending"
   }

2. Beacon receives via Supabase Realtime

3. Beacon updates status: "claimed"

4. Beacon spawns:
   $ cd /path/to/repo && claude --dangerously-skip-permissions "..."

5. Beacon streams output to spawn_logs:
   { spawn_id: uuid, line: "...", timestamp: ... }

6. Process exits. Beacon updates status: "complete" or "error"

7. Beacon sends notification (if GUI mode)
```

### Quick Intent Flow

```
1. User hits ⌘I

2. Popup appears

3. User types: "Add dark mode to settings"

4. User hits Enter

5. Beacon inserts memory:
   { id: "mem_xxx", body: "Add dark mode to settings", kind: "intent" }

6. Beacon inserts commitment:
   { id: "cmt_xxx", body: "Add dark mode to settings", source: "mem_xxx" }

7. Beacon inserts spawn_request:
   { commitment_id: "cmt_xxx", prompt: "...", status: "pending" }

8. Popup closes

9. Beacon picks up spawn_request (same flow as above)
```

---

## File Structure

```
mentu-beacon/
├── src-tauri/
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs           # Entry point, mode detection
│       ├── config.rs         # Config loading/saving
│       ├── supabase.rs       # Supabase client + realtime
│       ├── executor.rs       # Process spawning + streaming
│       ├── tray.rs           # Menu bar (GUI mode only)
│       ├── notifier.rs       # OS notifications
│       └── commands.rs       # Tauri commands for frontend
├── src/
│   ├── App.tsx               # Quick intent UI only
│   ├── QuickIntent.tsx       # The popup
│   └── styles.css            # Minimal styles
├── package.json
└── README.md
```

---

## Commands

```bash
# GUI mode (default)
beacon

# Headless mode (VPS/server)
beacon --headless

# Check status
beacon --status

# Quick intent from CLI
beacon --intent "Add dark mode"

# Show config path
beacon --config

# Version
beacon --version
```

---

## Configuration

```yaml
# ~/.mentu/beacon.yaml

supabase:
  url: "https://xxx.supabase.co"
  anon_key: "eyJ..."

workspaces:
  - path: "/Users/rashid/Workspaces/mentu-ai"
    name: "mentu-ai"
  - path: "/Users/rashid/Workspaces/mentu-web"
    name: "mentu-web"

defaults:
  workspace: "mentu-ai"  # For quick intent

notifications:
  enabled: true
  pr_ready: true
  agent_complete: true

shortcuts:
  quick_intent: "CommandOrControl+Shift+I"
  open_kanban: "CommandOrControl+Shift+K"

log:
  level: "info"  # debug, info, warn, error
  file: "~/.mentu/beacon.log"  # Headless mode
```

---

## Database Tables

### spawn_requests

```sql
create table spawn_requests (
  id uuid primary key default gen_random_uuid(),
  commitment_id text not null,
  workspace text not null,
  prompt text not null,
  status text default 'pending',  -- pending, claimed, running, complete, error
  claimed_by text,                 -- beacon instance id
  created_at timestamptz default now(),
  started_at timestamptz,
  completed_at timestamptz,
  exit_code int,
  error text
);
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
```

---

## Distribution

### macOS

```bash
# Homebrew
brew install mentu/tap/beacon

# Or direct download
curl -fsSL https://beacon.mentu.ai/download/mac -o Beacon.app.zip
unzip Beacon.app.zip
mv Beacon.app /Applications/
```

### VPS (Linux)

```bash
# Install
curl -fsSL https://beacon.mentu.ai/install.sh | sh

# Configure
beacon --setup  # Interactive config

# Run as service
sudo systemctl enable beacon
sudo systemctl start beacon
```

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Binary size | < 10MB |
| Memory usage (idle) | < 50MB |
| Startup time | < 1s |
| Spawn latency (request → process start) | < 500ms |
| Realtime subscription reliability | 99.9% |

---

## Reference

- **Tauri docs:** https://tauri.app
- **Supabase Realtime:** https://supabase.com/docs/guides/realtime
- **Current mentu-bridge:** `/mentu-bridge/` (to be superseded)
- **Current mentu-proxy:** `/mentu-proxy/` (to be superseded)

---

## The Vision

**One binary. Always listening. Ledger in. Execution out.**

The human writes intent—anywhere.
The ledger records it.
The Beacon executes it.
The Kanban shows it.
The PR proves it.

---

*Ready for Auditor.*