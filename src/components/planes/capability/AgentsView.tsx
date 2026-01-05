'use client';

import { mockAgents, mockActors } from '@/lib/data/mockData';
import { User, Bot } from 'lucide-react';

export function AgentsView() {
  const agents = mockAgents;
  const humans = mockActors.filter((a) => a.type === 'human');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Agents</h1>
          <p className="text-zinc-500">AI workers and team members</p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
          Define Agent
        </button>
      </div>

      {/* People Section */}
      {humans.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
            People ({humans.length})
          </h2>
          <div className="space-y-3">
            {humans.map((human) => (
              <div
                key={human.id}
                className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-zinc-500" />
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">{human.name}</div>
                    {human.email && (
                      <div className="text-sm text-zinc-500">{human.email}</div>
                    )}
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {human.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents Section */}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
          Agents ({agents.length})
        </h2>
        <div className="space-y-3">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`bg-white rounded-xl border p-4 ${
                agent.active
                  ? 'border-green-200'
                  : 'border-zinc-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      agent.active ? 'bg-green-100' : 'bg-zinc-100'
                    }`}>
                      <Bot className={`w-5 h-5 ${agent.active ? 'text-green-600' : 'text-zinc-500'}`} />
                    </div>
                    {agent.active && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-sm font-medium text-zinc-900">
                        {agent.name}
                      </span>
                      {agent.active && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                          Running
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
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
                    </div>
                    {agent.active && agent.workingOn ? (
                      <div className="text-sm text-zinc-500">
                        Working on: <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded font-mono">{agent.workingOn}</code>
                      </div>
                    ) : (
                      <div className="text-sm text-zinc-500">{agent.desc}</div>
                    )}
                  </div>
                </div>
                {agent.active && (
                  <button className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors shrink-0">
                    Stop
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {agents.length === 0 && humans.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="text-lg font-medium text-zinc-900 mb-1">No agents defined</h3>
          <p className="text-zinc-500 text-sm">Define your first agent to enable automation</p>
        </div>
      )}
    </div>
  );
}
