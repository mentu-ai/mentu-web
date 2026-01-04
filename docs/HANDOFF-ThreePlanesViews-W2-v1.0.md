---
# ============================================================
# CANONICAL YAML FRONT MATTER
# ============================================================
id: HANDOFF-ThreePlanesViews-W2-v1.0
path: docs/HANDOFF-ThreePlanesViews-W2-v1.0.md
type: handoff
intent: execute

# VERSIONING
version: "1.0"
created: 2026-01-04
last_updated: 2026-01-04

# TIER
tier: T3

# RELATIONSHIPS
parent: PRD-ThreePlanesViews-W2-v1.0
children:
  - PROMPT-ThreePlanesViews-W2-v1.0
dependencies:
  - PRD-ThreePlanesViews-W2-v1.0
  - HANDOFF-ThreePlanesNavigation-W1-v1.0

# MENTU INTEGRATION
mentu:
  commitment: pending
  status: pending
---

# HANDOFF: ThreePlanesViews-W2 v1.0

## Mission

Implement all view pages for the three-plane architecture as specified in `docs/mentu-dashboard-v6.jsx`. This includes 7 new view components (Genesis, Knowledge, Actors, Skills, Integrations, Agents, Automation) plus an enhanced ExecutionOverview with stats and activity feed.

## Completion Contract

**First action**: Update `.claude/completion.json`:

```json
{
  "version": "2.0",
  "name": "ThreePlanesViews-W2",
  "tier": "T3",
  "required_files": [
    "src/lib/data/mockData.ts",
    "src/components/planes/context/GenesisView.tsx",
    "src/components/planes/context/KnowledgeView.tsx",
    "src/components/planes/context/ActorsView.tsx",
    "src/components/planes/context/SkillsView.tsx",
    "src/components/planes/capability/IntegrationsView.tsx",
    "src/components/planes/capability/AgentsView.tsx",
    "src/components/planes/capability/AutomationView.tsx",
    "src/components/planes/execution/ExecutionOverview.tsx",
    "src/app/workspace/[workspace]/[plane]/genesis/page.tsx",
    "src/app/workspace/[workspace]/[plane]/knowledge/page.tsx",
    "src/app/workspace/[workspace]/[plane]/actors/page.tsx",
    "src/app/workspace/[workspace]/[plane]/skills/page.tsx",
    "src/app/workspace/[workspace]/[plane]/integrations/page.tsx",
    "src/app/workspace/[workspace]/[plane]/agents/page.tsx",
    "src/app/workspace/[workspace]/[plane]/automation/page.tsx"
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
  "max_iterations": 75
}
```

---

## Key Documents

Read these before implementation:

1. `docs/PRD-ThreePlanesViews-W2-v1.0.md` - Full specification with types
2. `docs/mentu-dashboard-v6.jsx` - **PRIMARY SOURCE** - Complete prototype with all views
3. `src/lib/navigation/planeConfig.ts` - Existing plane configuration
4. `src/components/planes/` - Existing overview components (reference for patterns)

---

## Deliverables

### Phase 1: Mock Data Layer

| File | Purpose |
|------|---------|
| `src/lib/data/mockData.ts` | All mock data for views |

Extract mock data from prototype, create typed exports:
- `mockGenesis`: Principles + trust gradient
- `mockKnowledge`: Document list
- `mockActors`: Human and agent list
- `mockSkills`: Skill definitions
- `mockIntegrations`: Plugin, Remote, MCP data
- `mockAgents`: Running and defined agents
- `mockAutomation`: Hooks and schedules
- `mockActivity`: Recent activity items
- `mockStats`: Execution stats

### Phase 2: Context Plane Views

| File | Purpose |
|------|---------|
| `src/components/planes/context/GenesisView.tsx` | Principles list + Trust Gradient bar |
| `src/components/planes/context/KnowledgeView.tsx` | Document card grid |
| `src/components/planes/context/ActorsView.tsx` | Human/Agent entity list |
| `src/components/planes/context/SkillsView.tsx` | Skill cards with associations |
| `src/app/workspace/[workspace]/[plane]/genesis/page.tsx` | Genesis route |
| `src/app/workspace/[workspace]/[plane]/knowledge/page.tsx` | Knowledge route |
| `src/app/workspace/[workspace]/[plane]/actors/page.tsx` | Actors route |
| `src/app/workspace/[workspace]/[plane]/skills/page.tsx` | Skills route |

