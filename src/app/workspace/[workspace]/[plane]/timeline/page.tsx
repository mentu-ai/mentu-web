import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TimelinePage } from '@/components/timeline/timeline-page';

interface TimelineRouteProps {
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function TimelineRoute({ params }: TimelineRouteProps) {
  const { workspace, plane } = await params;

  // Only allow timeline under execution plane
  if (plane !== 'execution') {
    redirect(`/workspace/${workspace}/execution/timeline`);
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
    <TimelinePage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
    />
  );
}
