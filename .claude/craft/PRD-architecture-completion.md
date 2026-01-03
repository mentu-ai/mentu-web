# PRD: Architecture Completion for mentu-web

**Mode:** Architect
**Author:** agent:claude-architect
**Date:** 2026-01-03
**Target:** mentu-web repository

---

## Context

mentu-web is the **Eyes** of the Mentu organism—the visualization layer that shows commitments, memories, and ledger state. It's a Next.js dashboard deployed to Vercel.

Current state:
- ✅ `.mentu/manifest.yaml` exists
- ✅ `.mentu/ledger.jsonl` exists
- ❌ `CLAUDE.md` missing
- ❌ `.mentu/genesis.key` missing
- ❌ `.mentu/config.yaml` missing

---

## What Must Be Done

### 1. Create CLAUDE.md

**Location:** `CLAUDE.md` (repository root)

**Requirements:**
- Identity block with location, role, version
- Description of what the repo does
- Architecture overview (pages, components)
- Dependencies (mentu-ai, mentu-proxy)
- Commands (npm run dev, build, deploy)
- Agent entry protocol

### 2. Create genesis.key

**Location:** `.mentu/genesis.key`

**Requirements:**
- Actor: `user:dashboard` (from manifest.yaml)
- Role: Visualization interface
- Permitted operations: `capture`, `annotate` (read-only viewer)
- The dashboard displays data but doesn't modify commitments
- Trust gradient enabled with architect/auditor/executor roles
- Owner: Rashid Azarang

### 3. Create config.yaml

**Location:** `.mentu/config.yaml`

**Requirements:**
- Use environment variable references (no hardcoded secrets)
- Reference `${MENTU_API_URL}` for API endpoint
- Reference `${MENTU_WORKSPACE_ID}` for workspace
- Cloud enabled for Vercel deployment
- Integrations: both disabled (dashboard consumes, doesn't produce)

---

## Design Constraints

1. **The dashboard is read-only** — displays commitments, doesn't create them
2. **Uses mentu-proxy for API access** — doesn't talk to Supabase directly (for mobile)
3. **User authentication via Supabase** — but operations are read-focused
4. **Deployed to Vercel** — environment variables set there

---

## Reference

Use mentu-ai/.mentu/genesis.key as the canonical schema reference.
Use claude-code/.mentu/ for recently created examples.
Use mentu-proxy/CLAUDE.md as template for CLAUDE.md format.

---

*Strategic intent only. Auditor will validate and produce implementation instructions.*
