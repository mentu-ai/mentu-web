import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MemoriesListPage } from '@/components/memory/memories-list-page';

interface MemoriesRouteProps {
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function MemoriesRoute({ params }: MemoriesRouteProps) {
  const { workspace, plane } = await params;

  // Only allow memories under execution plane
  if (plane !== 'execution') {
    redirect(`/workspace/${workspace}/execution/memories`);
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
    <MemoriesListPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
      user={user}
    />
  );
}
