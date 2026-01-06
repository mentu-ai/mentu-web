---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-Beacon-v1.0
path: docs/HANDOFF-Beacon-v1.0.md
type: handoff
intent: execute

version: "1.0"
created: 2026-01-05
last_updated: 2026-01-05

tier: T3
author_type: executor

parent: PRD-Beacon-v1.0
children:
  - PROMPT-Beacon-v1.0

mentu:
  commitment: cmt_1915da3a
  status: pending

validation:
  required: true
  tier: T3
---

# HANDOFF: Beacon v1.0

## For the Coding Agent

Build the Beacon native application—a Tauri-based menu bar app (macOS) and headless daemon that bridges Mentu ledger spawn requests to local terminal execution.

**Read the full PRD**: `docs/PRD-Beacon-v1.0.md`

---

## Your Identity

You are operating as **executor** (from this HANDOFF's `author_type` field).

Your actor identity comes from the repository manifest (`.mentu/manifest.yaml`).

| Dimension | Source | Value |
|-----------|--------|-------|
| **Actor** | Repository manifest | (auto-resolved) |
| **Author Type** | This HANDOFF | executor |
| **Context** | Working directory | mentu-beacon |

**Your domain**: technical

**The Rule**:
- Failure in YOUR domain → Own it. Fix it. Don't explain.
- Failure in ANOTHER domain → You drifted. Re-read this HANDOFF.

**Quick reference**: `mentu stance executor` or `mentu stance executor --failure technical`

---

## Completion Contract

**First action**: Create `.claude/completion.json` in the new repository:

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

## Mentu Protocol

### Identity Resolution

```
┌───────────────────────────────────────────────────────────────────────────┐
│  ACTOR (WHO)              AUTHOR TYPE (ROLE)          CONTEXT (WHERE)     │
│  ─────────────            ──────────────────          ───────────────     │
│  From manifest            From this HANDOFF           From working dir    │
│  .mentu/manifest.yaml     author_type: executor       mentu-beacon        │
│                                                                           │
│  Actor is auto-resolved. Author type declares your role. Context tracks. │
└───────────────────────────────────────────────────────────────────────────┘
```

### Operations

```bash
cd /Users/rashid/Desktop/Workspaces/mentu-beacon

# Check your actor identity (auto-resolved from manifest)
cat .mentu/manifest.yaml | grep actor

# Claim commitment (actor auto-resolved)
mentu claim cmt_XXXXXXXX --author-type executor

# Capture progress (actor auto-resolved, role declared)
mentu capture "{Progress}" --kind execution-progress --author-type executor
```

Save the commitment ID. You will close it with evidence.

---

## Repository Initialization

**IMPORTANT**: This is a NEW repository. You must create it from scratch.

### Step 0: Create Repository

```bash
mkdir -p /Users/rashid/Desktop/Workspaces/mentu-beacon
cd /Users/rashid/Desktop/Workspaces/mentu-beacon

# Initialize git
git init

# Initialize .mentu folder
mkdir -p .mentu
```

Create `.mentu/manifest.yaml`:

```yaml
name: mentu-beacon
description: Native menu bar app and headless daemon bridging Mentu ledger to local execution
version: "1.0.0"

mentu:
  actor: agent:claude-executor

capabilities:
  - name: spawn-execution
    description: Execute spawn requests from ledger
  - name: quick-intent
    description: Capture intent via keyboard shortcut
  - name: status-display
    description: Show agent and PR status in menu bar

dependencies:
  - name: mentu-ai
    relationship: api-client
  - name: supabase
    relationship: realtime-subscription

registry:
  source: claude-code/registry/modules/beacon.yaml
  version: "1.0.0"
```

Create `CLAUDE.md`:

```markdown
# Mentu Beacon

Native menu bar application and headless daemon for the Mentu ecosystem.

## Identity

\`\`\`
Location: /Users/rashid/Desktop/Workspaces/mentu-beacon
Role: Ledger-to-execution bridge
Version: 1.0.0
Actor: agent:claude-executor
\`\`\`

## What This Repo Does

Beacon bridges the Mentu ledger to local terminal execution:

1. **Spawn Execution** → Subscribe to spawn_requests, execute locally
2. **Quick Intent** → ⌘I → capture intent → create commitment
3. **Status Display** → Show running agents and pending PRs
4. **Notifications** → Alert on completions and PRs

## Commands

\`\`\`bash
# Development
cargo run                  # Run in GUI mode
cargo run -- --headless    # Run headless

# Build
cargo build --release      # Production build
npm run build              # Build frontend

# Test
cargo test                 # Run tests
\`\`\`

## Architecture

\`\`\`
src-tauri/
├── src/
│   ├── main.rs           # Entry point, mode detection
│   ├── config.rs         # Config loading/saving
│   ├── supabase.rs       # Supabase client + realtime
│   ├── executor.rs       # Process spawning + streaming
│   ├── tray.rs           # Menu bar (GUI mode only)
│   ├── notifier.rs       # OS notifications
│   └── commands.rs       # Tauri commands
├── Cargo.toml
└── tauri.conf.json
src/
├── App.tsx               # Quick intent UI
├── QuickIntent.tsx       # Popup component
└── styles.css            # Minimal styles
\`\`\`

## Ecosystem Context

Beacon supersedes mentu-bridge for local execution while mentu-proxy remains as the API gateway.
```

---

## Build Order

### Stage 1: Tauri Project Setup

Initialize the Tauri project structure.

**Create**: `package.json`

```json
{
  "name": "mentu-beacon",
  "version": "1.0.0",
  "description": "Native menu bar app bridging Mentu ledger to local execution",
  "scripts": {
    "dev": "tauri dev",
    "build": "tauri build",
    "tauri": "tauri"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

**Create**: `src-tauri/Cargo.toml`

```toml
[package]
name = "beacon"
version = "1.0.0"
description = "Mentu Beacon - Ledger to execution bridge"
authors = ["Mentu"]
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.0", features = ["tray-icon", "shell-open"] }
tauri-plugin-shell = "2.0"
tauri-plugin-notification = "2.0"
tauri-plugin-global-shortcut = "2.0"
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_yaml = "0.9"
tokio = { version = "1.0", features = ["full"] }
reqwest = { version = "0.11", features = ["json"] }
uuid = { version = "1.0", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
dirs = "5.0"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
clap = { version = "4.0", features = ["derive"] }
realtime-rs = "0.1"  # Supabase realtime client

[features]
default = ["custom-protocol"]
custom-protocol = ["tauri/custom-protocol"]
```

**Create**: `src-tauri/tauri.conf.json`

```json
{
  "$schema": "https://schema.tauri.app/config/2.0",
  "productName": "Beacon",
  "version": "1.0.0",
  "identifier": "ai.mentu.beacon",
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "frontendDist": "../dist"
  },
  "app": {
    "withGlobalTauri": true,
    "trayIcon": {
      "iconPath": "icons/tray.png",
      "iconAsTemplate": true
    },
    "windows": [
      {
        "label": "quick-intent",
        "title": "Quick Intent",
        "width": 400,
        "height": 100,
        "visible": false,
        "resizable": false,
        "decorations": false,
        "alwaysOnTop": true,
        "center": true
      }
    ]
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns"]
  },
  "plugins": {
    "shell": {
      "open": true
    },
    "notification": {},
    "global-shortcut": {}
  }
}
```

**Verification**:
```bash
npm install
cargo check
```

---

### Stage 2: Config Module

Handle configuration loading and saving.

**Create**: `src-tauri/src/config.rs`

```rust
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::fs;
use tracing::{info, warn};

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct BeaconConfig {
    pub supabase: SupabaseConfig,
    pub workspaces: Vec<WorkspaceConfig>,
    #[serde(default)]
    pub defaults: DefaultsConfig,
    #[serde(default)]
    pub notifications: NotificationsConfig,
    #[serde(default)]
    pub shortcuts: ShortcutsConfig,
    #[serde(default)]
    pub log: LogConfig,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SupabaseConfig {
    pub url: String,
    pub anon_key: String,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct WorkspaceConfig {
    pub path: String,
    pub name: String,
}

#[derive(Debug, Clone, Deserialize, Serialize, Default)]
pub struct DefaultsConfig {
    #[serde(default)]
    pub workspace: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct NotificationsConfig {
    #[serde(default = "default_true")]
    pub enabled: bool,
    #[serde(default = "default_true")]
    pub pr_ready: bool,
    #[serde(default = "default_true")]
    pub agent_complete: bool,
}

impl Default for NotificationsConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            pr_ready: true,
            agent_complete: true,
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct ShortcutsConfig {
    #[serde(default = "default_quick_intent")]
    pub quick_intent: String,
    #[serde(default = "default_open_kanban")]
    pub open_kanban: String,
}

impl Default for ShortcutsConfig {
    fn default() -> Self {
        Self {
            quick_intent: default_quick_intent(),
            open_kanban: default_open_kanban(),
        }
    }
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct LogConfig {
    #[serde(default = "default_log_level")]
    pub level: String,
    #[serde(default)]
    pub file: Option<String>,
}

impl Default for LogConfig {
    fn default() -> Self {
        Self {
            level: default_log_level(),
            file: None,
        }
    }
}

fn default_true() -> bool { true }
fn default_quick_intent() -> String { "CommandOrControl+Shift+I".to_string() }
fn default_open_kanban() -> String { "CommandOrControl+Shift+K".to_string() }
fn default_log_level() -> String { "info".to_string() }

impl BeaconConfig {
    pub fn config_path() -> PathBuf {
        dirs::home_dir()
            .expect("Could not find home directory")
            .join(".mentu")
            .join("beacon.yaml")
    }

    pub fn load() -> Result<Self, String> {
        let path = Self::config_path();

        if !path.exists() {
            return Err(format!("Config file not found at {:?}. Run `beacon --setup` to create.", path));
        }

        let contents = fs::read_to_string(&path)
            .map_err(|e| format!("Failed to read config: {}", e))?;

        let config: BeaconConfig = serde_yaml::from_str(&contents)
            .map_err(|e| format!("Failed to parse config: {}", e))?;

        info!("Loaded config from {:?}", path);
        Ok(config)
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::config_path();

        // Ensure parent directory exists
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create config directory: {}", e))?;
        }

        let contents = serde_yaml::to_string(self)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;

        fs::write(&path, contents)
            .map_err(|e| format!("Failed to write config: {}", e))?;

        info!("Saved config to {:?}", path);
        Ok(())
    }

    pub fn create_default() -> Self {
        Self {
            supabase: SupabaseConfig {
                url: "https://your-project.supabase.co".to_string(),
                anon_key: "your-anon-key".to_string(),
            },
            workspaces: vec![],
            defaults: DefaultsConfig::default(),
            notifications: NotificationsConfig::default(),
            shortcuts: ShortcutsConfig::default(),
            log: LogConfig::default(),
        }
    }

    pub fn find_workspace(&self, name: &str) -> Option<&WorkspaceConfig> {
        self.workspaces.iter().find(|w| w.name == name)
    }

    pub fn default_workspace(&self) -> Option<&WorkspaceConfig> {
        self.defaults.workspace.as_ref()
            .and_then(|name| self.find_workspace(name))
            .or_else(|| self.workspaces.first())
    }
}
```

**Verification**:
```bash
cargo check
```

---

### Stage 3: Supabase Client Module

Connect to Supabase and subscribe to spawn_requests.

**Create**: `src-tauri/src/supabase.rs`

```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use tokio::sync::mpsc;
use tracing::{info, error, warn};
use crate::config::SupabaseConfig;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SpawnRequest {
    pub id: Uuid,
    pub commitment_id: String,
    pub workspace: String,
    pub prompt: String,
    pub status: String,
    pub claimed_by: Option<String>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub exit_code: Option<i32>,
    pub error: Option<String>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct SpawnLog {
    pub id: Uuid,
    pub spawn_id: Uuid,
    pub stream: String,  // stdout or stderr
    pub line: String,
    pub timestamp: DateTime<Utc>,
}

#[derive(Debug, Clone)]
pub enum SpawnEvent {
    New(SpawnRequest),
    Updated(SpawnRequest),
    Deleted(Uuid),
}

pub struct SupabaseClient {
    config: SupabaseConfig,
    http_client: reqwest::Client,
    instance_id: String,
}

impl SupabaseClient {
    pub fn new(config: SupabaseConfig) -> Self {
        let instance_id = format!("beacon-{}", Uuid::new_v4().to_string()[..8].to_string());

        Self {
            config,
            http_client: reqwest::Client::new(),
            instance_id,
        }
    }

    pub fn instance_id(&self) -> &str {
        &self.instance_id
    }

    fn api_url(&self, path: &str) -> String {
        format!("{}/rest/v1/{}", self.config.url, path)
    }

    fn realtime_url(&self) -> String {
        format!("{}/realtime/v1", self.config.url.replace("https://", "wss://"))
    }

    pub async fn fetch_pending_spawns(&self) -> Result<Vec<SpawnRequest>, String> {
        let url = format!("{}?status=eq.pending&order=created_at.asc",
            self.api_url("spawn_requests"));

        let response = self.http_client
            .get(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .send()
            .await
            .map_err(|e| format!("Failed to fetch spawn requests: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("API error: {}", response.status()));
        }

        let spawns: Vec<SpawnRequest> = response.json().await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        Ok(spawns)
    }

    pub async fn claim_spawn(&self, spawn_id: Uuid) -> Result<(), String> {
        let url = format!("{}?id=eq.{}&status=eq.pending",
            self.api_url("spawn_requests"), spawn_id);

        let body = serde_json::json!({
            "status": "claimed",
            "claimed_by": self.instance_id
        });

        let response = self.http_client
            .patch(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to claim spawn: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to claim: {}", response.status()));
        }

        info!("Claimed spawn request {}", spawn_id);
        Ok(())
    }

    pub async fn update_spawn_status(
        &self,
        spawn_id: Uuid,
        status: &str,
        exit_code: Option<i32>,
        error: Option<&str>,
    ) -> Result<(), String> {
        let url = format!("{}?id=eq.{}", self.api_url("spawn_requests"), spawn_id);

        let mut body = serde_json::json!({
            "status": status
        });

        if let Some(code) = exit_code {
            body["exit_code"] = serde_json::json!(code);
        }
        if let Some(err) = error {
            body["error"] = serde_json::json!(err);
        }

        match status {
            "running" => body["started_at"] = serde_json::json!(Utc::now()),
            "complete" | "error" => body["completed_at"] = serde_json::json!(Utc::now()),
            _ => {}
        }

        let response = self.http_client
            .patch(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to update status: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to update: {}", response.status()));
        }

        info!("Updated spawn {} to status: {}", spawn_id, status);
        Ok(())
    }

    pub async fn insert_spawn_log(
        &self,
        spawn_id: Uuid,
        stream: &str,
        line: &str,
    ) -> Result<(), String> {
        let url = self.api_url("spawn_logs");

        let body = serde_json::json!({
            "spawn_id": spawn_id,
            "stream": stream,
            "line": line
        });

        let response = self.http_client
            .post(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Content-Type", "application/json")
            .json(&body)
            .send()
            .await
            .map_err(|e| format!("Failed to insert log: {}", e))?;

        if !response.status().is_success() {
            warn!("Failed to insert spawn log: {}", response.status());
        }

        Ok(())
    }

    pub async fn create_memory(&self, body: &str, kind: &str) -> Result<String, String> {
        let url = self.api_url("memories");

        let mem_id = format!("mem_{}", Uuid::new_v4().to_string()[..8].to_string());
        let payload = serde_json::json!({
            "id": mem_id,
            "body": body,
            "kind": kind,
            "created_at": Utc::now()
        });

        let response = self.http_client
            .post(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to create memory: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to create memory: {}", response.status()));
        }

        info!("Created memory: {}", mem_id);
        Ok(mem_id)
    }

    pub async fn create_commitment(&self, body: &str, source: &str) -> Result<String, String> {
        let url = self.api_url("commitments");

        let cmt_id = format!("cmt_{}", Uuid::new_v4().to_string()[..8].to_string());
        let payload = serde_json::json!({
            "id": cmt_id,
            "body": body,
            "source": source,
            "state": "open",
            "created_at": Utc::now()
        });

        let response = self.http_client
            .post(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to create commitment: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to create commitment: {}", response.status()));
        }

        info!("Created commitment: {}", cmt_id);
        Ok(cmt_id)
    }

    pub async fn create_spawn_request(
        &self,
        commitment_id: &str,
        workspace: &str,
        prompt: &str,
    ) -> Result<Uuid, String> {
        let url = self.api_url("spawn_requests");

        let spawn_id = Uuid::new_v4();
        let payload = serde_json::json!({
            "id": spawn_id,
            "commitment_id": commitment_id,
            "workspace": workspace,
            "prompt": prompt,
            "status": "pending"
        });

        let response = self.http_client
            .post(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Content-Type", "application/json")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to create spawn request: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to create spawn: {}", response.status()));
        }

        info!("Created spawn request: {}", spawn_id);
        Ok(spawn_id)
    }

    pub async fn get_running_count(&self) -> Result<usize, String> {
        let url = format!("{}?status=eq.running&select=count",
            self.api_url("spawn_requests"));

        let response = self.http_client
            .get(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Prefer", "count=exact")
            .send()
            .await
            .map_err(|e| format!("Failed to get running count: {}", e))?;

        // Get count from content-range header
        if let Some(range) = response.headers().get("content-range") {
            if let Ok(range_str) = range.to_str() {
                // Format: "0-0/5" or "*/0"
                if let Some(count_str) = range_str.split('/').last() {
                    if let Ok(count) = count_str.parse::<usize>() {
                        return Ok(count);
                    }
                }
            }
        }

        Ok(0)
    }

    pub async fn get_pending_pr_count(&self) -> Result<usize, String> {
        // Query commitments with state = 'in_review' and tags containing 'pr'
        let url = format!("{}?state=eq.in_review&select=count",
            self.api_url("commitments"));

        let response = self.http_client
            .get(&url)
            .header("apikey", &self.config.anon_key)
            .header("Authorization", format!("Bearer {}", &self.config.anon_key))
            .header("Prefer", "count=exact")
            .send()
            .await
            .map_err(|e| format!("Failed to get PR count: {}", e))?;

        if let Some(range) = response.headers().get("content-range") {
            if let Ok(range_str) = range.to_str() {
                if let Some(count_str) = range_str.split('/').last() {
                    if let Ok(count) = count_str.parse::<usize>() {
                        return Ok(count);
                    }
                }
            }
        }

        Ok(0)
    }

    // Start realtime subscription - returns receiver for spawn events
    pub async fn subscribe_spawns(&self) -> Result<mpsc::Receiver<SpawnEvent>, String> {
        let (tx, rx) = mpsc::channel(100);

        // For now, use polling until realtime-rs is stable
        // TODO: Implement proper WebSocket subscription
        let config = self.config.clone();
        let client = self.http_client.clone();

        tokio::spawn(async move {
            loop {
                tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;

                let url = format!("{}/rest/v1/spawn_requests?status=eq.pending&order=created_at.asc",
                    config.url);

                match client
                    .get(&url)
                    .header("apikey", &config.anon_key)
                    .header("Authorization", format!("Bearer {}", &config.anon_key))
                    .send()
                    .await
                {
                    Ok(response) => {
                        if let Ok(spawns) = response.json::<Vec<SpawnRequest>>().await {
                            for spawn in spawns {
                                if tx.send(SpawnEvent::New(spawn)).await.is_err() {
                                    return; // Channel closed
                                }
                            }
                        }
                    }
                    Err(e) => {
                        warn!("Failed to poll spawn requests: {}", e);
                    }
                }
            }
        });

        Ok(rx)
    }
}
```

**Verification**:
```bash
cargo check
```

---

### Stage 4: Executor Module

Spawn and manage terminal processes.

**Create**: `src-tauri/src/executor.rs`

```rust
use std::process::Stdio;
use tokio::process::Command;
use tokio::io::{AsyncBufReadExt, BufReader};
use uuid::Uuid;
use tracing::{info, error, warn};
use crate::supabase::{SupabaseClient, SpawnRequest};

pub struct Executor {
    supabase: SupabaseClient,
}

impl Executor {
    pub fn new(supabase: SupabaseClient) -> Self {
        Self { supabase }
    }

    pub async fn execute(&self, spawn: SpawnRequest) -> Result<i32, String> {
        info!("Executing spawn {} for commitment {}", spawn.id, spawn.commitment_id);

        // Validate workspace exists
        if !std::path::Path::new(&spawn.workspace).exists() {
            let error_msg = format!("Workspace not found: {}", spawn.workspace);
            self.supabase.update_spawn_status(spawn.id, "error", None, Some(&error_msg)).await?;
            return Err(error_msg);
        }

        // Update status to running
        self.supabase.update_spawn_status(spawn.id, "running", None, None).await?;

        // Build the command
        // Uses the prompt as input to claude CLI
        let mut cmd = Command::new("claude");
        cmd.arg("--dangerously-skip-permissions")
            .arg(&spawn.prompt)
            .current_dir(&spawn.workspace)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());

        let mut child = cmd.spawn()
            .map_err(|e| format!("Failed to spawn process: {}", e))?;

        // Stream stdout
        let stdout = child.stdout.take();
        let stderr = child.stderr.take();
        let spawn_id = spawn.id;
        let supabase_stdout = self.supabase.clone();
        let supabase_stderr = self.supabase.clone();

        if let Some(stdout) = stdout {
            let supabase = supabase_stdout;
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = supabase.insert_spawn_log(spawn_id, "stdout", &line).await;
                }
            });
        }

        if let Some(stderr) = stderr {
            let supabase = supabase_stderr;
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                while let Ok(Some(line)) = lines.next_line().await {
                    let _ = supabase.insert_spawn_log(spawn_id, "stderr", &line).await;
                }
            });
        }

        // Wait for process to complete
        let status = child.wait().await
            .map_err(|e| format!("Failed to wait for process: {}", e))?;

        let exit_code = status.code().unwrap_or(-1);

        if status.success() {
            self.supabase.update_spawn_status(spawn.id, "complete", Some(exit_code), None).await?;
            info!("Spawn {} completed successfully", spawn.id);
        } else {
            let error_msg = format!("Process exited with code {}", exit_code);
            self.supabase.update_spawn_status(spawn.id, "error", Some(exit_code), Some(&error_msg)).await?;
            warn!("Spawn {} failed: {}", spawn.id, error_msg);
        }

        Ok(exit_code)
    }
}

// Clone implementation for SupabaseClient needed for executor
impl Clone for SupabaseClient {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            http_client: self.http_client.clone(),
            instance_id: self.instance_id.clone(),
        }
    }
}
```

**Verification**:
```bash
cargo check
```

---

### Stage 5: Tray Module

Menu bar icon and dropdown (GUI mode only).

**Create**: `src-tauri/src/tray.rs`

```rust
use tauri::{
    tray::{TrayIcon, TrayIconBuilder, MouseButton, MouseButtonState},
    menu::{Menu, MenuItem, PredefinedMenuItem},
    Manager, Runtime, AppHandle, Emitter,
};
use tracing::{info, error};

