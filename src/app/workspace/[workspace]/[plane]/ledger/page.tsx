import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { LedgerPage } from '@/components/ledger/ledger-page';

interface LedgerRouteProps {
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function LedgerRoute({ params }: LedgerRouteProps) {
  const { workspace, plane } = await params;

  // Only allow ledger under execution plane
  if (plane !== 'execution') {
    redirect(`/workspace/${workspace}/execution/ledger`);
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
    <div className="p-4 md:p-6">
      <LedgerPage
        workspaceName={workspace}
        workspaceId={workspaceData.id}
      />
    </div>
  );
}
