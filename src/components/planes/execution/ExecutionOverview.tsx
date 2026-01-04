'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PlaneCard } from '@/components/shared/PlaneCard';
import { mockStats, mockActivity } from '@/lib/data/mockData';

const opColors: Record<string, string> = {
  capture: 'bg-blue-100 text-blue-700',
  commit: 'bg-green-100 text-green-700',
  claim: 'bg-amber-100 text-amber-700',
  close: 'bg-purple-100 text-purple-700',
  submit: 'bg-indigo-100 text-indigo-700',
  annotate: 'bg-zinc-100 text-zinc-600',
};

export function ExecutionOverview() {
  const params = useParams();
  const workspace = params.workspace as string;
  const basePath = `/workspace/${workspace}/execution`;

  const stats = [
    { label: 'Open', value: mockStats.open.toString(), color: 'text-zinc-900' },
    { label: 'In Progress', value: mockStats.inProgress.toString(), color: 'text-emerald-600' },
    { label: 'Memories', value: mockStats.memories.toString(), color: 'text-zinc-900' },
    { label: 'Operations', value: mockStats.operations.toString(), color: 'text-zinc-900' },
  ];

  const cards = [
    { id: 'kanban', title: 'Kanban', description: 'Visual workflow board', href: `${basePath}/kanban` },
    { id: 'commitments', title: 'Commitments', description: 'All work items', href: `${basePath}/commitments` },
    { id: 'memories', title: 'Memories', description: 'Evidence and captures', href: `${basePath}/memories` },
    { id: 'ledger', title: 'Ledger', description: 'Full operation history', href: `${basePath}/ledger` },
  ];

  const activity = mockActivity.slice(0, 5);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Execution</h1>
        <p className="text-zinc-500">Your commitment ledger</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-zinc-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-900">Recent Activity</h2>
          <Link
            href={`${basePath}/ledger`}
            className="text-sm text-blue-600 hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100">
          {activity.map((op, i) => (
            <div key={i} className="px-4 py-3 flex items-center gap-4">
              <span className={`px-2 py-1 text-xs font-medium rounded ${opColors[op.op] || 'bg-zinc-100 text-zinc-600'}`}>
                {op.op}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-sm text-zinc-900 font-mono">{op.target}</span>
                <span className="text-sm text-zinc-400 ml-2">by {op.actor}</span>
              </div>
              <span className="text-xs text-zinc-400 shrink-0">{op.time}</span>
            </div>
          ))}
          {activity.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">📋</div>
              <h3 className="text-lg font-medium text-zinc-900 mb-1">No activity yet</h3>
              <p className="text-zinc-500 text-sm">Operations will appear here as they happen</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 gap-4">
        {cards.map(card => (
          <PlaneCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
