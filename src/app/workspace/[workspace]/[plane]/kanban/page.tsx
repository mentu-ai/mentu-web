import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { KanbanPage } from '@/components/kanban/KanbanPage';

interface KanbanRouteProps {
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function KanbanRoute({ params }: KanbanRouteProps) {
  const { workspace, plane } = await params;

  // Only allow kanban under execution plane
  if (plane !== 'execution') {
    redirect(`/workspace/${workspace}/execution/kanban`);
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
    <KanbanPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
      user={user}
    />
  );
}
