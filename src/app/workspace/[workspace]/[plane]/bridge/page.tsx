import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BridgePage } from '@/components/bridge/bridge-page';

interface BridgePageRouteProps {
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function BridgePageRoute({ params }: BridgePageRouteProps) {
  const { workspace, plane } = await params;

  // Bridge is only in capability plane
  if (plane !== 'capability') {
    redirect(`/workspace/${workspace}/capability/bridge`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: workspaceData } = await supabase
    .from('workspaces')
    .select('*')
    .eq('name', workspace)
    .single() as { data: { id: string; name: string } | null };

  if (!workspaceData) {
    redirect('/');
  }

  return (
    <div className="p-4 md:p-6">
      <BridgePage
        workspaceName={workspace}
        workspaceId={workspaceData.id}
      />
    </div>
  );
}
