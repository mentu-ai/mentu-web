---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
# All fields are machine-fetchable and deterministic.
# No narrative or prose is allowed in this block.
# Agents MUST upsert this metadata on execution or edit.
# ============================================================

# IDENTITY
id: HANDOFF-AgentChatPanel-v2.0
path: docs/HANDOFF-AgentChatPanel-v2.0.md
type: handoff
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-06
last_updated: 2026-01-06

# TIER
tier: T3

# AUTHOR TYPE
author_type: executor

# RELATIONSHIPS
parent: PRD-AgentChatPanel-v2.0
children:
  - PROMPT-AgentChatPanel-v2.0

# MENTU INTEGRATION
mentu:
  commitment: cmt_a69de8b6
  status: pending

# VALIDATION
validation:
  required: true
  tier: T2
---

# HANDOFF: AgentChatPanel v2.0

## For the Coding Agent

Transform the Agent Chat into the Intent Architect—a specialized agent that helps humans articulate intent with deep Mentu knowledge, workspace awareness, and the ability to create commitments.

**Read the full PRD**: `docs/PRD-AgentChatPanel-v2.0.md`

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
  "name": "AgentChatPanel-v2.0",
  "tier": "T3",
  "required_files": [
    "agent-service/src/system/prompt.ts",
    "agent-service/src/tools/registry.ts",
    "agent-service/src/tools/filesystem-tools.ts",
    "agent-service/src/tools/supabase-tools.ts",
    "agent-service/src/context/loader.ts",
    "agent-service/src/context/workspace.ts",
    "src/components/agent-chat/ContextIndicator.tsx"
  ],
  "checks": {
    "tsc": true,
    "build": true,
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
  "max_iterations": 100
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
│  .mentu/manifest.yaml     author_type: executor       mentu-web           │
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
mentu claim cmt_a69de8b6 --author-type executor

# Capture progress (actor auto-resolved, role declared)
mentu capture "{Progress}" --kind execution-progress --author-type executor
```

Save the commitment ID. You will close it with evidence.

---

## Build Order

### Stage 1: System Prompt Evolution

Establish the Intent Architect identity with comprehensive Mentu knowledge.

**File**: `agent-service/src/system/prompt.ts`

Create a new file that exports the system prompt:

```typescript
/**
 * Intent Architect System Prompt
 *
 * This prompt establishes the agent's identity, Mentu knowledge,
 * behavioral guidelines, and workflow for intent articulation.
 */

export const INTENT_ARCHITECT_PROMPT = `
# Identity

You are the Intent Architect. Your singular purpose is to help humans articulate what should exist that does not exist yet. You are not a general assistant. You do not implement features, review code, debug failures, or manage infrastructure. You take the scattered thoughts in a human's mind and help crystallize them into commitments that agents can execute accountably.

# Mentu Knowledge

You are a native speaker of Mentu. The following operations are as natural to you as breathing:

## The Twelve Ledger Operations

| Operation | Purpose | When to Use |
|-----------|---------|-------------|
| capture | Creates memories | Recording observations, intents, evidence, progress |
| commit | Creates obligations | Formalizing intent into trackable commitments |
| claim | Takes ownership | Agent accepts responsibility for a commitment |
| close | Provides evidence | Proving work was done, requires proof |
| submit | Requests review | Signaling readiness for approval |
| approve | Accepts work | Validating closure evidence meets requirements |
| reopen | Resumes work | When approved work needs more attention |
| retarget | Changes ownership | Reassigning to a different actor |
| annotate | Adds context | Attaching notes without changing state |
| escalate | Flags blockers | Signaling need for human intervention |
| archive | Closes without evidence | Abandoning work without completion |
| unarchive | Restores archived | Resuming previously abandoned work |

## The Dual Triad

You understand the governance model:

- **Architect**: Envisions what should exist. Defines intent. You are the Architect's tool.
- **Auditor**: Validates and scopes. Has filesystem access. Reviews feasibility.
- **Executor**: Implements without reinterpreting. Follows instructions precisely.

What you produce will be audited by another agent who can read the codebase. What survives audit will be executed by an agent who implements without questioning. This chain means intent must be clear enough to survive translation through multiple agents. Ambiguity at the intent stage becomes failure at the execution stage.

## Trust and Accountability

Every commitment requires evidence. Every closure must prove work was done. When helping articulate intent, you should help humans think about what evidence will look like before work begins. What will prove this feature works? What screenshots, tests, or behaviors will demonstrate success? Thinking about evidence early makes intents more concrete and more verifiable.

## Author Types

Recognize which role the human is acting as:

- **As Architect**: They are defining what should exist. Help them articulate clearly.
- **As Auditor**: They want to understand scope or validate approach. Help them analyze.
- **As Executor**: They want implementation guidance. Redirect them—that's not your domain.

# Your Workflow

## 1. Context Gathering

When a human describes what they want, do not immediately respond with suggestions. Pause. Reach into the workspace:

- Query the ledger for relevant history
- Read configuration files to understand constraints
- Search the codebase for existing patterns
- Pull context that will help you help them

Only then engage.

## 2. Collaborative Engagement

Engagement is collaborative, not interrogative:

- Share what you discovered that seems relevant
- Ask questions that help them think through implications
- Propose structure for the intent based on patterns you found
- Surface potential conflicts with existing work

You are not grilling them. You are thinking alongside them.

## 3. Fractal Decomposition

If the intent is large (weeks of work, touches many systems), help decompose:

- Find natural fracture lines
- Identify what can be done first that enables what comes next
- Determine the smallest meaningful piece
- Map dependencies between pieces

The result is not one massive intent but a structured set that builds coherently.

## 4. Formalization

When intent is clear, offer to formalize:

- Capture a memory that records the articulated intent
- Create a commitment that states what will be done
- Link the commitment to the source memory
- Optionally queue a spawn request for immediate execution

These are not suggestions. These are actions you take within Mentu.

## 5. Confirmation

After formalization, confirm:

- What memory was captured (mem_xxx)
- What commitment was created (cmt_xxx)
- What happens next (audit, execution, or waiting)

# Boundaries

You do not:
- Write code (that's executor domain)
- Review pull requests (point them to the Kanban)
- Debug runtime errors (help capture as bug memory instead)
- Implement anything (you articulate intent only)

When asked to do these things, decline clearly and redirect to your purpose.

# Memory Across Sessions

Remember patterns about this human:
- What kinds of intents they articulate
- What language they use
- What scope they prefer
- What they tend to forget

Over time, become better at helping this specific human.

# Available Tools

You have tools to:
- Read files from configured workspaces
- Search codebases for patterns
- Query the ledger directly
- List commitments and memories
- Capture memories
- Create commitments
- Check workspace configuration

Use them proactively to gather context before engaging.
`;

export default INTENT_ARCHITECT_PROMPT;
```

**Verification**:
```bash
cd agent-service && npx tsc --noEmit src/system/prompt.ts
```

---

### Stage 2: Filesystem Tools

Add tools for reading and searching the codebase.

**File**: `agent-service/src/tools/filesystem-tools.ts`

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';

const execAsync = promisify(exec);

// Allowed workspace paths (configure via environment)
const ALLOWED_WORKSPACES = (process.env.ALLOWED_WORKSPACES || '/Users/rashid/Desktop/Workspaces').split(',');

/**
 * Validates that a path is within allowed workspaces
 */
function isPathAllowed(targetPath: string): boolean {
  const resolved = path.resolve(targetPath);
  return ALLOWED_WORKSPACES.some(ws => resolved.startsWith(path.resolve(ws)));
}

/**
 * Read a file from allowed workspace
 */
export async function readFile(input: { path: string; limit?: number }): Promise<string> {
  const { path: filePath, limit = 500 } = input;

  if (!isPathAllowed(filePath)) {
    throw new Error(`Access denied: ${filePath} is outside allowed workspaces`);
  }

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');

    if (lines.length > limit) {
      return lines.slice(0, limit).join('\n') + `\n\n[... truncated at ${limit} lines, ${lines.length - limit} more ...]`;
    }

    return content;
  } catch (error) {
    throw new Error(`Failed to read file: ${(error as Error).message}`);
  }
}

/**
 * Search for files matching a glob pattern
 */
export async function globFiles(input: { pattern: string; cwd?: string; limit?: number }): Promise<string[]> {
  const { pattern, cwd = ALLOWED_WORKSPACES[0], limit = 50 } = input;

  if (!isPathAllowed(cwd)) {
    throw new Error(`Access denied: ${cwd} is outside allowed workspaces`);
  }

  try {
    // Use find for glob-like matching
    const { stdout } = await execAsync(
      `find "${cwd}" -type f -name "${pattern}" 2>/dev/null | head -${limit}`,
      { timeout: 30000 }
    );

    return stdout.trim().split('\n').filter(Boolean);
  } catch (error) {
    throw new Error(`Glob failed: ${(error as Error).message}`);
  }
}

/**
 * Search file contents for a pattern
 */
export async function grepFiles(input: {
  pattern: string;
  glob?: string;
  cwd?: string;
  limit?: number;
}): Promise<Array<{ file: string; line: number; content: string }>> {
  const { pattern, glob = '*', cwd = ALLOWED_WORKSPACES[0], limit = 50 } = input;

  if (!isPathAllowed(cwd)) {
    throw new Error(`Access denied: ${cwd} is outside allowed workspaces`);
  }

  try {
    // Use ripgrep if available, fallback to grep
    const cmd = `rg --no-heading --line-number --max-count ${limit} "${pattern}" "${cwd}" --glob "${glob}" 2>/dev/null || grep -rn "${pattern}" "${cwd}" --include="${glob}" 2>/dev/null | head -${limit}`;

    const { stdout } = await execAsync(cmd, { timeout: 30000 });

    return stdout.trim().split('\n').filter(Boolean).map(line => {
      const [file, lineNum, ...rest] = line.split(':');
      return {
        file,
        line: parseInt(lineNum, 10),
        content: rest.join(':').trim()
      };
    });
  } catch (error) {
    // No matches is not an error
    if ((error as any).code === 1) {
      return [];
    }
    throw new Error(`Grep failed: ${(error as Error).message}`);
  }
}

/**
 * List files in a directory
 */
export async function listDirectory(input: { path: string; recursive?: boolean }): Promise<string[]> {
  const { path: dirPath, recursive = false } = input;

  if (!isPathAllowed(dirPath)) {
    throw new Error(`Access denied: ${dirPath} is outside allowed workspaces`);
  }

  try {
    if (recursive) {
      const { stdout } = await execAsync(
        `find "${dirPath}" -type f 2>/dev/null | head -100`,
        { timeout: 30000 }
      );
      return stdout.trim().split('\n').filter(Boolean);
    } else {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      return entries.map(e => path.join(dirPath, e.name));
    }
  } catch (error) {
    throw new Error(`List directory failed: ${(error as Error).message}`);
  }
}

// Tool definitions for Claude
export const filesystemToolDefinitions = [
  {
    name: 'read_file',
    description: 'Read the contents of a file from the workspace. Use this to understand existing code patterns and configuration.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Absolute path to the file to read'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to return (default: 500)'
        }
      },
      required: ['path']
    }
  },
  {
    name: 'glob_files',
    description: 'Find files matching a glob pattern. Use this to discover what files exist before reading them.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern to match (e.g., "*.ts", "package.json")'
        },
        cwd: {
          type: 'string',
          description: 'Directory to search in (defaults to primary workspace)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'grep_files',
    description: 'Search file contents for a pattern. Use this to find where specific code patterns exist.',
    input_schema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Regular expression pattern to search for'
        },
        glob: {
          type: 'string',
          description: 'File pattern to search within (e.g., "*.ts")'
        },
        cwd: {
          type: 'string',
          description: 'Directory to search in (defaults to primary workspace)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 50)'
        }
      },
      required: ['pattern']
    }
  },
  {
    name: 'list_directory',
    description: 'List files in a directory. Use this to understand project structure.',
    input_schema: {
      type: 'object',
      properties: {
        path: {
          type: 'string',
          description: 'Directory path to list'
        },
        recursive: {
          type: 'boolean',
          description: 'Whether to list recursively (default: false)'
        }
      },
      required: ['path']
    }
  }
];

// Handler map
export const filesystemToolHandlers: Record<string, (input: any) => Promise<any>> = {
  read_file: readFile,
  glob_files: globFiles,
  grep_files: grepFiles,
  list_directory: listDirectory
};
```

**Verification**:
```bash
cd agent-service && npx tsc --noEmit src/tools/filesystem-tools.ts
```

---

### Stage 3: Supabase Tools

Add tools for querying the ledger directly.

**File**: `agent-service/src/tools/supabase-tools.ts`

```typescript
import { supabase } from '../db/supabase';

/**
 * Query operations from the ledger
 */
export async function queryOperations(input: {
  workspace_id?: string;
  operation?: string;
  actor?: string;
  limit?: number;
  since?: string;
}): Promise<any[]> {
  const { workspace_id, operation, actor, limit = 20, since } = input;

  let query = supabase
    .from('operations')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (workspace_id) {
    query = query.eq('workspace_id', workspace_id);
  }
  if (operation) {
    query = query.eq('operation', operation);
  }
  if (actor) {
    query = query.eq('actor', actor);
  }
  if (since) {
    query = query.gte('timestamp', since);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Query operations failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Query commitments with filters
 */
export async function queryCommitments(input: {
  workspace_id?: string;
  state?: string;
  assignee?: string;
  limit?: number;
  search?: string;
}): Promise<any[]> {
  const { workspace_id, state, assignee, limit = 20, search } = input;

  let query = supabase
    .from('commitments')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (workspace_id) {
    query = query.eq('workspace_id', workspace_id);
  }
  if (state) {
    query = query.eq('state', state);
  }
  if (assignee) {
    query = query.eq('assignee', assignee);
  }
  if (search) {
    query = query.ilike('body', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Query commitments failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Query memories with filters
 */
export async function queryMemories(input: {
  workspace_id?: string;
  kind?: string;
  limit?: number;
  since?: string;
  search?: string;
}): Promise<any[]> {
  const { workspace_id, kind, limit = 20, since, search } = input;

  let query = supabase
    .from('memories')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (workspace_id) {
    query = query.eq('workspace_id', workspace_id);
  }
  if (kind) {
    query = query.eq('kind', kind);
  }
  if (since) {
    query = query.gte('timestamp', since);
  }
  if (search) {
    query = query.ilike('body', `%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Query memories failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Get commitment details by ID
 */
export async function getCommitment(input: { id: string }): Promise<any> {
  const { data, error } = await supabase
    .from('commitments')
    .select('*')
    .eq('id', input.id)
    .single();

  if (error) {
    throw new Error(`Get commitment failed: ${error.message}`);
  }

  return data;
}

/**
 * Get memory details by ID
 */
export async function getMemory(input: { id: string }): Promise<any> {
  const { data, error } = await supabase
    .from('memories')
    .select('*')
    .eq('id', input.id)
    .single();

  if (error) {
    throw new Error(`Get memory failed: ${error.message}`);
  }

  return data;
}

// Tool definitions for Claude
export const supabaseToolDefinitions = [
  {
    name: 'query_operations',
    description: 'Query the operation ledger for historical activity. Use this to understand what work has been done recently.',
    input_schema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Filter by workspace ID'
        },
        operation: {
          type: 'string',
          description: 'Filter by operation type (capture, commit, claim, close, etc.)'
        },
        actor: {
          type: 'string',
          description: 'Filter by actor (e.g., "user:rashid", "agent:claude-executor")'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)'
        },
        since: {
          type: 'string',
          description: 'Only return operations after this ISO timestamp'
        }
      }
    }
  },
  {
    name: 'query_commitments',
    description: 'Query commitments with filters. Use this to find related work and avoid duplicating effort.',
    input_schema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Filter by workspace ID'
        },
        state: {
          type: 'string',
          description: 'Filter by state (open, claimed, in_review, closed, archived)'
        },
        assignee: {
          type: 'string',
          description: 'Filter by assignee actor'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)'
        },
        search: {
          type: 'string',
          description: 'Search term to match in commitment body'
        }
      }
    }
  },
  {
    name: 'query_memories',
    description: 'Query memories with filters. Use this to find past intents, observations, and evidence.',
    input_schema: {
      type: 'object',
      properties: {
        workspace_id: {
          type: 'string',
          description: 'Filter by workspace ID'
        },
        kind: {
          type: 'string',
          description: 'Filter by kind (observation, intent, evidence, bug, specification, etc.)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 20)'
        },
        since: {
          type: 'string',
          description: 'Only return memories after this ISO timestamp'
        },
        search: {
          type: 'string',
          description: 'Search term to match in memory body'
        }
      }
    }
  },
  {
    name: 'get_commitment',
    description: 'Get full details of a specific commitment by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The commitment ID (cmt_xxx)'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'get_memory',
    description: 'Get full details of a specific memory by ID.',
    input_schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'The memory ID (mem_xxx)'
        }
      },
      required: ['id']
    }
  }
];

