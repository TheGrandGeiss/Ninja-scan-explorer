import TokenPageClient from '@/components/blocks/token/TokenPageClient';
import { fetchTokenPageData } from '@/lib/actions/tokenData';
import { notFound } from 'next/navigation';

export default async function TokenPage({
  params,
}: {
  params: Promise<{ address: string }>;
}) {
  const { address } = await params;

  // FAST DATA
  const baseData = await fetchTokenPageData(address);

  if (!baseData.success || !baseData.data) return notFound();

  return <TokenPageClient data={baseData.data} address={address} />;
}
