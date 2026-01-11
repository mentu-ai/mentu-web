import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { BugReportsSettingsPage } from '@/components/settings/bug-reports-settings-page';

interface BugReportsSettingsProps {
  params: Promise<{ workspace: string }>;
}

export default async function BugReportsSettings({ params }: BugReportsSettingsProps) {
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

  return (
    <BugReportsSettingsPage
      workspaceName={workspace}
      workspaceId={workspaceData.id}
    />
  );
}