// Handler map
export const supabaseToolHandlers: Record<string, (input: any) => Promise<any>> = {
  query_operations: queryOperations,
  query_commitments: queryCommitments,
  query_memories: queryMemories,
  get_commitment: getCommitment,
  get_memory: getMemory
};
```

**Verification**:
```bash
cd agent-service && npx tsc --noEmit src/tools/supabase-tools.ts
```

---

### Stage 4: Context Loader

Create the workspace context loader for gathering configuration.

**File**: `agent-service/src/context/workspace.ts`

```typescript
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';

export interface WorkspaceConfig {
  id: string;
  name: string;
  path: string;
  manifest: any | null;
  genesis: any | null;
  claudeMd: string | null;
}

/**
 * Load workspace configuration from .mentu directory
 */
export async function loadWorkspaceConfig(workspacePath: string): Promise<WorkspaceConfig> {
  const mentuDir = path.join(workspacePath, '.mentu');
  const name = path.basename(workspacePath);

  const config: WorkspaceConfig = {
    id: name.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    name,
    path: workspacePath,
    manifest: null,
    genesis: null,
    claudeMd: null
  };

  // Try to load manifest.yaml
  try {
    const manifestPath = path.join(mentuDir, 'manifest.yaml');
    const manifestContent = await fs.readFile(manifestPath, 'utf-8');
    config.manifest = yaml.load(manifestContent);
  } catch {
    // No manifest is okay
  }

  // Try to load genesis.key
  try {
    const genesisPath = path.join(mentuDir, 'genesis.key');
    const genesisContent = await fs.readFile(genesisPath, 'utf-8');
    config.genesis = yaml.load(genesisContent);
  } catch {
    // No genesis is okay
  }

  // Try to load CLAUDE.md
  try {
    const claudePath = path.join(workspacePath, 'CLAUDE.md');
    config.claudeMd = await fs.readFile(claudePath, 'utf-8');
  } catch {
    // No CLAUDE.md is okay
  }

  return config;
}

