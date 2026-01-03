import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LedgerPageV2 } from '@/components/ledger/ledger-page-v2';

interface LedgerPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function LedgerV2({ params }: LedgerPageProps) {
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
    <LedgerPageV2
      workspaceName={workspace}
      workspaceId={workspaceData.id}
      user={user}
    />
  );
}
