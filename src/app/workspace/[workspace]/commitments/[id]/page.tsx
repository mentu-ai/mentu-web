import { redirect } from 'next/navigation';

interface CommitmentPageProps {
  params: Promise<{ workspace: string; id: string }>;
}

export default async function CommitmentPage({ params }: CommitmentPageProps) {
  const { workspace, id } = await params;
  redirect(`/workspace/${workspace}/execution/commitments/${id}`);
}
