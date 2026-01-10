export type Plane = 'context' | 'capability' | 'execution';

export interface PlaneView {
  id: string;
  label: string;
  href: string;
  icon?: string;
}

export interface PlaneConfig {
  label: string;
  description: string;
  views: PlaneView[];
}

export const planeConfig: Record<Plane, PlaneConfig> = {
  context: {
    label: 'Context',
    description: 'Identity, knowledge, and who can do what',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'genesis', label: 'Genesis', href: '/genesis' },
      { id: 'knowledge', label: 'Knowledge', href: '/knowledge' },
      { id: 'skills', label: 'Skills', href: '/skills' },
    ]
  },
  capability: {
    label: 'Capability',
    description: 'Tools, agents, and automation',
    views: [
      { id: 'overview', label: 'Overview', href: '' },
      { id: 'integrations', label: 'Integrations', href: '/integrations' },
      { id: 'agents', label: 'Agents', href: '/agents' },
      { id: 'automation', label: 'Automation', href: '/automation' },
      { id: 'bridge', label: 'Bridge', href: '/bridge' },
    ]
  },
  execution: {
    label: 'Execution',
    description: 'Your commitment ledger',
    views: [
      { id: 'kanban', label: 'Kanban', href: '/kanban' },
      { id: 'timeline', label: 'Timeline', href: '/timeline' },
      { id: 'commitments', label: 'Commitments', href: '/commitments' },
      { id: 'memories', label: 'Memories', href: '/memories' },
      { id: 'ledger', label: 'Ledger', href: '/ledger' },
    ]
  }
  // NOTE: Bridge moved to Capability plane
};

export const planes: Plane[] = ['context', 'capability', 'execution'];

export function isValidPlane(value: string): value is Plane {
  return planes.includes(value as Plane);
}