pub struct TrayManager {
    running_count: usize,
    pr_count: usize,
    connected: bool,
}

impl TrayManager {
    pub fn new() -> Self {
        Self {
            running_count: 0,
            pr_count: 0,
            connected: false,
        }
    }

    pub fn setup<R: Runtime>(app: &AppHandle<R>) -> Result<TrayIcon<R>, String> {
        let menu = Self::build_menu(app, 0, 0, false)?;

        let tray = TrayIconBuilder::new()
            .icon(app.default_window_icon().unwrap().clone())
            .menu(&menu)
            .tooltip("Mentu Beacon")
            .on_menu_event(move |app, event| {
                match event.id.as_ref() {
                    "new-intent" => {
                        // Show quick intent window
                        if let Some(window) = app.get_webview_window("quick-intent") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    "open-kanban" => {
                        // Open kanban in browser
                        let _ = open::that("https://mentu.ai/kanban");
                    }
                    "settings" => {
                        // TODO: Open settings window
                        info!("Settings clicked");
                    }
                    "quit" => {
                        app.exit(0);
                    }
                    _ => {}
                }
            })
            .build(app)
            .map_err(|e| format!("Failed to build tray: {}", e))?;

        Ok(tray)
    }

    fn build_menu<R: Runtime>(
        app: &AppHandle<R>,
        running_count: usize,
        pr_count: usize,
        connected: bool,
    ) -> Result<Menu<R>, String> {
        let status_text = if connected {
            format!("🟢 Connected")
        } else {
            format!("🔴 Disconnected")
        };

        let running_text = if running_count > 0 {
            format!("{} agents running", running_count)
        } else {
            "No agents running".to_string()
        };

        let pr_text = if pr_count > 0 {
            format!("{} PRs awaiting review", pr_count)
        } else {
            "No PRs pending".to_string()
        };

        let menu = Menu::with_items(app, &[
            &MenuItem::with_id(app, "status", &status_text, false, None::<&str>)
                .map_err(|e| e.to_string())?,
            &PredefinedMenuItem::separator(app).map_err(|e| e.to_string())?,
            &MenuItem::with_id(app, "running", &running_text, false, None::<&str>)
                .map_err(|e| e.to_string())?,
            &MenuItem::with_id(app, "prs", &pr_text, false, None::<&str>)
                .map_err(|e| e.to_string())?,
            &PredefinedMenuItem::separator(app).map_err(|e| e.to_string())?,
            &MenuItem::with_id(app, "new-intent", "New Intent", true, Some("CommandOrControl+Shift+I"))
                .map_err(|e| e.to_string())?,
            &MenuItem::with_id(app, "open-kanban", "Open Kanban", true, Some("CommandOrControl+Shift+K"))
                .map_err(|e| e.to_string())?,
            &PredefinedMenuItem::separator(app).map_err(|e| e.to_string())?,
            &MenuItem::with_id(app, "settings", "Settings...", true, None::<&str>)
                .map_err(|e| e.to_string())?,
            &PredefinedMenuItem::separator(app).map_err(|e| e.to_string())?,
            &MenuItem::with_id(app, "quit", "Quit Beacon", true, Some("CommandOrControl+Q"))
                .map_err(|e| e.to_string())?,
        ]).map_err(|e| format!("Failed to create menu: {}", e))?;

        Ok(menu)
    }

    pub fn update_counts(&mut self, running: usize, prs: usize) {
        self.running_count = running;
        self.pr_count = prs;
    }

    pub fn set_connected(&mut self, connected: bool) {
        self.connected = connected;
    }
}
```

**Verification**:
```bash
cargo check
```

---

### Stage 6: Notifier Module

OS notifications.

**Create**: `src-tauri/src/notifier.rs`

```rust
use tauri::{AppHandle, Runtime, Manager};
use tauri_plugin_notification::NotificationExt;
use tracing::{info, warn};

pub struct Notifier<R: Runtime> {
    app: AppHandle<R>,
    enabled: bool,
}

impl<R: Runtime> Notifier<R> {
    pub fn new(app: AppHandle<R>, enabled: bool) -> Self {
        Self { app, enabled }
    }

