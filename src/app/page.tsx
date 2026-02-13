import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

function LandingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <div className="max-w-lg text-center space-y-8">
        <div className="space-y-3">
          <h1 className="text-5xl font-bold tracking-tight">Mentu</h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400">
            The Commitment Ledger
          </p>
        </div>

        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
          Track commitments with proof. From observations to evidence to closure.
          An append-only ledger for AI-native development.
        </p>

        <ul className="text-left space-y-3 text-sm mx-auto max-w-xs">
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Append-only ledger</span>
              {' '}&mdash; immutable commitment history
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Evidence-bound transitions</span>
              {' '}&mdash; every state change captured
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-zinc-400 dark:bg-zinc-500 shrink-0" />
            <span className="text-zinc-600 dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Agent + Human interoperable</span>
              {' '}&mdash; built for AI-native workflows
            </span>
          </li>
        </ul>

        <div>
          <Link href="/login">
            <Button size="lg">Get Started</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingPage />;
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
            You don&apos;t have any workspaces yet.
          </p>
          <CreateWorkspaceDialog>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </Button>
          </CreateWorkspaceDialog>
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

        <div className="text-center">
          <CreateWorkspaceDialog>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              New Workspace
            </Button>
          </CreateWorkspaceDialog>
        </div>
      </div>
    </div>
  );
}
