// Mock data for all plane views
// This mirrors the structure from the prototype (mentu-dashboard-v6.jsx)

// ============================================================
// CONTEXT PLANE DATA
// ============================================================

export interface Principle {
  id: string;
  desc: string;
}

export interface TrustLevel {
  role: string;
  trust: 'untrusted' | 'trusted' | 'authorized';
  permissions: string[];
}

export interface Genesis {
  workspace: string;
  owner: string;
  version: string;
  created: string;
  principles: Principle[];
  trustGradient: TrustLevel[];
}

export const mockGenesis: Genesis = {
  workspace: 'mentu-ai',
  owner: 'Rashid Azarang',
  version: '1.0',
  created: '2025-12-28',
  principles: [
    { id: 'evidence-required', desc: 'Commitments close with proof, not assertion' },
    { id: 'lineage-preserved', desc: 'Every commitment traces to its origin' },
    { id: 'append-only', desc: 'Nothing edited, nothing deleted' },
  ],
  trustGradient: [
    { role: 'architect', trust: 'untrusted', permissions: ['capture', 'annotate'] },
    { role: 'auditor', trust: 'trusted', permissions: ['capture', 'commit', 'claim', 'release', 'close'] },
    { role: 'executor', trust: 'authorized', permissions: ['capture', 'commit', 'claim', 'release', 'close', 'submit'] },
  ]
};

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'guide' | 'spec' | 'template' | 'reference';
  updated: string;
}

export const mockKnowledge: KnowledgeDocument[] = [
  { id: 'doc_1', name: 'CLAUDE.md', type: 'guide', updated: '2 days ago' },
  { id: 'doc_2', name: 'Mentu-Spec-v0.md', type: 'spec', updated: '1 week ago' },
  { id: 'doc_3', name: 'TEMPLATE-PRD.md', type: 'template', updated: '3 days ago' },
  { id: 'doc_4', name: 'Genesis-Key-Schema.md', type: 'reference', updated: '1 week ago' },
];

export interface Actor {
  id: string;
  name: string;
  type: 'human' | 'agent';
  role: string;
  email?: string;
  trust?: 'trusted' | 'authorized' | 'untrusted';
}

export const mockActors: Actor[] = [
  { id: 'rashid', name: 'Rashid Azarang', type: 'human', role: 'owner', email: 'rashid@mentu.ai' },
  { id: 'claude-lead', name: 'agent:claude-lead', type: 'agent', role: 'auditor', trust: 'trusted' },
  { id: 'claude-triage', name: 'agent:claude-auto-triage', type: 'agent', role: 'executor', trust: 'authorized' },
  { id: 'claude-hub', name: 'agent:claude-hub', type: 'agent', role: 'executor', trust: 'authorized' },
];

export interface Skill {
  id: string;
  name: string;
  desc: string;
  knowledge: string[];
  actors: string[];
}

export const mockSkills: Skill[] = [
  { id: 'craft', name: 'mentu-craft', desc: 'Create PRD → HANDOFF → PROMPT → RESULT chains', knowledge: ['templates/'], actors: ['claude-lead'] },
  { id: 'triage', name: 'signal-triage', desc: 'Convert observations into commitments', knowledge: ['triage-rules.md'], actors: ['claude-triage'] },
  { id: 'publish', name: 'repo-publish', desc: 'Publish repositories to GitHub', knowledge: ['publish-guide.md'], actors: ['claude-hub'] },
];

// ============================================================
// CAPABILITY PLANE DATA
// ============================================================

export interface PluginIntegration {
  active: boolean;
  version: string;
  hooks: number;
}

export interface RemoteAccess {
  connected: boolean;
  machine: string;
  lastSeen: string;
}

export interface MCPServer {
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: number;
}

export interface Integrations {
  plugin: PluginIntegration;
  remoteAccess: RemoteAccess;
  mcps: MCPServer[];
}

export const mockIntegrations: Integrations = {
  plugin: { active: true, version: '1.2.0', hooks: 3 },
  remoteAccess: { connected: true, machine: 'MacBook Pro', lastSeen: '2 min ago' },
  mcps: [
    { name: 'mentu-proxy', status: 'connected', tools: 12 },
    { name: 'GitHub', status: 'connected', tools: 8 },
    { name: 'Filesystem', status: 'connected', tools: 6 },
    { name: 'Supabase', status: 'connected', tools: 15 },
  ]
};

export interface Agent {
  id: string;
  name: string;
  type: 'orchestrator' | 'autonomous' | 'validator';
  trust: 'trusted' | 'authorized';
  active: boolean;
  workingOn?: string;
  desc: string;
}

export const mockAgents: Agent[] = [
  { id: 'lead', name: 'agent:claude-lead', type: 'orchestrator', trust: 'trusted', active: false, desc: 'Audits intents, spawns sub-agents' },
  { id: 'triage', name: 'agent:claude-auto-triage', type: 'autonomous', trust: 'authorized', active: true, workingOn: 'cmt_4b9d8c93', desc: 'Auto-triages signals' },
  { id: 'hub', name: 'agent:claude-hub', type: 'autonomous', trust: 'authorized', active: true, workingOn: 'cmt_w2views', desc: 'Hub orchestrator for multi-repo' },
  { id: 'validator', name: 'agent:technical-validator', type: 'validator', trust: 'trusted', active: false, desc: 'Validates TypeScript, tests, build' },
];

export interface Hook {
  id: string;
  name: string;
  file: string;
  event: 'Stop' | 'PostToolUse' | 'PreToolUse';
  enabled: boolean;
}

export const mockHooks: Hook[] = [
  { id: 'guard', name: 'Completion Guard', file: 'keep_working.py', event: 'Stop', enabled: true },
  { id: 'enforcer', name: 'Protocol Enforcer', file: 'mentu_enforcer.py', event: 'Stop', enabled: true },
  { id: 'evidence', name: 'Evidence Capture', file: 'post_tool_evidence.py', event: 'PostToolUse', enabled: true },
];

export interface Schedule {
  id: string;
  name: string;
  schedule: string;
  command: string;
  enabled: boolean;
}

export const mockSchedules: Schedule[] = [
  { id: 'sync', name: 'Daily Sync', schedule: '9:00 AM', command: 'mentu sync --all', enabled: true },
  { id: 'backup', name: 'Weekly Backup', schedule: 'Sundays 2:00 AM', command: 'mentu backup', enabled: true },
];

// ============================================================
// EXECUTION PLANE DATA
// ============================================================

export interface ExecutionStats {
  open: number;
  inProgress: number;
  memories: number;
  operations: number;
}

export const mockStats: ExecutionStats = {
  open: 2,
  inProgress: 1,
  memories: 24,
  operations: 156,
};

export interface ActivityItem {
  op: 'capture' | 'commit' | 'claim' | 'close' | 'submit' | 'annotate';
  actor: string;
  target: string;
  time: string;
}

export const mockActivity: ActivityItem[] = [
  { op: 'capture', actor: 'agent:claude-hub', target: 'mem_w2start', time: '5 min ago' },
  { op: 'claim', actor: 'agent:claude-hub', target: 'cmt_w2views', time: '10 min ago' },
  { op: 'capture', actor: 'agent:claude-auto-triage', target: 'mem_a8c73d12', time: '3 hours ago' },
  { op: 'claim', actor: 'agent:claude-auto-triage', target: 'cmt_4b9d8c93', time: '2 days ago' },
  { op: 'commit', actor: 'rashid', target: 'cmt_4b9d8c93', time: '2 days ago' },
  { op: 'capture', actor: 'rashid', target: 'mem_d2848c6a', time: '2 days ago' },
];
