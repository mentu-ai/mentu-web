import React, { useState } from 'react';

const MentuDashboard = () => {
  const [activePlane, setActivePlane] = useState('execution');
  const [activeView, setActiveView] = useState('plane');
  const [workspaceDropdown, setWorkspaceDropdown] = useState(false);
  const [projectModal, setProjectModal] = useState(false);

  const nav = {
    context: {
      label: 'Context',
      views: [
        { id: 'plane', label: 'Overview' },
        { id: 'genesis', label: 'Genesis' },
        { id: 'knowledge', label: 'Knowledge' },
        { id: 'actors', label: 'Actors' },
        { id: 'skills', label: 'Skills' },
      ]
    },
    capability: {
      label: 'Capability',
      views: [
        { id: 'plane', label: 'Overview' },
        { id: 'integrations', label: 'Integrations' },
        { id: 'agents', label: 'Agents' },
        { id: 'automation', label: 'Automation' },
      ]
    },
    execution: {
      label: 'Execution',
      views: [
        { id: 'plane', label: 'Overview' },
        { id: 'kanban', label: 'Kanban' },
        { id: 'commitments', label: 'Commitments' },
        { id: 'memories', label: 'Memories' },
        { id: 'ledger', label: 'Ledger' },
      ]
    }
  };

  const workspaces = [
    { id: 'mentu-ai', name: 'mentu-ai', type: 'local', path: '/Users/rashid/Desktop/Workspaces/mentu-ai', synced: true, current: true },
    { id: 'mentu-web', name: 'mentu-web', type: 'local', path: '/Users/rashid/Desktop/Workspaces/mentu-web', synced: true },
    { id: 'mentu-cli', name: 'mentu-cli', type: 'github', repo: 'rashidazarang/mentu-cli', synced: true },
  ];

  const currentWorkspace = workspaces.find(w => w.current);

  const genesis = {
    workspace: 'mentu-ai', owner: 'Rashid Azarang', version: '1.0', created: '2025-12-28',
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

  const knowledge = [
    { id: 'doc_1', name: 'CLAUDE.md', type: 'guide', updated: '2 days ago' },
    { id: 'doc_2', name: 'Mentu-Spec-v0.md', type: 'spec', updated: '1 week ago' },
  ];

  const actors = [
    { id: 'rashid', name: 'Rashid Azarang', type: 'human', role: 'owner', email: 'rashid@mentu.ai' },
    { id: 'claude-lead', name: 'agent:claude-lead', type: 'agent', role: 'auditor', trust: 'trusted' },
    { id: 'claude-triage', name: 'agent:claude-auto-triage', type: 'agent', role: 'executor', trust: 'authorized' },
  ];

  const skills = [
    { id: 'craft', name: 'mentu-craft', desc: 'Create PRD → HANDOFF → PROMPT → RESULT chains', knowledge: ['templates/'], actors: ['claude-lead'] },
    { id: 'triage', name: 'signal-triage', desc: 'Convert observations into commitments', knowledge: ['triage-rules.md'], actors: ['claude-triage'] },
  ];

  const integrations = {
    plugin: { active: true, version: '1.2.0', hooks: 3 },
    remoteAccess: { connected: true, machine: 'MacBook Pro', lastSeen: '2 min ago' },
    mcps: [
      { name: 'mentu-proxy', status: 'connected', tools: 12 },
      { name: 'GitHub', status: 'connected', tools: 8 },
      { name: 'Filesystem', status: 'connected', tools: 6 },
    ]
  };

  const agents = [
    { id: 'lead', name: 'agent:claude-lead', type: 'orchestrator', trust: 'trusted', active: false, desc: 'Audits intents, spawns sub-agents' },
    { id: 'triage', name: 'agent:claude-auto-triage', type: 'autonomous', trust: 'authorized', active: true, workingOn: 'cmt_4b9d8c93', desc: 'Auto-triages signals' },
  ];

  const hooks = [
    { id: 'guard', name: 'Completion Guard', file: 'keep_working.py', event: 'Stop', enabled: true },
    { id: 'enforcer', name: 'Protocol Enforcer', file: 'mentu_enforcer.py', event: 'Stop', enabled: true },
    { id: 'evidence', name: 'Evidence Capture', file: 'post_tool_evidence.py', event: 'PostToolUse', enabled: true },
  ];

  const schedules = [
    { id: 'sync', name: 'Daily Sync', schedule: '9:00 AM', command: 'mentu sync --all', enabled: true },
  ];

  const commitments = [
    { id: 'cmt_4b9d8c93', title: 'Deliver auto-trigger for signal triage', status: 'in_progress', owner: 'agent:claude-auto-triage', created: '2 days ago' },
    { id: 'cmt_h3s7pb63', title: 'Test spawn command', status: 'open', created: '1 day ago' },
    { id: 'cmt_zrxylay7', title: 'Run CI for push to main', status: 'open', created: '2 days ago' },
  ];

  const memories = [
    { id: 'mem_d2848c6a', body: 'Signal triage webhook received from GitHub', kind: 'observation', created: '2 days ago' },
    { id: 'mem_a8c73d12', body: 'Edited: mentu-nav.jsx', kind: 'evidence', created: '3 hours ago' },
  ];

  const ledger = [
    { op: 'capture', actor: 'agent:claude-auto-triage', target: 'mem_a8c73d12', time: '3 hours ago' },
    { op: 'claim', actor: 'agent:claude-auto-triage', target: 'cmt_4b9d8c93', time: '2 days ago' },
    { op: 'commit', actor: 'rashid', target: 'cmt_4b9d8c93', time: '2 days ago' },
    { op: 'capture', actor: 'rashid', target: 'mem_d2848c6a', time: '2 days ago' },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 h-14">
          <div className="flex items-center gap-3">
            <button onClick={() => { setActivePlane('execution'); setActiveView('plane'); }} className="flex items-center gap-2 hover:opacity-80">
              <div className="w-7 h-7 bg-slate-900 rounded-md" />
              <span className="font-semibold text-slate-900">mentu</span>
            </button>
            <span className="text-slate-300">·</span>
            
            {/* Workspace Selector */}
            <div className="relative">
              <button onClick={() => setWorkspaceDropdown(!workspaceDropdown)} className="flex items-center gap-1.5 px-2 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md">
                {currentWorkspace?.name}
                <svg className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </button>
              {workspaceDropdown && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50">
                  <div className="p-2">
                    <div className="text-xs text-slate-400 uppercase tracking-wider px-3 py-2">Workspaces</div>
                    {workspaces.map(ws => (
                      <button key={ws.id} onClick={() => setWorkspaceDropdown(false)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-slate-50 ${ws.current ? 'bg-slate-50' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ws.type === 'github' ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
                          {ws.type === 'github' ? <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> : <span className="text-slate-500 text-sm">📁</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-slate-900">{ws.name}</div>
                          <div className="text-xs text-slate-400 truncate">{ws.type === 'github' ? ws.repo : ws.path}</div>
                        </div>
                        {ws.current && <span className="w-2 h-2 bg-green-500 rounded-full" />}
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-slate-100 p-2">
                    <button onClick={() => { setWorkspaceDropdown(false); setProjectModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                      Project Settings
                    </button>
                    <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-slate-50 rounded-lg">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                      Add Project
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            {Object.entries(nav).map(([key, section]) => (
              <button key={key} onClick={() => { setActivePlane(key); setActiveView('plane'); }} className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activePlane === key ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}>
                {section.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-sm text-slate-600">rashidazarang</span>
          </div>
        </div>
      </nav>

      {workspaceDropdown && <div className="fixed inset-0 z-30" onClick={() => setWorkspaceDropdown(false)} />}

      <div className="flex">
        <aside className="w-48 bg-white border-r border-slate-200 min-h-[calc(100vh-3.5rem)] p-3">
          <nav className="space-y-0.5">
            {nav[activePlane].views.map((view) => (
              <button key={view.id} onClick={() => setActiveView(view.id)} className={`w-full px-3 py-2 text-sm text-left rounded-lg transition-colors ${activeView === view.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                {view.label}
              </button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-8 max-w-5xl">
          {/* CONTEXT */}
          {activePlane === 'context' && activeView === 'plane' && (
            <div>
              <div className="mb-8"><h1 className="text-2xl font-semibold text-slate-900">Context</h1><p className="text-slate-500">Identity, knowledge, and who can do what</p></div>
              <div className="grid grid-cols-2 gap-6">
                {[{id:'genesis',title:'Genesis',desc:'Constitutional principles and trust gradient',stat:`${genesis.principles.length} principles`},{id:'knowledge',title:'Knowledge',desc:'Documents, specs, and guides',stat:`${knowledge.length} documents`},{id:'actors',title:'Actors',desc:'Humans and agents with permissions',stat:`${actors.length} actors`},{id:'skills',title:'Skills',desc:'Reusable knowledge + actor directives',stat:`${skills.length} skills`}].map(c=>(
                  <button key={c.id} onClick={() => setActiveView(c.id)} className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-slate-300">
                    <div className="text-lg font-semibold text-slate-900 mb-2">{c.title}</div>
                    <p className="text-sm text-slate-500 mb-4">{c.desc}</p>
                    <div className="text-xs text-slate-400">{c.stat}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {activePlane === 'context' && activeView === 'genesis' && <div><h1 className="text-2xl font-semibold text-slate-900 mb-6">Genesis</h1><div className="bg-white rounded-xl border border-slate-200 p-6 mb-6"><h2 className="text-sm font-medium text-slate-500 mb-4">IDENTITY</h2><div className="grid grid-cols-2 gap-6"><div><div className="text-xs text-slate-400">Workspace</div><div className="text-slate-900 font-medium">{genesis.workspace}</div></div><div><div className="text-xs text-slate-400">Owner</div><div className="text-slate-900 font-medium">{genesis.owner}</div></div></div></div><div className="bg-white rounded-xl border border-slate-200 p-6 mb-6"><h2 className="text-sm font-medium text-slate-500 mb-4">PRINCIPLES</h2><div className="space-y-3">{genesis.principles.map(p => <div key={p.id} className="flex gap-4"><code className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded shrink-0">{p.id}</code><span className="text-sm text-slate-700">{p.desc}</span></div>)}</div></div><div className="bg-white rounded-xl border border-slate-200 p-6"><h2 className="text-sm font-medium text-slate-500 mb-4">TRUST GRADIENT</h2><div className="space-y-3">{genesis.trustGradient.map(t => <div key={t.role} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"><div className="flex items-center gap-3"><span className="font-medium text-slate-900 capitalize">{t.role}</span><span className={`text-xs px-2 py-0.5 rounded ${t.trust === 'trusted' ? 'bg-green-100 text-green-700' : t.trust === 'authorized' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'}`}>{t.trust}</span></div><div className="flex gap-1">{t.permissions.map(p => <span key={p} className="text-xs text-slate-500 bg-white px-2 py-0.5 rounded">{p}</span>)}</div></div>)}</div></div></div>}
          {activePlane === 'context' && activeView === 'knowledge' && <div><div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-semibold text-slate-900">Knowledge</h1><button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">Add Document</button></div><div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{knowledge.map(doc => <div key={doc.id} className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">📄</div><div><div className="font-medium text-slate-900">{doc.name}</div><div className="text-xs text-slate-500">{doc.type} · {doc.updated}</div></div></div><button className="text-sm text-slate-500">View</button></div>)}</div></div>}
          {activePlane === 'context' && activeView === 'actors' && <div><div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-semibold text-slate-900">Actors</h1><button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">Add Actor</button></div><div className="space-y-3">{actors.map(a => <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${a.type === 'human' ? 'bg-blue-100' : 'bg-slate-100'}`}>{a.type === 'human' ? '👤' : '🤖'}</div><div><div className="font-medium text-slate-900">{a.name}</div><div className="text-xs text-slate-500">{a.type === 'human' ? a.email : `Role: ${a.role}`}</div></div></div><span className={`text-xs px-2 py-1 rounded ${a.role === 'owner' ? 'bg-purple-100 text-purple-700' : a.trust === 'trusted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{a.role === 'owner' ? 'owner' : a.trust}</span></div>)}</div></div>}
          {activePlane === 'context' && activeView === 'skills' && <div><div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-semibold text-slate-900">Skills</h1><button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">Create Skill</button></div><div className="space-y-3">{skills.map(s => <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5"><div className="font-semibold text-slate-900">{s.name}</div><div className="text-sm text-slate-500 mb-3">{s.desc}</div><div className="flex gap-6 text-xs"><div><span className="text-slate-400">Knowledge:</span> <span className="text-slate-600">{s.knowledge.join(', ')}</span></div><div><span className="text-slate-400">Actors:</span> <span className="text-slate-600">{s.actors.length}</span></div></div></div>)}</div></div>}

          {/* CAPABILITY */}
          {activePlane === 'capability' && activeView === 'plane' && (
            <div>
              <div className="mb-8"><h1 className="text-2xl font-semibold text-slate-900">Capability</h1><p className="text-slate-500">Tools, agents, and automation</p></div>
              <div className="grid grid-cols-3 gap-6">
                {[{id:'integrations',title:'Integrations',desc:'Plugin, remote access, MCPs',stat:`${integrations.mcps.length} MCPs`},{id:'agents',title:'Agents',desc:'AI workers',stat:`${agents.filter(a=>a.active).length} active`},{id:'automation',title:'Automation',desc:'Hooks and schedules',stat:`${hooks.length} hooks`}].map(c=>(
                  <button key={c.id} onClick={() => setActiveView(c.id)} className="bg-white rounded-xl border border-slate-200 p-6 text-left hover:border-slate-300">
                    <div className="text-lg font-semibold text-slate-900 mb-2">{c.title}</div>
                    <p className="text-sm text-slate-500 mb-4">{c.desc}</p>
                    <div className="text-xs text-slate-400">{c.stat}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {activePlane === 'capability' && activeView === 'integrations' && <div><h1 className="text-2xl font-semibold text-slate-900 mb-6">Integrations</h1><div className="space-y-3 mb-6"><h2 className="text-sm font-medium text-slate-500">CORE</h2><div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between"><div className="flex gap-4"><div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold">M</div><div><div className="flex items-center gap-2"><span className="font-semibold text-slate-900">Mentu Plugin</span><span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Active</span></div><div className="text-sm text-slate-500">Track commitments in Claude Code</div><div className="text-xs text-slate-400 mt-1">v{integrations.plugin.version} · {integrations.plugin.hooks} hooks</div></div></div><button className="text-sm text-slate-500">Configure</button></div><div className="bg-white rounded-xl border border-slate-200 p-5 flex items-center justify-between"><div className="flex gap-4"><div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white">📡</div><div><div className="flex items-center gap-2"><span className="font-semibold text-slate-900">Remote Access</span><span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Connected</span></div><div className="text-sm text-slate-500">Access workspace from anywhere</div><div className="text-xs text-slate-400 mt-1">{integrations.remoteAccess.machine} · {integrations.remoteAccess.lastSeen}</div></div></div><button className="text-sm text-slate-500">Settings</button></div></div><div><h2 className="text-sm font-medium text-slate-500 mb-3">MCP SERVERS</h2><div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{integrations.mcps.map(m => <div key={m.name} className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><span className="w-2 h-2 bg-green-500 rounded-full" /><span className="font-medium text-slate-900">{m.name}</span></div><span className="text-xs text-slate-500">{m.tools} tools</span></div>)}<button className="w-full p-4 text-sm text-blue-600 hover:bg-slate-50">+ Add MCP</button></div></div></div>}
          {activePlane === 'capability' && activeView === 'agents' && <div><div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-semibold text-slate-900">Agents</h1><button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">Define Agent</button></div>{agents.filter(a => a.active).length > 0 && <div className="mb-6"><h2 className="text-sm font-medium text-slate-500 mb-3">RUNNING</h2>{agents.filter(a => a.active).map(a => <div key={a.id} className="bg-white rounded-xl border border-green-200 p-5 flex items-center justify-between"><div className="flex items-center gap-4"><div className="relative"><div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">🤖</div><span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" /></div><div><div className="font-medium text-slate-900">{a.name}</div><div className="text-sm text-slate-500">Working on: {a.workingOn}</div></div></div><button className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Stop</button></div>)}</div>}<div><h2 className="text-sm font-medium text-slate-500 mb-3">DEFINED</h2><div className="space-y-3">{agents.map(a => <div key={a.id} className="bg-white rounded-xl border border-slate-200 p-5"><div className="flex items-center gap-2 mb-2"><span className="font-mono text-sm font-medium text-slate-900">{a.name}</span><span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">{a.type}</span><span className={`px-2 py-0.5 text-xs rounded ${a.trust === 'trusted' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{a.trust}</span></div><div className="text-sm text-slate-500">{a.desc}</div></div>)}</div></div></div>}
          {activePlane === 'capability' && activeView === 'automation' && <div><h1 className="text-2xl font-semibold text-slate-900 mb-6">Automation</h1><div className="mb-6"><h2 className="text-sm font-medium text-slate-500 mb-3">HOOKS</h2><div className="space-y-3">{hooks.map(h => <div key={h.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between"><div className="flex items-center gap-4"><span className={`px-2 py-1 text-xs font-medium rounded ${h.event === 'Stop' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{h.event}</span><div><div className="font-medium text-slate-900">{h.name}</div><div className="text-xs text-slate-400 font-mono">{h.file}</div></div></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" defaultChecked={h.enabled} /><div className="w-9 h-5 bg-slate-200 peer-checked:bg-slate-900 rounded-full" /></label></div>)}</div></div><div><div className="flex items-center justify-between mb-3"><h2 className="text-sm font-medium text-slate-500">SCHEDULES</h2><button className="text-sm text-blue-600">+ Add</button></div><div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{schedules.map(s => <div key={s.id} className="p-4 flex items-center justify-between"><div><div className="font-medium text-slate-900">{s.name}</div><div className="text-xs text-slate-500">{s.schedule}</div></div><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" defaultChecked={s.enabled} /><div className="w-9 h-5 bg-slate-200 peer-checked:bg-slate-900 rounded-full" /></label></div>)}</div></div></div>}

          {/* EXECUTION */}
          {activePlane === 'execution' && activeView === 'plane' && (
            <div>
              <div className="mb-8"><h1 className="text-2xl font-semibold text-slate-900">Execution</h1><p className="text-slate-500">Your commitment ledger</p></div>
              <div className="grid grid-cols-4 gap-4 mb-8">
                <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-semibold text-slate-900">{commitments.filter(c => c.status === 'open').length}</div><div className="text-sm text-slate-500">Open</div></div>
                <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-semibold text-emerald-600">{commitments.filter(c => c.status === 'in_progress').length}</div><div className="text-sm text-slate-500">In Progress</div></div>
                <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-semibold text-slate-900">{memories.length}</div><div className="text-sm text-slate-500">Memories</div></div>
                <div className="bg-white rounded-xl border border-slate-200 p-4"><div className="text-2xl font-semibold text-slate-900">{ledger.length}</div><div className="text-sm text-slate-500">Operations</div></div>
              </div>
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2><button onClick={() => setActiveView('ledger')} className="text-sm text-blue-600 hover:underline">View All →</button></div>
                <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {ledger.slice(0, 5).map((op, i) => (
                    <div key={i} className="px-4 py-3 flex items-center gap-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${op.op === 'capture' ? 'bg-blue-100 text-blue-700' : op.op === 'commit' ? 'bg-green-100 text-green-700' : op.op === 'claim' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{op.op}</span>
                      <div className="flex-1"><span className="text-sm text-slate-900">{op.target}</span><span className="text-sm text-slate-400 ml-2">by {op.actor}</span></div>
                      <span className="text-xs text-slate-400">{op.time}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[{id:'kanban',title:'Kanban',desc:'Visual workflow board'},{id:'commitments',title:'Commitments',desc:'All work items'},{id:'memories',title:'Memories',desc:'Evidence and captures'},{id:'ledger',title:'Ledger',desc:'Full operation history'}].map(c=>(
                  <button key={c.id} onClick={() => setActiveView(c.id)} className="bg-white rounded-xl border border-slate-200 p-5 text-left hover:border-slate-300">
                    <div className="font-semibold text-slate-900 mb-1">{c.title}</div>
                    <p className="text-sm text-slate-500">{c.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
          {activePlane === 'execution' && activeView === 'kanban' && <div><h1 className="text-2xl font-semibold text-slate-900 mb-6">Kanban</h1><div className="grid grid-cols-3 gap-4">{['open', 'in_progress', 'in_review'].map(status => <div key={status} className="bg-white rounded-xl border border-slate-200 p-4 min-h-[400px]"><div className="text-sm font-medium text-slate-500 mb-4 uppercase tracking-wide">{status === 'open' ? 'To Do' : status === 'in_progress' ? 'In Progress' : 'In Review'}<span className="ml-2 text-slate-400">{commitments.filter(c => c.status === status).length}</span></div><div className="space-y-2">{commitments.filter(c => c.status === status).map(cmt => <div key={cmt.id} className="p-3 bg-slate-50 rounded-lg"><div className="text-sm text-slate-900 mb-2">{cmt.title}</div>{cmt.owner && <div className="text-xs text-slate-500">{cmt.owner}</div>}</div>)}</div></div>)}</div></div>}
          {activePlane === 'execution' && activeView === 'commitments' && <div><div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-semibold text-slate-900">Commitments</h1><button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">New Commitment</button></div><div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{commitments.map(cmt => <div key={cmt.id} className="p-4 flex items-center justify-between hover:bg-slate-50"><div className="flex items-center gap-4"><span className={`w-2 h-2 rounded-full ${cmt.status === 'in_progress' ? 'bg-emerald-500' : 'bg-slate-300'}`} /><div><div className="font-medium text-slate-900">{cmt.title}</div><div className="text-xs text-slate-500">{cmt.id} · {cmt.created}</div></div></div><div className="text-xs text-slate-500">{cmt.owner || '—'}</div></div>)}</div></div>}
          {activePlane === 'execution' && activeView === 'memories' && <div><div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-semibold text-slate-900">Memories</h1><button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">Capture</button></div><div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{memories.map(mem => <div key={mem.id} className="p-4"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-mono text-slate-400">{mem.id}</span><span className={`text-xs px-2 py-0.5 rounded ${mem.kind === 'observation' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{mem.kind}</span></div><div className="text-sm text-slate-900">{mem.body}</div><div className="text-xs text-slate-400 mt-1">{mem.created}</div></div>)}</div></div>}
          {activePlane === 'execution' && activeView === 'ledger' && <div><h1 className="text-2xl font-semibold text-slate-900 mb-6">Ledger</h1><div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">{ledger.map((op, i) => <div key={i} className="p-4 flex items-center gap-4"><span className={`px-2 py-1 text-xs font-medium rounded ${op.op === 'capture' ? 'bg-blue-100 text-blue-700' : op.op === 'commit' ? 'bg-green-100 text-green-700' : op.op === 'claim' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{op.op}</span><div className="flex-1"><span className="text-sm text-slate-900">{op.target}</span><span className="text-sm text-slate-400 ml-2">by {op.actor}</span></div><span className="text-xs text-slate-400">{op.time}</span></div>)}</div></div>}
        </main>
      </div>

      {/* PROJECT SETTINGS MODAL */}
      {projectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Project Settings</h2>
              <button onClick={() => setProjectModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">CURRENT PROJECT</h3>
                <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">📁</div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">{currentWorkspace?.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{currentWorkspace?.path}</div>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-green-600"><span className="w-1.5 h-1.5 bg-green-500 rounded-full" />Synced</span>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">SYNC</h3>
                <div className="space-y-3">
                  {[{title:'Auto-sync',desc:'Sync changes automatically'},{title:'Cloud backup',desc:'Sync to Mentu Cloud'}].map(s=>(
                    <div key={s.title} className="flex items-center justify-between">
                      <div><div className="text-sm font-medium text-slate-900">{s.title}</div><div className="text-xs text-slate-500">{s.desc}</div></div>
                      <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" defaultChecked /><div className="w-9 h-5 bg-slate-200 peer-checked:bg-slate-900 rounded-full" /></label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-600 mb-3">DANGER ZONE</h3>
                <div className="p-4 border border-red-200 rounded-xl flex items-center justify-between">
                  <div><div className="text-sm font-medium text-slate-900">Disconnect project</div><div className="text-xs text-slate-500">Remove from Mentu (keeps local files)</div></div>
                  <button className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Disconnect</button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <button onClick={() => setProjectModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={() => setProjectModal(false)} className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MentuDashboard;