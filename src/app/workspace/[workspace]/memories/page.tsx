import { redirect } from 'next/navigation';

interface MemoriesPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function MemoriesPage({ params }: MemoriesPageProps) {
  const { workspace } = await params;
  redirect(`/workspace/${workspace}/execution/memories`);
}
