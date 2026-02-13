import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BridgePage } from '@/components/bridge/bridge-page';

interface BridgePageProps {
  params: Promise<{ workspace: string }>;
}

export default async function Bridge({ params }: BridgePageProps) {
  const { workspace } = await params;
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
    <BridgePage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
    />
  );
}
