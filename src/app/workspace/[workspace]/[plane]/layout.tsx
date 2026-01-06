import { redirect } from 'next/navigation';
import { isValidPlane } from '@/lib/navigation/planeConfig';
import { TopNav } from '@/components/nav/TopNav';
import { PlaneSidebar } from '@/components/layout/PlaneSidebar';
import { createClient } from '@/lib/supabase/server';
import { TerminalProvider } from '@/contexts/TerminalContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { RightPanelProvider } from '@/contexts/RightPanelContext';
import { TerminalPanel } from '@/components/ide/TerminalPanel';
import { ResizableSidebar } from '@/components/ide/ResizableSidebar';
import {
  IDELayout,
  IDEBody,
  IDEMain,
  IDEEditor,
} from '@/components/ide/IDELayout';

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
      <SidebarProvider>
        <RightPanelProvider>
          <IDELayout>
            <TopNav />
            <IDEBody>
              {/* Left Panel - Resizable Navigation */}
              <ResizableSidebar>
                <PlaneSidebar user={user ? { email: user.email } : undefined} />
              </ResizableSidebar>

              {/* Main Area - Editor + Terminal */}
              <IDEMain>
                <IDEEditor className="p-4 md:p-6 bg-zinc-50 dark:bg-zinc-950">
                  {children}
                </IDEEditor>
                <TerminalPanel />
              </IDEMain>
            </IDEBody>
          </IDELayout>
        </RightPanelProvider>
      </SidebarProvider>
    </TerminalProvider>
  );
}
