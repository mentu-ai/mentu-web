#!/bin/bash
# Auditor: Validates PRD and produces INSTRUCTION.md
#
# Usage: ./run-auditor.sh
#
# Reads: PRD-architecture-completion.md
# Writes: INSTRUCTION.md

set -e

cd /Users/rashid/Desktop/Workspaces/mentu-web

claude -p "You are the AUDITOR for mentu-web.

Your role: Validate the Architect's PRD and produce executable instructions.

## Your Task

1. Read the PRD at .claude/craft/PRD-architecture-completion.md
2. Read the reference files:
   - /Users/rashid/Desktop/Workspaces/mentu-ai/.mentu/genesis.key (canonical schema)
   - /Users/rashid/Desktop/Workspaces/claude-code/.mentu/genesis.key (recent example)
   - /Users/rashid/Desktop/Workspaces/claude-code/.mentu/config.yaml (recent example)
   - /Users/rashid/Desktop/Workspaces/mentu-proxy/CLAUDE.md (template for CLAUDE.md)
3. Read the existing manifest at .mentu/manifest.yaml
4. Validate the requirements against reality
5. Write INSTRUCTION.md with EXACT file contents to create

## Output Format

Write to .claude/craft/INSTRUCTION.md with:
- Mode: Executor
- Author: agent:claude-auditor
- Exact markdown contents for CLAUDE.md (in code block)
- Exact YAML contents for genesis.key (in code block)
- Exact YAML contents for config.yaml (in code block)
- Execution checklist

## Constraints

- genesis.key actor is 'user:dashboard' (from manifest)
- Dashboard is read-only - only displays, doesn't create commitments
- Permitted operations: capture, annotate (read-only observer)
- Trust gradient must be enabled
- config.yaml uses environment variables, no secrets
- CLAUDE.md follows same structure as mentu-proxy/CLAUDE.md

Write the INSTRUCTION.md file now." --output-format text --max-turns 25 --dangerously-skip-permissions
