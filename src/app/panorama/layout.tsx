import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { PanoramaSidebar } from '@/components/panorama/panorama-sidebar';

interface PanoramaLayoutProps {
  children: React.ReactNode;
}

export default async function PanoramaLayout({ children }: PanoramaLayoutProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's workspaces for the sidebar
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id) as { data: { workspace_id: string }[] | null };

  const workspaceIds = memberships?.map(m => m.workspace_id) || [];

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('id, name, display_name')
    .in('id', workspaceIds.length > 0 ? workspaceIds : ['__none__']) as {
      data: { id: string; name: string; display_name: string | null }[] | null;
    };

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="hidden md:flex">
        <PanoramaSidebar
          workspaces={workspaces || []}
          userEmail={user.email || ''}
        />
      </div>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
