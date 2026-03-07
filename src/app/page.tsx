import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRight, Shield, Eye, GitCommit, Fingerprint, Lock, Zap } from 'lucide-react';

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#08080a] text-zinc-100 overflow-hidden selection:bg-amber-500/20 selection:text-amber-200">
      {/* Background grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }}
      />

      {/* Radial glow at top center */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-40"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(217,168,71,0.08) 0%, rgba(217,168,71,0.02) 40%, transparent 70%)',
        }}
      />

      {/* Animated commitment chain — vertical lines */}
      <div className="pointer-events-none absolute top-0 left-0 w-full h-full overflow-hidden">
        {[12, 28, 44, 60, 76, 92].map((left, i) => (
          <div
            key={i}
            className="absolute top-0 w-px h-full"
            style={{
              left: `${left}%`,
              background: `linear-gradient(180deg, transparent 0%, rgba(161,131,59,${0.04 + i * 0.005}) 30%, rgba(161,131,59,${0.02 + i * 0.003}) 70%, transparent 100%)`,
            }}
          />
        ))}
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-12 h-16">
        <div className="flex items-center gap-2.5">
          <div className="h-5 w-5 rounded-sm bg-amber-500/90" />
          <span className="text-sm font-medium tracking-wide text-zinc-300">MENTU</span>
        </div>
        <Link
          href="/login"
          className="text-sm text-zinc-500 hover:text-zinc-200 transition-colors duration-300"
        >
          Sign in
        </Link>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center pt-[12vh] md:pt-[16vh] pb-24 px-6">
        {/* Tagline pill */}
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-1.5 text-xs text-zinc-400 backdrop-blur-sm animate-[fadeIn_0.8s_ease-out]">
          <Lock className="h-3 w-3 text-amber-500/70" />
          <span>Append-only accountability for AI-native teams</span>
        </div>

        {/* Title */}
        <h1
          className="text-center font-bold tracking-tight leading-[0.95] animate-[fadeIn_0.8s_ease-out_0.1s_both]"
          style={{ fontSize: 'clamp(3rem, 8vw, 6.5rem)' }}
        >
          <span className="block text-zinc-50">The Commitment</span>
          <span className="block bg-gradient-to-r from-amber-300 via-amber-400 to-orange-400 bg-clip-text text-transparent">
            Ledger
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-6 max-w-md text-center text-base md:text-lg text-zinc-500 leading-relaxed animate-[fadeIn_0.8s_ease-out_0.25s_both]">
          Observations become commitments. Commitments require evidence.
          Evidence proves closure. Nothing is edited. Nothing is deleted.
        </p>

        {/* CTA */}
        <div className="mt-10 flex items-center gap-4 animate-[fadeIn_0.8s_ease-out_0.4s_both]">
          <Link href="/login">
            <button className="group relative inline-flex items-center gap-2.5 rounded-lg bg-amber-500 px-7 py-3 text-sm font-semibold text-[#08080a] shadow-[0_0_24px_rgba(217,168,71,0.2)] transition-all duration-300 hover:bg-amber-400 hover:shadow-[0_0_32px_rgba(217,168,71,0.3)] active:scale-[0.98]">
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </Link>
          <a
            href="https://github.com/mentu-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/50 px-6 py-3 text-sm text-zinc-400 transition-all duration-300 hover:border-zinc-700 hover:text-zinc-200 hover:bg-zinc-800/50"
          >
            View Source
          </a>
        </div>

        {/* Divider line */}
        <div className="mt-20 mb-16 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent animate-[fadeIn_0.8s_ease-out_0.5s_both]" />

        {/* Three principles */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 md:gap-0 max-w-3xl w-full animate-[fadeIn_0.8s_ease-out_0.55s_both]">
          {[
            {
              icon: Eye,
              label: 'OBSERVE',
              title: 'Capture everything',
              desc: 'Every observation is a memory. Memories become the source of truth for what was seen, when.',
              num: '01',
            },
            {
              icon: GitCommit,
              label: 'COMMIT',
              title: 'Bind to obligations',
              desc: 'Commitments trace to their origin memory. No commitment exists without a reason.',
              num: '02',
            },
            {
              icon: Fingerprint,
              label: 'PROVE',
              title: 'Close with evidence',
              desc: 'Closure requires proof. Not marking done — proving done. The ledger remembers.',
              num: '03',
            },
          ].map((item, i) => (
            <div
              key={item.num}
              className={`group relative px-6 py-8 md:py-6 ${
                i < 2 ? 'md:border-r border-b md:border-b-0 border-zinc-800/60' : ''
              }`}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-zinc-900 border border-zinc-800 group-hover:border-amber-500/30 transition-colors duration-500">
                  <item.icon className="h-3.5 w-3.5 text-amber-500/70" />
                </div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-600 uppercase">
                  {item.label}
                </span>
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-2">
                {item.title}
              </h3>
              <p className="text-xs leading-relaxed text-zinc-500">
                {item.desc}
              </p>
              {/* Step number watermark */}
              <span className="absolute top-4 right-5 text-[10px] font-mono text-zinc-800">
                {item.num}
              </span>
            </div>
          ))}
        </div>

        {/* Second divider */}
        <div className="mt-16 mb-16 w-full max-w-3xl h-px bg-gradient-to-r from-transparent via-zinc-800 to-transparent animate-[fadeIn_0.8s_ease-out_0.6s_both]" />

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl w-full animate-[fadeIn_0.8s_ease-out_0.65s_both]">
          {[
            { icon: Shield, text: 'Append-only immutable history' },
            { icon: Zap, text: 'Agent + Human interoperable' },
            { icon: Lock, text: 'Genesis Key governance' },
            { icon: GitCommit, text: 'Evidence-bound state transitions' },
          ].map((f) => (
            <div
              key={f.text}
              className="flex items-center gap-3 rounded-lg border border-zinc-800/50 bg-zinc-900/30 px-4 py-3 text-sm text-zinc-400 transition-colors duration-300 hover:border-zinc-700/50 hover:text-zinc-300"
            >
              <f.icon className="h-4 w-4 text-zinc-600 shrink-0" />
              {f.text}
            </div>
          ))}
        </div>

        {/* Terminal preview block */}
        <div className="mt-16 w-full max-w-2xl animate-[fadeIn_0.8s_ease-out_0.75s_both]">
          <div className="rounded-lg border border-zinc-800/60 bg-[#0c0c0e] overflow-hidden shadow-2xl shadow-black/40">
            {/* Terminal title bar */}
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-zinc-800/40 bg-[#0e0e11]">
              <div className="flex gap-1.5">
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <div className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
              </div>
              <span className="ml-2 text-[10px] font-mono text-zinc-600">mentu-cli</span>
            </div>
            {/* Terminal body */}
            <div className="px-5 py-4 font-mono text-xs leading-6 text-zinc-500 overflow-x-auto">
              <div><span className="text-zinc-600">$</span> <span className="text-zinc-300">mentu capture</span> <span className="text-amber-400/80">&quot;Auth module needs rate limiting&quot;</span></div>
              <div className="text-zinc-600">  mem_a7f2c1d3 captured</div>
              <div className="mt-2"><span className="text-zinc-600">$</span> <span className="text-zinc-300">mentu commit</span> <span className="text-amber-400/80">&quot;Add rate limiter to /auth&quot;</span> <span className="text-zinc-600">--source mem_a7f2c1d3</span></div>
              <div className="text-zinc-600">  cmt_e4b91a26 created</div>
              <div className="mt-2"><span className="text-zinc-600">$</span> <span className="text-zinc-300">mentu claim</span> <span className="text-zinc-400">cmt_e4b91a26</span></div>
              <div className="text-zinc-600">  claimed by agent:claude-code</div>
              <div className="mt-2"><span className="text-zinc-600">$</span> <span className="text-zinc-300">mentu close</span> <span className="text-zinc-400">cmt_e4b91a26</span> <span className="text-zinc-600">--evidence mem_f82d1e09</span></div>
              <div className="text-green-500/70">  closed with evidence</div>
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="mt-20 text-xs font-mono tracking-widest text-zinc-700 uppercase animate-[fadeIn_0.8s_ease-out_0.85s_both]">
          Proving done, not marking done.
        </p>
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

  // Multiple workspaces: redirect to panorama
  if (workspaces && workspaces.length > 1) {
    redirect('/panorama');
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
