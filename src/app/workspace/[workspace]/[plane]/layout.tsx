import { redirect } from 'next/navigation';
import { isValidPlane } from '@/lib/navigation/planeConfig';
import { TopNav } from '@/components/nav/TopNav';
import { PlaneSidebar } from '@/components/layout/PlaneSidebar';
import { createClient } from '@/lib/supabase/server';
import { TerminalProvider } from '@/contexts/TerminalContext';
import { ResizableTerminalPanel } from '@/components/terminal/ResizableTerminalPanel';

interface PlaneLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspace: string; plane: string }>;
}

export default async function PlaneLayout({ children, params }: PlaneLayoutProps) {
  const { workspace, plane } = await params;

  // Validate plane
  if (!isValidPlane(plane)) {
    redirect(`/workspace/${workspace}/execution`);
  }

  // Get user for sidebar
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <TerminalProvider>
      <div className="h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <TopNav />
        <div className="flex flex-1 overflow-hidden">
          <PlaneSidebar user={user ? { email: user.email } : undefined} />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
        <ResizableTerminalPanel />
      </div>
    </TerminalProvider>
  );
}
