import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CommitmentDetailPage } from '@/components/commitment/commitment-detail-page';

interface CommitmentPageProps {
  params: Promise<{ workspace: string; plane: string; id: string }>;
}

export default async function CommitmentPage({ params }: CommitmentPageProps) {
  const { workspace, plane, id } = await params;

  // Commitments are only in execution plane
  if (plane !== 'execution') {
    redirect(`/workspace/${workspace}/execution/commitments/${id}`);
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
    <CommitmentDetailPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
      commitmentId={id}
      user={user}
    />
  );
}
