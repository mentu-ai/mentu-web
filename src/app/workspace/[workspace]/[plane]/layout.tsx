import { redirect } from 'next/navigation';
import { isValidPlane } from '@/lib/navigation/planeConfig';
import { TopNav } from '@/components/nav/TopNav';
import { PlaneSidebar } from '@/components/layout/PlaneSidebar';
import { createClient } from '@/lib/supabase/server';

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

  // Get user for TopNav
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50">
      <TopNav user={user ? { email: user.email } : undefined} />
      <div className="flex">
        <PlaneSidebar />
        <main className="flex-1 p-8 max-w-5xl">
          {children}
        </main>
      </div>
    </div>
  );
}
