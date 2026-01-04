import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspace } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verify workspace exists and user has access
  const { data: workspaceData } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('name', workspace)
    .single() as { data: { id: string; name: string } | null };

  if (!workspaceData) {
    redirect('/');
  }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceData.id)
    .eq('user_id', user.id)
    .single() as { data: { workspace_id: string; user_id: string } | null };

  if (!membership) {
    redirect('/');
  }

  // Minimal wrapper - navigation is handled by child layouts (plane layout, settings layout)
  return <>{children}</>;
}
