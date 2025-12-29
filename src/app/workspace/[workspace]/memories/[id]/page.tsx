import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MemoryDetailPage } from '@/components/memory/memory-detail-page';

interface MemoryPageProps {
  params: Promise<{ workspace: string; id: string }>;
}

export default async function MemoryPage({ params }: MemoryPageProps) {
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
    <MemoryDetailPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
      memoryId={id}
      user={user}
    />
  );
}
