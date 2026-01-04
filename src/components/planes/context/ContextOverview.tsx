'use client';

import { useParams } from 'next/navigation';
import { PlaneCard } from '@/components/shared/PlaneCard';

export function ContextOverview() {
  const params = useParams();
  const workspace = params.workspace as string;
  const basePath = `/workspace/${workspace}/context`;

  const cards = [
    { id: 'genesis', title: 'Genesis', description: 'Constitutional principles and trust gradient', stat: 'Identity', href: `${basePath}/genesis` },
    { id: 'knowledge', title: 'Knowledge', description: 'Documents, specs, and guides', stat: 'Reference', href: `${basePath}/knowledge` },
    { id: 'actors', title: 'Actors', description: 'Humans and agents with permissions', stat: 'Permissions', href: `${basePath}/actors` },
    { id: 'skills', title: 'Skills', description: 'Reusable knowledge + actor directives', stat: 'Capabilities', href: `${basePath}/skills` },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Context</h1>
        <p className="text-zinc-500">Identity, knowledge, and who can do what</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {cards.map(card => (
          <PlaneCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  );
}
