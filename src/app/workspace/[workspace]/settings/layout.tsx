import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/nav/TopNav';
import { SettingsSidebar } from '@/components/layout/SettingsSidebar';
import { TerminalProvider } from '@/contexts/TerminalContext';
import { TerminalPanel } from '@/components/ide/TerminalPanel';
import {
  IDELayout,
  IDEBody,
  IDEPanel,
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
      <IDELayout>
        <TopNav />
        <IDEBody>
          {/* Left Panel - Settings Navigation */}
          <IDEPanel position="left" width={224}>
            <SettingsSidebar
              workspaceName={workspace}
              user={user ? { email: user.email } : undefined}
            />
          </IDEPanel>

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
    </TerminalProvider>
  );
}
