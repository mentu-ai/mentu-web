---

## INTENT: Beacon v2.0

---

The Beacon is the daemon that makes the machine listen.

Today we have two systems doing related work. The mentu-bridge is a Node.js daemon that watches the ledger, claims spawn requests, creates worktrees, enforces genesis rules, handles approvals, and executes agents. It works. It has been tested. It runs on laptops and VPS servers. The mentu-proxy is a Cloudflare Worker that sits at the edge, receives webhooks from the outside world, provides an API for mobile and web clients, and routes requests into the system. It also works. It is infrastructure.

These two systems will continue to operate. Nothing we build should break them. Nothing we build should require them to change. They are proven. They are running. They serve their purpose.

What we are building is something new that will eventually take the place of mentu-bridge, but only when it has earned that right by demonstrating identical behavior and superior experience. Until that day, both can run side by side. They watch the same tables. They claim from the same queue. The atomic claim logic ensures they never conflict. One machine, one claim, one execution.

The Beacon is a native application written entirely in Rust. It compiles to a single binary. No Node.js runtime. No npm dependencies. No subprocess management. When you download Beacon, you download one file. When you run it, it just works. This simplicity is the point. A daemon should be invisible. A daemon should require no maintenance. A daemon should start when the machine starts and run until the machine stops.

The Beacon has two faces. On a laptop or desktop, it lives in the menu bar. A small icon. Always present. You forget it exists until you need it. You glance at it and see green, which means connected and ready. You see it pulse and know an agent is working. You see yellow and know something needs attention. You see red and know the connection is lost. This ambient awareness is the gift of native presence. A web page cannot do this. A web page lives in a tab you might have closed. The Beacon lives in the operating system itself.

On a server, the Beacon has no face. It runs headless. A systemd service that starts on boot and runs forever. No menu bar because there is no screen. No notifications because there is no human watching. Just the engine. Watching the ledger. Claiming work. Executing agents. Reporting evidence. Twenty-four hours a day without pause.

The same binary serves both purposes. You run beacon and get the menu bar. You run beacon with a headless flag and get the daemon. One codebase. One compilation. One behavior. The only difference is whether a human interface wraps the engine.

The engine is the heart. Let me describe what the engine must do, because this is what mentu-bridge does today, and this is what Beacon must do identically.

The engine subscribes to Supabase through a WebSocket connection. Real-time. Not polling. When a row appears in the bridge_commands table with a pending status, the engine sees it within milliseconds. This responsiveness matters. When a human clicks Spawn Agent in the Kanban, they expect the agent to start immediately. Seconds of latency feel broken. Milliseconds feel instant.

The engine claims work atomically. There might be many Beacons watching the same table. Your laptop at home. Your laptop at work. Your VPS in the cloud. A teammate's machine. When a spawn request arrives, only one should execute it. The engine attempts to update the row, setting the status to claimed and the claimer to its own identity. The database ensures only one update succeeds. The winner executes. The losers see that someone else claimed it and move on. No duplicate work. No race conditions. No wasted compute.

The engine registers itself. When it starts, it writes a record to bridge_machines. Its identity. Its capabilities. Its location. Every sixty seconds, it updates a heartbeat timestamp. This is how the system knows what is online. If a Beacon stops sending heartbeats, it is considered dead. The Kanban can show which machines are available. Spawn requests can route to specific machines based on affinity. The heartbeat is the pulse that proves the daemon is alive.

The engine enforces genesis. Every workspace has a genesis file that defines what is allowed. What operations. What actors. What constraints. Before executing any spawn request, the engine reads the genesis file for that workspace and validates that the request is permitted. If the request violates genesis, the engine rejects it. It does not execute. It records the violation. This is the constitutional layer. The engine is the enforcer of the constitution.

The engine creates worktrees. When a commitment spawns, the agent should not work in the main branch. The engine creates a git worktree. A separate directory. A dedicated branch named after the commitment. The agent works there in isolation. If the work fails or is rejected, the worktree can be deleted cleanly. If the work succeeds, it merges back. This isolation enables parallel work on multiple commitments without interference.

The engine handles approvals. Some work requires human sign-off before it can proceed. The spawn request might have an approval_required flag. The engine sees this. It pauses. It waits. It polls for the approval to appear in the database. When a human grants approval, the engine resumes. This is human-in-the-loop at the execution layer. The agent cannot bypass it because the agent does not control the engine.

The engine executes commands. It spawns a child process. It sets the working directory to the worktree. It injects environment variables that tell the agent what commitment it is working on and where it is working. It runs the claude command with the prompt from the spawn request. It captures stdout and stderr. It streams them to the spawn_logs table so the Kanban can show live output. When the process exits, it records the exit code, the duration, the final status.

The engine captures evidence. Completion is not just an exit code. The engine may record what files changed, what the agent produced, what the outcome was. This evidence links back to the commitment in the ledger. The chain of accountability is unbroken because the engine reports everything.

The engine schedules commitments. Some commitments have due dates. They should execute automatically when the time comes. The engine periodically queries for commitments that are due. When it finds one, it creates a spawn request for it. The normal flow takes over. This enables scheduled work without external cron jobs or manual intervention.

