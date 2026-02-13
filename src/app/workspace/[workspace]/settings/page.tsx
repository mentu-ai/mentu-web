import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { SettingsPage } from '@/components/settings/settings-page';

interface SettingsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function Settings({ params }: SettingsPageProps) {
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
    <SettingsPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
    />
  );
}
