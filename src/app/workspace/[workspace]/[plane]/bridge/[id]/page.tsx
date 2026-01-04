import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BridgeCommandDetailPage } from '@/components/bridge/bridge-command-detail-page';

interface BridgeCommandPageProps {
  params: Promise<{ workspace: string; plane: string; id: string }>;
}

export default async function BridgeCommandPage({ params }: BridgeCommandPageProps) {
  const { workspace, plane, id } = await params;

  // Bridge is only in capability plane
  if (plane !== 'capability') {
    redirect(`/workspace/${workspace}/capability/bridge/${id}`);
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
      <BridgeCommandDetailPage
        workspaceName={workspace}
        workspaceId={workspaceData.id}
        commandId={id}
      />
    </div>
  );
}