    pub fn notify_agent_complete(&self, commitment_id: &str) {
        if !self.enabled {
            return;
        }

        let _ = self.app
            .notification()
            .builder()
            .title("Agent Complete")
            .body(&format!("Commitment {} has completed", commitment_id))
            .show();

        info!("Sent notification for agent completion: {}", commitment_id);
    }

    pub fn notify_pr_ready(&self, pr_url: &str) {
        if !self.enabled {
            return;
        }

        let _ = self.app
            .notification()
            .builder()
            .title("PR Ready for Review")
            .body("A new pull request is awaiting your review")
            .show();

        info!("Sent notification for PR: {}", pr_url);
    }

    pub fn notify_error(&self, message: &str) {
        let _ = self.app
            .notification()
            .builder()
            .title("Beacon Error")
            .body(message)
            .show();

        warn!("Sent error notification: {}", message);
    }
}
```

**Verification**:
```bash
cargo check
```

---

### Stage 7: Tauri Commands

Commands for frontend communication.

**Create**: `src-tauri/src/commands.rs`

```rust
use tauri::{command, AppHandle, Runtime, Manager, State};
use crate::supabase::SupabaseClient;
use crate::config::BeaconConfig;
use tracing::info;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct AppState {
    pub supabase: Arc<Mutex<Option<SupabaseClient>>>,
    pub config: Arc<Mutex<BeaconConfig>>,
}

#[command]
pub async fn submit_quick_intent(
    state: State<'_, AppState>,
    text: String,
    workspace: Option<String>,
) -> Result<String, String> {
    let config = state.config.lock().await;
    let supabase_guard = state.supabase.lock().await;

    let supabase = supabase_guard.as_ref()
        .ok_or("Supabase client not initialized")?;

    // Determine workspace
    let ws = if let Some(ws_name) = workspace {
        config.find_workspace(&ws_name)
            .ok_or_else(|| format!("Workspace '{}' not found", ws_name))?
    } else {
        config.default_workspace()
            .ok_or("No default workspace configured")?
    };

    // Create memory
    let mem_id = supabase.create_memory(&text, "intent").await?;

    // Create commitment
    let cmt_id = supabase.create_commitment(&text, &mem_id).await?;

    // Build prompt for spawn
    let prompt = format!(
        "You are an Executor agent. Execute the following intent:\n\n{}\n\nCommitment ID: {}",
        text, cmt_id
    );

    // Create spawn request
    let spawn_id = supabase.create_spawn_request(&cmt_id, &ws.path, &prompt).await?;

    info!("Quick intent created: mem={}, cmt={}, spawn={}", mem_id, cmt_id, spawn_id);

    Ok(cmt_id)
}

#[command]
pub async fn get_status(
    state: State<'_, AppState>,
) -> Result<StatusResponse, String> {
    let supabase_guard = state.supabase.lock().await;

    let supabase = supabase_guard.as_ref()
        .ok_or("Supabase client not initialized")?;

    let running = supabase.get_running_count().await.unwrap_or(0);
    let prs = supabase.get_pending_pr_count().await.unwrap_or(0);

    Ok(StatusResponse {
        connected: true,
        running_agents: running,
        pending_prs: prs,
    })
}

#[derive(serde::Serialize)]
pub struct StatusResponse {
    pub connected: bool,
    pub running_agents: usize,
    pub pending_prs: usize,
}

#[command]
pub async fn get_workspaces(
    state: State<'_, AppState>,
) -> Result<Vec<WorkspaceInfo>, String> {
    let config = state.config.lock().await;

    Ok(config.workspaces.iter().map(|w| WorkspaceInfo {
        name: w.name.clone(),
        path: w.path.clone(),
        is_default: config.defaults.workspace.as_ref() == Some(&w.name),
    }).collect())
}

#[derive(serde::Serialize)]
pub struct WorkspaceInfo {
    pub name: String,
    pub path: String,
    pub is_default: bool,
}

#[command]
pub fn hide_quick_intent<R: Runtime>(app: AppHandle<R>) {
    if let Some(window) = app.get_webview_window("quick-intent") {
        let _ = window.hide();
    }
}
```

**Verification**:
```bash
cargo check
```

---

### Stage 8: Main Entry Point

Mode detection and initialization.

**Create**: `src-tauri/src/main.rs`

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod config;
mod supabase;
mod executor;
mod tray;
mod notifier;
mod commands;

use clap::Parser;
use config::BeaconConfig;
use supabase::SupabaseClient;
use executor::Executor;
use tray::TrayManager;
use commands::AppState;
use std::sync::Arc;
use tokio::sync::Mutex;
use tracing::{info, error, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Parser, Debug)]
#[command(name = "beacon")]
#[command(author = "Mentu")]
#[command(version = "1.0.0")]
#[command(about = "Mentu Beacon - Ledger to execution bridge")]
struct Args {
    /// Run in headless mode (no GUI)
    #[arg(long)]
    headless: bool,

    /// Show current status
    #[arg(long)]
    status: bool,

    /// Create intent from command line
    #[arg(long)]
    intent: Option<String>,

    /// Show config path
    #[arg(long)]
    config: bool,

    /// Run interactive setup
    #[arg(long)]
    setup: bool,
}

fn setup_logging(level: &str, file: Option<&str>) {
    let level = match level {
        "debug" => Level::DEBUG,
        "warn" => Level::WARN,
        "error" => Level::ERROR,
        _ => Level::INFO,
    };

    let subscriber = FmtSubscriber::builder()
        .with_max_level(level)
        .finish();

    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set subscriber");
}

#[tokio::main]
async fn main() {
    let args = Args::parse();

    // Handle --config flag
    if args.config {
        println!("{}", BeaconConfig::config_path().display());
        return;
    }

    // Handle --setup flag
    if args.setup {
        let config = BeaconConfig::create_default();
        if let Err(e) = config.save() {
            eprintln!("Failed to create config: {}", e);
            std::process::exit(1);
        }
        println!("Created config at: {}", BeaconConfig::config_path().display());
        println!("Please edit the file to add your Supabase credentials and workspaces.");
        return;
    }

    // Load config
    let config = match BeaconConfig::load() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Error: {}", e);
            std::process::exit(1);
        }
    };

    // Setup logging
    setup_logging(&config.log.level, config.log.file.as_deref());

    // Create Supabase client
    let supabase = SupabaseClient::new(config.supabase.clone());

    // Handle --status flag
    if args.status {
        match supabase.get_running_count().await {
            Ok(running) => {
                let prs = supabase.get_pending_pr_count().await.unwrap_or(0);
                println!("Running agents: {}", running);
                println!("PRs pending: {}", prs);
                println!("Instance: {}", supabase.instance_id());
            }
            Err(e) => {
                eprintln!("Failed to get status: {}", e);
                std::process::exit(1);
            }
        }
        return;
    }

    // Handle --intent flag
    if let Some(intent_text) = args.intent {
        let workspace = config.default_workspace()
            .ok_or("No default workspace configured")
            .unwrap();

        match supabase.create_memory(&intent_text, "intent").await {
            Ok(mem_id) => {
                match supabase.create_commitment(&intent_text, &mem_id).await {
                    Ok(cmt_id) => {
                        let prompt = format!(
                            "You are an Executor agent. Execute: {}\nCommitment: {}",
                            intent_text, cmt_id
                        );
                        match supabase.create_spawn_request(&cmt_id, &workspace.path, &prompt).await {
                            Ok(spawn_id) => {
                                println!("Created commitment: {}", cmt_id);
                                println!("Spawn request: {}", spawn_id);
                            }
                            Err(e) => {
                                eprintln!("Failed to create spawn request: {}", e);
                                std::process::exit(1);
                            }
                        }
                    }
                    Err(e) => {
                        eprintln!("Failed to create commitment: {}", e);
                        std::process::exit(1);
                    }
                }
            }
            Err(e) => {
                eprintln!("Failed to create memory: {}", e);
                std::process::exit(1);
            }
        }
        return;
    }

    // Run in headless or GUI mode
    if args.headless {
        run_headless(config, supabase).await;
    } else {
        run_gui(config, supabase);
    }
}

async fn run_headless(config: BeaconConfig, supabase: SupabaseClient) {
    info!("Starting Beacon in headless mode");
    info!("Instance ID: {}", supabase.instance_id());

    let executor = Executor::new(supabase.clone());

    // Subscribe to spawn requests
    let mut rx = match supabase.subscribe_spawns().await {
        Ok(rx) => rx,
        Err(e) => {
            error!("Failed to subscribe to spawn requests: {}", e);
            std::process::exit(1);
        }
    };

    info!("Listening for spawn requests...");

    // Process spawn requests
    while let Some(event) = rx.recv().await {
        match event {
            supabase::SpawnEvent::New(spawn) => {
                info!("Received spawn request: {}", spawn.id);

                // Try to claim
                if let Err(e) = supabase.claim_spawn(spawn.id).await {
                    error!("Failed to claim spawn {}: {}", spawn.id, e);
                    continue;
                }

                // Execute
                if let Err(e) = executor.execute(spawn).await {
                    error!("Execution failed: {}", e);
                }
            }
            _ => {}
        }
    }
}

fn run_gui(config: BeaconConfig, supabase: SupabaseClient) {
    info!("Starting Beacon in GUI mode");

    let app_state = AppState {
        supabase: Arc::new(Mutex::new(Some(supabase.clone()))),
        config: Arc::new(Mutex::new(config.clone())),
    };

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .manage(app_state)
        .invoke_handler(tauri::generate_handler![
            commands::submit_quick_intent,
            commands::get_status,
            commands::get_workspaces,
            commands::hide_quick_intent,
        ])
        .setup(|app| {
            // Setup tray
            let _ = TrayManager::setup(app.handle());

            // Start executor in background
            let supabase_clone = supabase.clone();
            let executor = Executor::new(supabase_clone.clone());

            tauri::async_runtime::spawn(async move {
                let mut rx = match supabase_clone.subscribe_spawns().await {
                    Ok(rx) => rx,
                    Err(e) => {
                        error!("Failed to subscribe: {}", e);
                        return;
                    }
                };

                while let Some(event) = rx.recv().await {
                    if let supabase::SpawnEvent::New(spawn) = event {
                        if let Err(e) = supabase_clone.claim_spawn(spawn.id).await {
                            continue;
                        }
                        let _ = executor.execute(spawn).await;
                    }
                }
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**Create**: `src-tauri/build.rs`

```rust
fn main() {
    tauri_build::build()
}
```

**Verification**:
```bash
cargo check
```

---

### Stage 9: Frontend (Quick Intent UI)

Minimal React frontend for the quick intent popup.

**Create**: `src/App.tsx`

```tsx
import React from 'react';
import QuickIntent from './QuickIntent';
import './styles.css';

function App() {
  return (
    <div className="app">
      <QuickIntent />
    </div>
  );
}

export default App;
```

**Create**: `src/QuickIntent.tsx`

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface Workspace {
  name: string;
  path: string;
  is_default: boolean;
}

function QuickIntent() {
  const [text, setText] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch workspaces on mount
    invoke<Workspace[]>('get_workspaces')
      .then(ws => {
        setWorkspaces(ws);
        const defaultWs = ws.find(w => w.is_default);
        if (defaultWs) {
          setSelectedWorkspace(defaultWs.name);
        }
      })
      .catch(err => console.error('Failed to get workspaces:', err));

    // Focus input
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const commitmentId = await invoke<string>('submit_quick_intent', {
        text: text.trim(),
        workspace: selectedWorkspace,
      });

      console.log('Created commitment:', commitmentId);
      setText('');

      // Hide window after submission
      await invoke('hide_quick_intent');
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      invoke('hide_quick_intent');
    }
  };

  return (
    <div className="quick-intent" onKeyDown={handleKeyDown}>
      <form onSubmit={handleSubmit}>
        <div className="input-row">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What do you want to do?"
            disabled={loading}
            autoFocus
          />
          {workspaces.length > 1 && (
            <select
              value={selectedWorkspace || ''}
              onChange={(e) => setSelectedWorkspace(e.target.value)}
              disabled={loading}
            >
              {workspaces.map(ws => (
                <option key={ws.name} value={ws.name}>
                  {ws.name}
                </option>
              ))}
            </select>
          )}
        </div>
        {error && <div className="error">{error}</div>}
        <div className="hint">Press Enter to submit, Escape to cancel</div>
      </form>
    </div>
  );
}

export default QuickIntent;
```

**Create**: `src/styles.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: transparent;
}

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.quick-intent {
  width: 100%;
  max-width: 400px;
  padding: 12px;
  background: #1a1a1a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
}

.input-row {
  display: flex;
  gap: 8px;
}

input[type="text"] {
  flex: 1;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  outline: none;
}

input[type="text"]:focus {
  border-color: #0ea5e9;
}

input[type="text"]::placeholder {
  color: #666;
}

select {
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #2a2a2a;
  color: #fff;
  outline: none;
  cursor: pointer;
}

select:focus {
  border-color: #0ea5e9;
}

.error {
  margin-top: 8px;
  padding: 8px;
  font-size: 12px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 4px;
}

.hint {
  margin-top: 8px;
  font-size: 11px;
  color: #666;
  text-align: center;
}
```

**Create**: `src/main.tsx`

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Create**: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Beacon Quick Intent</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Create**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
  },
});
```

**Create**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

**Create**: `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

