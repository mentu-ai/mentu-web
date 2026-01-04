'use client';

import { mockAgents } from '@/lib/data/mockData';

export function AgentsView() {
  const agents = mockAgents;
  const running = agents.filter((a) => a.active);
  const defined = agents.filter((a) => !a.active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Agents</h1>
          <p className="text-zinc-500">AI workers and their status</p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
          Define Agent
        </button>
      </div>

      {/* Running Agents */}
      {running.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Running ({running.length})
          </h2>
          <div className="space-y-3">
            {running.map((agent) => (
              <div
                key={agent.id}
                className="bg-white rounded-xl border border-green-200 p-5 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-lg">
                      🤖
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 font-mono text-sm">{agent.name}</div>
                    <div className="text-sm text-zinc-500">
                      Working on: <code className="text-xs bg-zinc-100 px-1 rounded">{agent.workingOn}</code>
                    </div>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Stop
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Defined Agents */}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
          Defined ({defined.length})
        </h2>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-xl border border-zinc-200 p-5"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-medium text-zinc-900">{agent.name}</span>
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded">
                  {agent.type}
                </span>
                <span className={`px-2 py-0.5 text-xs rounded ${
                  agent.trust === 'trusted'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {agent.trust}
                </span>
                {agent.active && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    active
                  </span>
                )}
              </div>
              <div className="text-sm text-zinc-500">{agent.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {agents.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-lg font-medium text-zinc-900 mb-1">No agents defined</h3>
          <p className="text-zinc-500 text-sm">Define your first agent to enable automation</p>
        </div>
      )}
    </div>
  );
}
