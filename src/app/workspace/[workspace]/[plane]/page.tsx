import { notFound } from 'next/navigation';
import { isValidPlane, Plane } from '@/lib/navigation/planeConfig';
import { ContextOverview } from '@/components/planes/context/ContextOverview';
import { CapabilityOverview } from '@/components/planes/capability/CapabilityOverview';
import { ExecutionOverview } from '@/components/planes/execution/ExecutionOverview';

interface PlanePageProps {
  params: Promise<{ workspace: string; plane: string }>;
}

const overviewComponents: Record<Plane, React.ComponentType> = {
  context: ContextOverview,
  capability: CapabilityOverview,
  execution: ExecutionOverview,
};

export default async function PlanePage({ params }: PlanePageProps) {
  const { plane } = await params;

  if (!isValidPlane(plane)) {
    notFound();
  }

  const OverviewComponent = overviewComponents[plane];
  return (
    <div className="p-8 max-w-5xl">
      <OverviewComponent />
    </div>
  );
}
