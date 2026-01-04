import { redirect } from 'next/navigation';

interface MemoryPageProps {
  params: Promise<{ workspace: string; id: string }>;
}

export default async function MemoryPage({ params }: MemoryPageProps) {
  const { workspace, id } = await params;
  redirect(`/workspace/${workspace}/execution/memories/${id}`);
}