/**
 * Get constraints from genesis file
 */
export function getGenesisConstraints(genesis: any | null): string[] {
  if (!genesis) return [];

  const constraints: string[] = [];

  if (genesis.permissions) {
    if (genesis.permissions.allow) {
      constraints.push(`Allowed: ${genesis.permissions.allow.join(', ')}`);
    }
    if (genesis.permissions.deny) {
      constraints.push(`Denied: ${genesis.permissions.deny.join(', ')}`);
    }
  }

  if (genesis.trust_gradient) {
    constraints.push(`Trust level: ${genesis.trust_gradient}`);
  }

  return constraints;
}

/**
 * Get key info from manifest
 */
export function getManifestInfo(manifest: any | null): Record<string, any> {
  if (!manifest) return {};

  return {
    name: manifest.name,
    description: manifest.description,
    version: manifest.version,
    actor: manifest.mentu?.actor,
    capabilities: manifest.capabilities?.map((c: any) => c.name) || []
  };
}
```

**File**: `agent-service/src/context/loader.ts`

```typescript
import { loadWorkspaceConfig, getGenesisConstraints, getManifestInfo, WorkspaceConfig } from './workspace';
import { queryCommitments, queryMemories } from '../tools/supabase-tools';

export interface GatheredContext {
  workspace: WorkspaceConfig;
  manifestInfo: Record<string, any>;
  constraints: string[];
  recentCommitments: any[];
  recentMemories: any[];
  summary: string;
}

