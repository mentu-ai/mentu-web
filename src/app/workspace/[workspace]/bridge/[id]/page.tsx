import { redirect } from 'next/navigation';

interface BridgeCommandPageProps {
  params: Promise<{ workspace: string; id: string }>;
}

export default async function BridgeCommandPage({ params }: BridgeCommandPageProps) {
  const { workspace, id } = await params;
  redirect(`/workspace/${workspace}/capability/bridge/${id}`);
}
