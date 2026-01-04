import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ActorMappingsPage } from '@/components/settings/actor-mappings-page';

interface ActorMappingsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function ActorMappings({ params }: ActorMappingsPageProps) {
  const { workspace } = await params;
  const supabase = await createClient();

  const { data: workspaceData } = await supabase
    .from('workspaces')
    .select('id')
    .eq('name', workspace)
    .single() as { data: { id: string } | null };

  if (!workspaceData) {
    redirect('/');
  }

  return <ActorMappingsPage workspaceId={workspaceData.id} />;
}
