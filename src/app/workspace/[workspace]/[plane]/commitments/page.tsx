import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CommitmentsListPage } from '@/components/commitment/commitments-list-page';

interface CommitmentsRouteProps {
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function CommitmentsRoute({ params }: CommitmentsRouteProps) {
  const { workspace, plane } = await params;

  // Only allow commitments under execution plane
  if (plane !== 'execution') {
    redirect(`/workspace/${workspace}/execution/commitments`);
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
      <CommitmentsListPage
        workspaceName={workspace}
        workspaceId={workspaceData.id}
        user={user}
      />
    </div>
  );
}
