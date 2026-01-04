import { redirect } from 'next/navigation';

interface CommitmentsPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function CommitmentsPage({ params }: CommitmentsPageProps) {
  const { workspace } = await params;
  redirect(`/workspace/${workspace}/execution/commitments`);
}