All of this is what mentu-bridge does in Node.js. All of this is what Beacon must do in Rust. The behavior is not negotiable. The behavior is the contract. Agents depend on worktrees being created in a specific way. The Kanban depends on status updates happening in a specific sequence. The ledger depends on evidence being captured in a specific format. Beacon must honor all of these contracts.

But Beacon adds what mentu-bridge cannot have. Native presence.

The menu bar icon is awareness. It tells you at a glance whether the system is healthy. Green is good. Red is trouble. Pulsing means work is happening. You never have to open a browser to check status. You never have to ssh into a server to see if the daemon is running. You look at your menu bar and you know.

The dropdown menu is the quick view. Click the icon and see the essentials. How many agents are running right now. How many pull requests are waiting for your review. Which workspaces are connected. Shortcuts to open the Kanban, to view settings, to quit the application. This is not a full interface. This is a peek. Enough to decide whether to go deeper.

The Quick Intent popup is speed. You press a keyboard shortcut. A minimal window appears. You type what you want to happen. You select which workspace it applies to. You press enter. The window vanishes. A memory is created in the ledger. A commitment is created from that memory. A spawn request is queued. An agent begins working. You did all of this without opening a browser. Without navigating anywhere. Without leaving the application you were working in. This is intent capture at the speed of thought.

The notifications are presence. When an agent finishes, a native notification appears. When a pull request is ready for review, a native notification appears. When something fails, a native notification appears. You do not have to watch the Kanban. You do not have to poll for updates. The system reaches out and taps you on the shoulder when it needs you. This is what native applications can do that web applications cannot.

The settings are simplicity. You configure Supabase credentials once. You add workspace paths. You choose whether you want notifications. You set your preferred keyboard shortcut. That is all. There is no complexity because there should be no complexity. This is infrastructure. Infrastructure should be configured once and forgotten.

Beacon is built in Rust with Tauri for the native shell. Rust gives us a single binary with no runtime dependencies. Rust gives us memory safety without garbage collection pauses. Rust gives us the performance to handle WebSocket streams and process spawning without breaking a sweat. Tauri gives us native windows and menu bars and notifications across macOS and Linux with a tiny footprint. The resulting binary should be under ten megabytes. Ideally under five.

Beacon must run on macOS, both Intel and ARM. Beacon must run on Linux x86_64 for VPS deployment. Windows is deferred. Cross-compilation from a Mac development machine to Linux targets is required so that a developer can build the VPS binary without leaving their laptop.

The database tables do not change. Beacon uses bridge_commands exactly as mentu-bridge uses it. Beacon uses bridge_machines exactly as mentu-bridge uses it. Beacon uses spawn_logs exactly as mentu-bridge uses it. If the tables changed, every other system that depends on them would break. The tables are the contract. Beacon honors the contract.

The migration is gradual. When Beacon is ready, you can run it alongside mentu-bridge. Both watch the same queue. Both can claim work. The atomic claim ensures no conflicts. You can migrate one machine at a time. Start with a development laptop where the stakes are low. Verify that behavior is identical. Move to a staging server. Verify again. Eventually replace all mentu-bridge instances with Beacon. Keep mentu-bridge in the repository for a while in case you need to fall back. Archive it when confidence is complete.

mentu-proxy does not change. mentu-proxy is not replaced. mentu-proxy is a Cloudflare Worker that lives at the edge. It cannot be replaced by something running on your laptop because its job is to be on the internet receiving webhooks and serving API requests. Beacon and mentu-proxy are complementary. The proxy receives signals from the outside world and writes them to the database. The Beacon watches the database and executes locally. They do not overlap. They do not conflict.

What success looks like is this. A developer downloads Beacon. One file. They run the setup command and enter their Supabase credentials. Beacon appears in their menu bar. They add their workspace paths. They press the keyboard shortcut and type an intent. An agent starts working. They see the icon pulse. A few minutes later, a notification tells them a PR is ready. They click it and GitHub opens. They review and merge. They did not think about daemons or processes or WebSocket connections. They just had an intent and the system made it real.

The same developer installs Beacon on their VPS. They scp the Linux binary to the server. They create a systemd service file. They start the service. It runs forever. When they queue heavy work, it routes to the VPS. When they queue quick fixes, it runs locally. They do not manage this routing manually. The workspace skills define machine affinity. Beacon honors it.

A year from now, the developer has forgotten Beacon exists. It just runs. Agents spawn when needed. Evidence flows to the ledger. Pull requests appear for review. The menu bar icon is always there, always green, always ready. The daemon that made the machine listen has become invisible. That is the goal. Infrastructure so reliable you forget it exists.

This is Beacon v2.0. A complete Rust implementation of the mentu-bridge execution engine, combined with native presence that transforms a daemon into a companion. One binary. Two modes. Total compatibility with existing infrastructure. The bridge between intent and execution, made native.

---

```yaml
id: INTENT-Beacon-v2.0
type: intent
tier: T3
created: 2026-01-06
author: architect:human+claude
status: ready
target_repo: mentu-beacon
supersedes: INTENT-Beacon-v1.0
preserves:
  - mentu-bridge (continues operating during migration)
  - mentu-proxy (unchanged, complementary infrastructure)
```