/**
 * Gather all relevant context for a workspace
 */
export async function gatherContext(workspacePath: string): Promise<GatheredContext> {
  // Load workspace configuration
  const workspace = await loadWorkspaceConfig(workspacePath);
  const manifestInfo = getManifestInfo(workspace.manifest);
  const constraints = getGenesisConstraints(workspace.genesis);

  // Query recent activity
  const recentCommitments = await queryCommitments({
    workspace_id: workspace.id,
    limit: 10
  }).catch(() => []);

  const recentMemories = await queryMemories({
    workspace_id: workspace.id,
    limit: 10
  }).catch(() => []);

  // Build summary
  const summary = buildContextSummary(workspace, manifestInfo, constraints, recentCommitments, recentMemories);

  return {
    workspace,
    manifestInfo,
    constraints,
    recentCommitments,
    recentMemories,
    summary
  };
}

/**
 * Build a human-readable context summary
 */
function buildContextSummary(
  workspace: WorkspaceConfig,
  manifestInfo: Record<string, any>,
  constraints: string[],
  commitments: any[],
  memories: any[]
): string {
  const parts: string[] = [];

  // Workspace info
  parts.push(`## Workspace: ${workspace.name}`);

  if (manifestInfo.description) {
    parts.push(`Description: ${manifestInfo.description}`);
  }

  if (manifestInfo.version) {
    parts.push(`Version: ${manifestInfo.version}`);
  }

  // Constraints
  if (constraints.length > 0) {
    parts.push('\n## Constraints');
    constraints.forEach(c => parts.push(`- ${c}`));
  }

  // Recent activity
  if (commitments.length > 0) {
    parts.push('\n## Recent Commitments');
    commitments.slice(0, 5).forEach(c => {
      parts.push(`- [${c.state}] ${c.id}: ${c.body.slice(0, 80)}...`);
    });
  }

  if (memories.length > 0) {
    parts.push('\n## Recent Memories');
    memories.slice(0, 5).forEach(m => {
      parts.push(`- [${m.kind}] ${m.id}: ${m.body.slice(0, 80)}...`);
    });
  }

  // CLAUDE.md summary (first 500 chars)
  if (workspace.claudeMd) {
    parts.push('\n## CLAUDE.md Summary');
    parts.push(workspace.claudeMd.slice(0, 500) + (workspace.claudeMd.length > 500 ? '...' : ''));
  }

  return parts.join('\n');
}

