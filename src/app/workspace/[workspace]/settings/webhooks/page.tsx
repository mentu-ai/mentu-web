import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WebhookLogsPage } from '@/components/settings/webhook-logs-page';

interface WebhookLogsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function WebhookLogs({ params }: WebhookLogsPageProps) {
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

  return <WebhookLogsPage workspaceId={workspaceData.id} />;
}
