'use client';

import { useParams } from 'next/navigation';
import { PlaneCard } from '@/components/shared/PlaneCard';

export function CapabilityOverview() {
  const params = useParams();
  const workspace = params.workspace as string;
  const basePath = `/workspace/${workspace}/capability`;

  const cards = [
    { id: 'integrations', title: 'Integrations', description: 'Plugin, remote access, MCPs', stat: 'Connections', href: `${basePath}/integrations` },
    { id: 'agents', title: 'Agents', description: 'AI workers and automation', stat: 'Workers', href: `${basePath}/agents` },
    { id: 'automation', title: 'Automation', description: 'Hooks and schedules', stat: 'Triggers', href: `${basePath}/automation` },
    { id: 'bridge', title: 'Bridge', description: 'Remote execution and commands', stat: 'Commands', href: `${basePath}/bridge` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Capability</h1>
        <p className="text-zinc-500">Tools, agents, and automation</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {cards.map(card => (
          <PlaneCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
