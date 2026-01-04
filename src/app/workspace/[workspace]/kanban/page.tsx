import { redirect } from 'next/navigation';

interface KanbanRouteProps {
  params: Promise<{ workspace: string }>;
}

export default async function KanbanRoute({ params }: KanbanRouteProps) {
  const { workspace } = await params;
  redirect(`/workspace/${workspace}/execution/kanban`);
}