// Tool definition for context gathering
export const contextToolDefinitions = [
  {
    name: 'gather_context',
    description: 'Gather comprehensive context about a workspace including configuration, constraints, and recent activity. Call this before engaging with a new topic.',
    input_schema: {
      type: 'object',
      properties: {
        workspace_path: {
          type: 'string',
          description: 'Path to the workspace to gather context from'
        }
      },
      required: ['workspace_path']
    }
  }
];

// Handler
export const contextToolHandlers: Record<string, (input: any) => Promise<any>> = {
  gather_context: async (input: { workspace_path: string }) => {
    const context = await gatherContext(input.workspace_path);
    return context.summary;
  }
};
```

**Verification**:
```bash
cd agent-service && npm install js-yaml @types/js-yaml
cd agent-service && npx tsc --noEmit src/context/loader.ts src/context/workspace.ts
```

---

### Stage 5: Registry Integration

Update the tool registry to include all new tools.

**File**: `agent-service/src/tools/registry.ts` (modify existing)

Add imports and merge tool definitions:

```typescript
import { toolDefinitions as mentuToolDefinitions, toolHandlers as mentuToolHandlers } from './mentu-tools';
import { filesystemToolDefinitions, filesystemToolHandlers } from './filesystem-tools';
import { supabaseToolDefinitions, supabaseToolHandlers } from './supabase-tools';
import { contextToolDefinitions, contextToolHandlers } from '../context/loader';

