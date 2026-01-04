'use client';

import { useParams } from 'next/navigation';
import { PlaneCard } from '@/components/shared/PlaneCard';

export function ExecutionOverview() {
  const params = useParams();
  const workspace = params.workspace as string;
  const basePath = `/workspace/${workspace}/execution`;

  // TODO: Wire up real stats from useOperations() in W2
  const stats = [
    { label: 'Open', value: '0', color: 'text-zinc-900' },
    { label: 'In Progress', value: '0', color: 'text-emerald-600' },
    { label: 'Memories', value: '0', color: 'text-zinc-900' },
    { label: 'Operations', value: '0', color: 'text-zinc-900' },
  ];

  const cards = [
    { id: 'kanban', title: 'Kanban', description: 'Visual workflow board', href: `${basePath}/kanban` },
    { id: 'commitments', title: 'Commitments', description: 'All work items', href: `${basePath}/commitments` },
    { id: 'memories', title: 'Memories', description: 'Evidence and captures', href: `${basePath}/memories` },
    { id: 'ledger', title: 'Ledger', description: 'Full operation history', href: `${basePath}/ledger` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Execution</h1>
        <p className="text-zinc-500">Your commitment ledger</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-zinc-500">{stat.label}</div>
          </div>
        ))}
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
