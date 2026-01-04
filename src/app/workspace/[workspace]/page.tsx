import { redirect } from 'next/navigation';

interface WorkspacePageProps {
  params: Promise<{ workspace: string }>;
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace } = await params;
  redirect(`/workspace/${workspace}/execution`);
}