### Phase 3: Capability Plane Views

| File | Purpose |
|------|---------|
| `src/components/planes/capability/IntegrationsView.tsx` | Plugin + Remote + MCP sections |
| `src/components/planes/capability/AgentsView.tsx` | Agent cards with state |
| `src/components/planes/capability/AutomationView.tsx` | Hooks + Schedules lists |
| `src/app/workspace/[workspace]/[plane]/integrations/page.tsx` | Integrations route |
| `src/app/workspace/[workspace]/[plane]/agents/page.tsx` | Agents route |
| `src/app/workspace/[workspace]/[plane]/automation/page.tsx` | Automation route |

### Phase 4: Enhanced Execution Overview

| File | Purpose |
|------|---------|
| `src/components/planes/execution/ExecutionOverview.tsx` | Stats grid + Recent Activity feed |

---

## Implementation Details

### Color Palette

Use `zinc-*` from existing dashboard (NOT `slate-*` from prototype):

```tsx
// Background
className="bg-zinc-900"           // Main background
className="bg-zinc-800"           // Card background
className="bg-zinc-700"           // Hover states

// Text
className="text-zinc-100"         // Primary text
className="text-zinc-400"         // Secondary text

// Borders
className="border-zinc-700"       // Default borders
className="border-zinc-600"       // Hover borders

// Accents (from prototype, adapt as needed)
className="text-blue-400"         // Context plane
className="text-purple-400"       // Capability plane
className="text-green-400"        // Execution plane
className="text-amber-400"        // Warnings
```

### Genesis View Structure

```tsx
// From prototype - adapt to zinc palette
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Principles Section */}
  <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
    <h3>Core Principles</h3>
    <ul>
      {principles.map(p => <li key={p.id}>{p.text}</li>)}
    </ul>
  </div>

  {/* Trust Gradient Section */}
  <div className="bg-zinc-800 rounded-lg p-6 border border-zinc-700">
    <h3>Trust Gradient</h3>
    <div className="w-full h-4 bg-zinc-700 rounded-full overflow-hidden">
      <div style={{width: `${level * 10}%`}} className="h-full bg-green-500" />
    </div>
    <p>Level: {level}/10</p>
    <p>Owner: {owner}</p>
  </div>
</div>
```

### Knowledge View Structure

```tsx
// Document cards with type badges
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {documents.map(doc => (
    <div key={doc.id} className="bg-zinc-800 rounded-lg p-4 border border-zinc-700">
      <Badge>{doc.type}</Badge>
      <h4>{doc.title}</h4>
      <p className="text-zinc-400 text-sm">{doc.path}</p>
      <p className="text-zinc-500 text-xs">Updated: {doc.lastUpdated}</p>
    </div>
  ))}
</div>
```

### Actors View Structure

```tsx
// Two sections: Humans and Agents
<div className="space-y-8">
  <section>
    <h3>Human Actors</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {actors.filter(a => a.type === 'human').map(actor => (
        <ActorCard key={actor.id} actor={actor} />
      ))}
    </div>
  </section>

  <section>
    <h3>Agent Actors</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {actors.filter(a => a.type === 'agent').map(actor => (
        <ActorCard key={actor.id} actor={actor} />
      ))}
    </div>
  </section>
</div>
```

### Integrations View Structure

```tsx
// Three sections: Plugin, Remote Access, MCPs
<div className="space-y-8">
  <IntegrationSection
    title="Plugin Integrations"
    items={integrations.filter(i => i.type === 'plugin')}
  />
  <IntegrationSection
    title="Remote Access"
    items={integrations.filter(i => i.type === 'remote')}
  />
  <IntegrationSection
    title="MCP Servers"
    items={integrations.filter(i => i.type === 'mcp')}
  />
</div>
```

### Agents View Structure

