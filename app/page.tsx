import Navbar from '@/components/blocks/home/Navbar';
import RecentTx from '@/components/blocks/home/RecentTx';
import SearchBar from '@/components/blocks/home/Search';
import TransactionList from '@/components/blocks/home/TransactionList';
import { fetchLiveTxData } from '@/lib/actions/TransactionData';

export default async function Home() {
  const transactions = await fetchLiveTxData();
  return (
    <>
      <Navbar />
      <RecentTx />
      <SearchBar />
      <TransactionList transactions={transactions.items} />
    </>
  );
}