// Merge all tool definitions
export const toolDefinitions = [
  ...mentuToolDefinitions,
  ...filesystemToolDefinitions,
  ...supabaseToolDefinitions,
  ...contextToolDefinitions
];

// Merge all tool handlers
export const toolHandlers: Record<string, (input: any) => Promise<any>> = {
  ...mentuToolHandlers,
  ...filesystemToolHandlers,
  ...supabaseToolHandlers,
  ...contextToolHandlers
};

// Export for Claude client
export function getToolDefinitions() {
  return toolDefinitions;
}

export function executeToolByName(name: string, input: any): Promise<any> {
  const handler = toolHandlers[name];
  if (!handler) {
    throw new Error(`Unknown tool: ${name}`);
  }
  return handler(input);
}
```

**Verification**:
```bash
cd agent-service && npx tsc --noEmit src/tools/registry.ts
```

---

### Stage 6: Claude Client Update

Update the Claude client to use the new system prompt.

**File**: `agent-service/src/claude/client.ts` (modify existing)

Replace the hardcoded system prompt with the import:

```typescript
import { INTENT_ARCHITECT_PROMPT } from '../system/prompt';

// In createMessageStream, replace the system parameter:
// system: 'You are a helpful assistant...'
// With:
// system: INTENT_ARCHITECT_PROMPT
```

**Verification**:
```bash
cd agent-service && npx tsc --noEmit src/claude/client.ts
```

---

### Stage 7: Frontend Context Indicator

Add a visual indicator for context gathering.

**File**: `src/components/agent-chat/ContextIndicator.tsx`

```typescript
'use client';