```tsx
// Two sections: Running and Defined
<div className="space-y-8">
  <section>
    <h3 className="flex items-center gap-2">
      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      Running Agents
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {agents.filter(a => a.state === 'running').map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  </section>

  <section>
    <h3>Defined Agents</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {agents.filter(a => a.state === 'defined').map(agent => (
        <AgentCard key={agent.id} agent={agent} />
      ))}
    </div>
  </section>
</div>
```

### Automation View Structure

```tsx
// Two sections: Hooks and Schedules
<div className="space-y-8">
  <section>
    <h3>Hooks</h3>
    <div className="space-y-2">
      {hooks.map(hook => (
        <div key={hook.id} className="bg-zinc-800 p-4 rounded-lg flex justify-between">
          <div>
            <h4>{hook.name}</h4>
            <p className="text-zinc-400 text-sm">{hook.trigger} → {hook.action}</p>
          </div>
          <Badge variant={hook.enabled ? 'success' : 'secondary'}>
            {hook.enabled ? 'Enabled' : 'Disabled'}
          </Badge>
        </div>
      ))}
    </div>
  </section>

  <section>
    <h3>Schedules</h3>
    <div className="space-y-2">
      {schedules.map(schedule => (
        <ScheduleRow key={schedule.id} schedule={schedule} />
      ))}
    </div>
  </section>
</div>
```

### Execution Overview Enhancement

```tsx
// Stats grid + Recent Activity
<div className="space-y-8">
  {/* Stats Grid */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    <StatCard label="Open Commitments" value={stats.openCommitments} />
    <StatCard label="Closed Today" value={stats.closedToday} />
    <StatCard label="Memories This Week" value={stats.memoriesThisWeek} />
    <StatCard label="Active Agents" value={stats.activeAgents} />
  </div>

  {/* Quick Links (existing) */}
  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
    {views.map(view => <PlaneCard key={view.id} {...view} />)}
  </div>

  {/* Recent Activity */}
  <section>
    <h3>Recent Activity</h3>
    <div className="space-y-2">
      {activity.map(item => (
        <ActivityRow key={item.id} item={item} />
      ))}
    </div>
  </section>
</div>
```

---

## Build Order

1. **Mock Data** (`src/lib/data/mockData.ts`)
   - Extract all mock data from prototype
   - Create typed interfaces
   - Export individual datasets

2. **Context Views** (in order)
   - GenesisView.tsx + route
   - KnowledgeView.tsx + route
   - ActorsView.tsx + route
   - SkillsView.tsx + route
   - Verify: Navigate via sidebar, data displays

3. **Capability Views** (in order)
   - IntegrationsView.tsx + route
   - AgentsView.tsx + route
   - AutomationView.tsx + route
   - Verify: Navigate via sidebar, data displays

4. **Execution Enhancement**
   - Update ExecutionOverview.tsx with stats + activity
   - Verify: Stats display, activity feed shows

5. **Final Verification**
   - `npm run build` passes
   - `npx tsc --noEmit` passes
   - All sidebar links work
   - No console errors

---

## Constraints

- **Read-only**: No mutations, just display
- **Mock data only**: No Supabase integration (W3 scope)
- **Zinc palette**: Convert prototype colors
- **Existing patterns**: Follow shadcn component usage
- **Mobile responsive**: All views must work on small screens

---

## Verification Checklist

```bash
# File existence
ls src/lib/data/mockData.ts
ls src/components/planes/context/GenesisView.tsx
ls src/components/planes/context/KnowledgeView.tsx
ls src/components/planes/context/ActorsView.tsx
ls src/components/planes/context/SkillsView.tsx
ls src/components/planes/capability/IntegrationsView.tsx
ls src/components/planes/capability/AgentsView.tsx
ls src/components/planes/capability/AutomationView.tsx

# TypeScript
npx tsc --noEmit

# Build
npm run build

# Manual verification
npm run dev
# Navigate to each view, verify data displays
```

---

## Success Criteria

- [ ] All 7 new view components created
- [ ] ExecutionOverview enhanced with stats + activity
- [ ] All route pages created
- [ ] Sidebar navigation works for all views
- [ ] `npm run build` passes
- [ ] No TypeScript errors
- [ ] No console errors in browser
- [ ] Views handle empty states gracefully
- [ ] Mobile responsive

---

*Execute this HANDOFF to populate the navigation shell with functional views.*
