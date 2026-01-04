import { redirect } from 'next/navigation';

interface BridgePageProps {
  params: Promise<{ workspace: string }>;
}

export default async function Bridge({ params }: BridgePageProps) {
  const { workspace } = await params;
  redirect(`/workspace/${workspace}/capability/bridge`);
}