**Verification**:
```bash
npm install
npm run build
```

---

## Before Submitting

Before running `mentu submit`, spawn validators:

1. Use Task tool with `subagent_type="technical-validator"`
2. Use Task tool with `subagent_type="intent-validator"`
3. Use Task tool with `subagent_type="safety-validator"`

All must return verdict: PASS before submitting.

---

## Completion Phase (REQUIRED)

**BEFORE calling `mentu submit`, you MUST create a RESULT document:**

### Step 1: Create RESULT Document

Read the template and create the RESULT document:

```bash
# Read the template structure
cat /Users/rashid/Desktop/Workspaces/mentu-ai/docs/templates/TEMPLATE-Result.md

# Create: docs/RESULT-Beacon-v1.0.md
```

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was built
- Files created and modified
- Test results (cargo build, npm build)
- Design decisions with rationale

### Step 2: Capture RESULT as Evidence

```bash
# Actor auto-resolved from manifest, author-type declares role
mentu capture "Created RESULT-Beacon-v1.0: Native menu bar app and headless daemon for Mentu ledger execution" \
  --kind result-document \
  --path docs/RESULT-Beacon-v1.0.md \
  --refs cmt_XXXXXXXX \
  --author-type executor
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
# Actor auto-resolved from manifest (same as claim)
mentu submit cmt_XXXXXXXX \
  --summary "Beacon v1.0: Tauri-based menu bar app + headless daemon bridging Mentu ledger to local execution" \
  --include-files
```

