import TransactionList from '@/components/blocks/home/TransactionList';
import { getHomeLiveTransactions } from '@/lib/data/homeLiveTx';

export default async function Home() {
  const { items } = await getHomeLiveTransactions();
  return (
    <>
      <TransactionList transactions={items} />
    </>
  );
}
