import { redirect } from 'next/navigation';

interface LedgerPageProps {
  params: Promise<{ workspace: string }>;
}

export default async function Ledger({ params }: LedgerPageProps) {
  const { workspace } = await params;
  redirect(`/workspace/${workspace}/execution/ledger`);
}
