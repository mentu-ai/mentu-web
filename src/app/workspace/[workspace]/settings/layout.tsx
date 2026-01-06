import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/nav/TopNav';
import { SettingsSidebar } from '@/components/layout/SettingsSidebar';
import { TerminalProvider } from '@/contexts/TerminalContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { TerminalPanel } from '@/components/ide/TerminalPanel';
import { ResizableSidebar } from '@/components/ide/ResizableSidebar';
import {
  IDELayout,
  IDEBody,
  IDEMain,
  IDEEditor,
} from '@/components/ide/IDELayout';

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}

export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
  const { workspace } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <TerminalProvider>
      <SidebarProvider>
        <IDELayout>
          <TopNav />
          <IDEBody>
            {/* Left Panel - Settings Navigation */}
            <ResizableSidebar>
              <SettingsSidebar
                workspaceName={workspace}
                user={user ? { email: user.email } : undefined}
              />
            </ResizableSidebar>

            {/* Main Area - Settings Content + Terminal */}
            <IDEMain>
              <IDEEditor className="p-8 bg-zinc-50 dark:bg-zinc-950">
                <div className="max-w-3xl">
                  {children}
                </div>
              </IDEEditor>
              <TerminalPanel />
            </IDEMain>
          </IDEBody>
        </IDELayout>
      </SidebarProvider>
    </TerminalProvider>
  );
}
