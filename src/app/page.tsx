import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get user's workspaces
  const { data: memberships } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id) as { data: { workspace_id: string }[] | null };

  if (!memberships?.length) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Welcome to Mentu</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            You don&apos;t have access to any workspaces yet.
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Contact a workspace owner to get invited, or create a workspace using the CLI.
          </p>
        </div>
      </div>
    );
  }

  const workspaceIds = memberships.map(m => m.workspace_id);

  const { data: workspaces } = await supabase
    .from('workspaces')
    .select('*')
    .in('id', workspaceIds) as { data: { id: string; name: string; display_name: string | null }[] | null };

  // If only one workspace, redirect to it
  if (workspaces?.length === 1) {
    redirect(`/workspace/${workspaces[0].name}`);
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Mentu</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Select a workspace
          </p>
        </div>

        <div className="grid gap-4">
          {workspaces?.map((workspace) => (
            <Link
              key={workspace.id}
              href={`/workspace/${workspace.name}`}
              className="block"
            >
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
                <h2 className="font-semibold">{workspace.display_name || workspace.name}</h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-mono">
                  {workspace.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