**The RESULT document IS the closure proof. Do not submit without it.**

---

## Verification Checklist

### Files
- [ ] `src-tauri/src/main.rs` exists
- [ ] `src-tauri/src/config.rs` exists
- [ ] `src-tauri/src/supabase.rs` exists
- [ ] `src-tauri/src/executor.rs` exists
- [ ] `src-tauri/src/tray.rs` exists
- [ ] `src-tauri/src/notifier.rs` exists
- [ ] `src-tauri/src/commands.rs` exists
- [ ] `src-tauri/Cargo.toml` exists
- [ ] `src-tauri/tauri.conf.json` exists
- [ ] `src/App.tsx` exists
- [ ] `src/QuickIntent.tsx` exists
- [ ] `src/styles.css` exists
- [ ] `package.json` exists

### Checks
- [ ] `cargo build --release` passes
- [ ] `npm run build` passes
- [ ] Binary size < 10MB

### Mentu
- [ ] Commitment created with `mentu commit`
- [ ] Commitment claimed with `mentu claim`
- [ ] Validators passed (technical, intent, safety)
- [ ] **RESULT document created** (`docs/RESULT-Beacon-v1.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] **RESULT front matter updated** with evidence ID
- [ ] Commitment submitted with `mentu submit`
- [ ] `mentu list commitments --state open` returns []

### Functionality
- [ ] `beacon` launches GUI with menu bar icon
- [ ] `beacon --headless` runs as daemon
- [ ] `beacon --status` shows running agents count
- [ ] `beacon --intent "test"` creates commitment
- [ ] Quick intent (⌘I) opens popup
- [ ] Menu bar shows connection status

---

*One binary. Always listening. Ledger in. Execution out.*
