import TransactionList from '@/components/blocks/home/TransactionList';
import { fetchLiveTxData } from '@/lib/actions/TransactionData';

export default async function Home() {
  const transactions = await fetchLiveTxData();
  return (
    <>
      <TransactionList transactions={transactions.items} />
    </>
  );
}
