import { notFound, redirect } from 'next/navigation';
import { isValidPlane, Plane } from '@/lib/navigation/planeConfig';
import { ContextOverview } from '@/components/planes/context/ContextOverview';
import { CapabilityOverview } from '@/components/planes/capability/CapabilityOverview';

interface PlanePageProps {
  params: Promise<{ workspace: string; plane: string }>;
}

const overviewComponents: Record<Plane, React.ComponentType | null> = {
  context: ContextOverview,
  capability: CapabilityOverview,
  execution: null, // Redirects to kanban
};

export default async function PlanePage({ params }: PlanePageProps) {
  const { workspace, plane } = await params;

  if (!isValidPlane(plane)) {
    notFound();
  }

  // Execution plane redirects to kanban (no overview page)
  if (plane === 'execution') {
    redirect(`/workspace/${workspace}/execution/kanban`);
  }

  const OverviewComponent = overviewComponents[plane];
  if (!OverviewComponent) {
    notFound();
  }

  return (
    <div className="p-8 max-w-5xl">
      <OverviewComponent />
    </div>
  );
}
