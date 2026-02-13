import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { GitHubSettingsPage } from '@/components/settings/github-settings-page';

interface GitHubSettingsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function GitHubSettings({ params }: GitHubSettingsPageProps) {
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
    <GitHubSettingsPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
      user={user}
    />
  );
}
