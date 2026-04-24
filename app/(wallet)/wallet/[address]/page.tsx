import { getWalletProfiler } from '@/lib/actions/walletData';
import { notFound } from 'next/navigation';
import WalletPageClient from '@/components/blocks/wallet/WalletPageClient';

const WalletPage = async ({
  params,
}: {
  params: Promise<{ address: string }>;
}) => {
  const { address } = await params;

  try {
    const data = await getWalletProfiler(address);

    if (!data) return notFound();

    return <WalletPageClient data={data} />;
  } catch {
    return notFound();
  }
};

export default WalletPage;