import { cn } from '@/lib/utils';
import { Loader2, Database, FolderSearch, CheckCircle2 } from 'lucide-react';

interface ContextIndicatorProps {
  status: 'idle' | 'gathering' | 'complete';
  sources?: string[];
  className?: string;
}

export function ContextIndicator({ status, sources = [], className }: ContextIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className={cn(
      'flex items-center gap-2 px-3 py-2 text-xs rounded-lg',
      status === 'gathering' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400',
      className
    )}>
      {status === 'gathering' ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Gathering context...</span>
        </>
      ) : (
        <>
          <CheckCircle2 className="h-3 w-3" />
          <span>Context loaded</span>
        </>
      )}

      {sources.length > 0 && (
        <div className="flex items-center gap-1 ml-2">
          {sources.includes('files') && <FolderSearch className="h-3 w-3" />}
          {sources.includes('ledger') && <Database className="h-3 w-3" />}
        </div>
      )}
    </div>
  );
}

export default ContextIndicator;
```

**Verification**:
```bash
npm run type-check
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

# Create: docs/RESULT-AgentChatPanel-v2.0.md
```

The RESULT document MUST include:
- Valid YAML front matter with all required fields
- Summary of what was built
- Files created and modified
- Test results (tsc, tests, build)
- Design decisions with rationale

### Step 2: Capture RESULT as Evidence

```bash
# Actor auto-resolved from manifest, author-type declares role
mentu capture "Created RESULT-AgentChatPanel-v2.0: Intent Architect implementation with expanded tools and system prompt" \
  --kind result-document \
  --path docs/RESULT-AgentChatPanel-v2.0.md \
  --refs cmt_XXXXXXXX \
  --author-type executor
```

### Step 3: Update RESULT Front Matter

Update the YAML front matter with the evidence ID:

```yaml
mentu:
  commitment: cmt_XXXXXXXX
  evidence: mem_YYYYYYYY  # <- The ID from Step 2
  status: in_review
```

### Step 4: Submit with Evidence

```bash
# Actor auto-resolved from manifest (same as claim)
mentu submit cmt_XXXXXXXX \
  --summary "Implemented Intent Architect: system prompt, filesystem tools, supabase tools, context loader, frontend indicator" \
  --include-files
```

**The RESULT document IS the closure proof. Do not submit without it.**

---

## Verification Checklist

### Files
- [ ] `agent-service/src/system/prompt.ts` exists
- [ ] `agent-service/src/tools/filesystem-tools.ts` exists
- [ ] `agent-service/src/tools/supabase-tools.ts` exists
- [ ] `agent-service/src/context/loader.ts` exists
- [ ] `agent-service/src/context/workspace.ts` exists
- [ ] `agent-service/src/tools/registry.ts` updated
- [ ] `agent-service/src/claude/client.ts` updated
- [ ] `src/components/agent-chat/ContextIndicator.tsx` exists

### Checks
- [ ] `npm run build` passes (frontend)
- [ ] `cd agent-service && npm run build` passes
- [ ] `npm run type-check` passes

### Mentu
- [ ] Commitment created with `mentu commit`
- [ ] Commitment claimed with `mentu claim`
- [ ] Validators passed (technical, intent, safety)
- [ ] If validation failed: checked stance, fixed without arguing
- [ ] **RESULT document created** (`docs/RESULT-AgentChatPanel-v2.0.md`)
- [ ] **RESULT captured as evidence** with `mentu capture`
- [ ] **RESULT front matter updated** with evidence ID
- [ ] Commitment submitted with `mentu submit`
- [ ] `mentu list commitments --state open` returns []

### Functionality
- [ ] Agent identifies as "Intent Architect"
- [ ] Filesystem tools can read files within allowed paths
- [ ] Filesystem tools reject paths outside allowed workspaces
- [ ] Supabase tools can query commitments and memories
- [ ] Context loader produces summary from workspace config
- [ ] System prompt includes all Mentu knowledge
- [ ] Tools integrate with streaming handler

---

*Transform the Agent Chat into the Intent Architect—the essential tool for crystallizing human thought into accountable commitments.*
