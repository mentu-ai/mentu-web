'use client';

import { mockIntegrations } from '@/lib/data/mockData';

export function IntegrationsView() {
  const integrations = mockIntegrations;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Integrations</h1>
        <p className="text-zinc-500">Plugin, remote access, and MCPs</p>
      </div>

      {/* Core Integrations */}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">Core</h2>
        <div className="space-y-3">
          {/* Mentu Plugin */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                M
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">Mentu Plugin</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    integrations.plugin.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {integrations.plugin.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="text-sm text-zinc-500">Track commitments in Claude Code</div>
                <div className="text-xs text-zinc-400 mt-1">
                  v{integrations.plugin.version} · {integrations.plugin.hooks} hooks
                </div>
              </div>
            </div>
            <button className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Configure
            </button>
          </div>

          {/* Remote Access */}
          <div className="bg-white rounded-xl border border-zinc-200 p-5 flex items-center justify-between">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white text-xl">
                📡
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">Remote Access</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    integrations.remoteAccess.connected
                      ? 'bg-green-100 text-green-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}>
                    {integrations.remoteAccess.connected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <div className="text-sm text-zinc-500">Access workspace from anywhere</div>
                <div className="text-xs text-zinc-400 mt-1">
                  {integrations.remoteAccess.machine} · {integrations.remoteAccess.lastSeen}
                </div>
              </div>
            </div>
            <button className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* MCP Servers */}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">MCP Servers</h2>
        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
          {integrations.mcps.map((mcp) => (
            <div key={mcp.name} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${
                  mcp.status === 'connected'
                    ? 'bg-green-500'
                    : mcp.status === 'error'
                    ? 'bg-red-500'
                    : 'bg-zinc-300'
                }`} />
                <span className="font-medium text-zinc-900">{mcp.name}</span>
              </div>
              <span className="text-xs text-zinc-500">{mcp.tools} tools</span>
            </div>
          ))}
          <button className="w-full p-4 text-sm text-blue-600 hover:bg-zinc-50 transition-colors text-left">
            + Add MCP Server
          </button>
        </div>
      </div>
    </div>
  );
}
