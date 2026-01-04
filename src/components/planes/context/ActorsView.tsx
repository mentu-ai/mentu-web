'use client';

import { mockActors } from '@/lib/data/mockData';

export function ActorsView() {
  const actors = mockActors;
  const humans = actors.filter((a) => a.type === 'human');
  const agents = actors.filter((a) => a.type === 'agent');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Actors</h1>
          <p className="text-zinc-500">Humans and agents with permissions</p>
        </div>
        <button className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-lg hover:bg-zinc-800 transition-colors">
          Add Actor
        </button>
      </div>

      {/* Humans */}
      {humans.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
            Humans ({humans.length})
          </h2>
          <div className="space-y-3">
            {humans.map((actor) => (
              <div
                key={actor.id}
                className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                    👤
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900">{actor.name}</div>
                    <div className="text-xs text-zinc-500">{actor.email}</div>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-purple-100 text-purple-700">
                  {actor.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Agents */}
      {agents.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
            Agents ({agents.length})
          </h2>
          <div className="space-y-3">
            {agents.map((actor) => (
              <div
                key={actor.id}
                className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center text-lg">
                    🤖
                  </div>
                  <div>
                    <div className="font-medium text-zinc-900 font-mono text-sm">{actor.name}</div>
                    <div className="text-xs text-zinc-500">Role: {actor.role}</div>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    actor.trust === 'trusted'
                      ? 'bg-green-100 text-green-700'
                      : actor.trust === 'authorized'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-zinc-100 text-zinc-600'
                  }`}
                >
                  {actor.trust}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {actors.length === 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-8 text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-medium text-zinc-900 mb-1">No actors defined</h3>
          <p className="text-zinc-500 text-sm">Add humans and agents to your workspace</p>
        </div>
      )}
    </div>
  );
}
