import { createClient } from '@/lib/supabase/server';
import { TopNav } from '@/components/nav/TopNav';
import { SettingsSidebar } from '@/components/layout/SettingsSidebar';

interface SettingsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ workspace: string }>;
}

export default async function SettingsLayout({ children, params }: SettingsLayoutProps) {
  const { workspace } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="h-screen flex flex-col bg-zinc-50">
      <TopNav user={user ? { email: user.email } : undefined} />
      <div className="flex flex-1 overflow-hidden">
        <SettingsSidebar workspaceName={workspace} />
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-3xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
