import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SequenceDetailPage } from '@/components/sequence/sequence-detail-page';

interface PageProps {
  params: Promise<{ workspace: string; id: string }>;
}

export default async function SequenceDetail({ params }: PageProps) {
  const { workspace, id } = await params;
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
    <SequenceDetailPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
      instanceId={id}
    />
  );
}
