'use client';

import { mockHooks, mockSchedules } from '@/lib/data/mockData';

const eventColors: Record<string, string> = {
  Stop: 'bg-red-100 text-red-700',
  PostToolUse: 'bg-blue-100 text-blue-700',
  PreToolUse: 'bg-purple-100 text-purple-700',
};

export function AutomationView() {
  const hooks = mockHooks;
  const schedules = mockSchedules;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Automation</h1>
        <p className="text-zinc-500">Hooks and scheduled tasks</p>
      </div>

      {/* Hooks */}
      <div>
        <h2 className="text-sm font-medium text-zinc-500 mb-3 uppercase tracking-wide">
          Hooks ({hooks.length})
        </h2>
        <div className="space-y-3">
          {hooks.map((hook) => (
            <div
              key={hook.id}
              className="bg-white rounded-xl border border-zinc-200 p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <span className={`px-2 py-1 text-xs font-medium rounded ${eventColors[hook.event] || 'bg-zinc-100 text-zinc-600'}`}>
                  {hook.event}
                </span>
                <div>
                  <div className="font-medium text-zinc-900">{hook.name}</div>
                  <div className="text-xs text-zinc-400 font-mono">{hook.file}</div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={hook.enabled}
                />
                <div className="w-9 h-5 bg-zinc-200 peer-checked:bg-zinc-900 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Schedules */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wide">
            Schedules ({schedules.length})
          </h2>
          <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors">
            + Add Schedule
          </button>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
          {schedules.map((schedule) => (
            <div key={schedule.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="font-medium text-zinc-900">{schedule.name}</div>
                <div className="text-xs text-zinc-500">{schedule.schedule}</div>
                <div className="text-xs text-zinc-400 font-mono mt-1">{schedule.command}</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={schedule.enabled}
                />
                <div className="w-9 h-5 bg-zinc-200 peer-checked:bg-zinc-900 rounded-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
          ))}
          {schedules.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">📅</div>
              <h3 className="text-lg font-medium text-zinc-900 mb-1">No schedules</h3>
              <p className="text-zinc-500 text-sm">Create your first scheduled task</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
