import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SequencesListPage } from '@/components/sequence/sequences-list-page';

interface PageProps {
  params: Promise<{ workspace: string }>;
}

export default async function Sequences({ params }: PageProps) {
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
    <SequencesListPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
    />
  );
}
