'use client';

import { mockGenesis } from '@/lib/data/mockData';

export function GenesisView() {
  const genesis = mockGenesis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Genesis</h1>
        <p className="text-zinc-500">Constitutional principles and trust gradient</p>
      </div>

      {/* Identity */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wide">Identity</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <div className="text-xs text-zinc-400">Workspace</div>
            <div className="text-zinc-900 font-medium">{genesis.workspace}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Owner</div>
            <div className="text-zinc-900 font-medium">{genesis.owner}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Version</div>
            <div className="text-zinc-900 font-medium">{genesis.version}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-400">Created</div>
            <div className="text-zinc-900 font-medium">{genesis.created}</div>
          </div>
        </div>
      </div>

      {/* Principles */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wide">Principles</h2>
        <div className="space-y-3">
          {genesis.principles.map((p) => (
            <div key={p.id} className="flex gap-4 items-start">
              <code className="text-xs text-violet-600 bg-violet-50 px-2 py-1 rounded shrink-0 font-mono">
                {p.id}
              </code>
              <span className="text-sm text-zinc-700">{p.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Gradient */}
      <div className="bg-white rounded-xl border border-zinc-200 p-6">
        <h2 className="text-sm font-medium text-zinc-500 mb-4 uppercase tracking-wide">Trust Gradient</h2>
        <div className="space-y-3">
          {genesis.trustGradient.map((t) => (
            <div
              key={t.role}
              className="flex items-center justify-between p-4 bg-zinc-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <span className="font-medium text-zinc-900 capitalize">{t.role}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    t.trust === 'trusted'
                      ? 'bg-green-100 text-green-700'
                      : t.trust === 'authorized'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-zinc-200 text-zinc-600'
                  }`}
                >
                  {t.trust}
                </span>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {t.permissions.map((p) => (
                  <span
                    key={p}
                    className="text-xs text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
