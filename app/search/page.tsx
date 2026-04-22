import MevList from '@/components/blocks/home/search/MEVtracker';
import NinjaLaunchList from '@/components/blocks/home/search/NinjaLaunchList';
import SmartMoneyList from '@/components/blocks/home/search/smartMoneyList';
import TokenList from '@/components/blocks/home/search/tokenList';
import WhaleTxList from '@/components/blocks/home/search/whaleList';
import TokensSkeleton from '@/components/blocks/loaders/tokenListSkeleton';
import {
  fetchMevTransactions,
  fetchNinjaLaunches,
  fetchSmartMoneyMoves,
  fetchTokenSecurityList,
  fetchWhaleTransactions,
} from '@/lib/actions/TransactionData';
import { Suspense } from 'react';

const SearchRoute = async ({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    [key: string]: string | string[] | undefined;
  }>;
}) => {
  const { type } = await searchParams;

  // Run the right fetch based on which chip was clicked
  if (type === 'rug') {
    const { items } = await fetchTokenSecurityList();
    return (
      <Suspense fallback={<TokensSkeleton />}>
        <TokenList tokens={items} />;
      </Suspense>
    );
  }

  if (type === 'whale') {
    const { items } = await fetchWhaleTransactions();
    console.log(items);
    return (
      <Suspense fallback={<TokensSkeleton />}>
        <WhaleTxList transactions={items} />
      </Suspense>
    );
  }

  if (type === 'smart-money') {
    const { items } = await fetchSmartMoneyMoves();
    return (
      <Suspense fallback={<TokensSkeleton />}>
        <SmartMoneyList moves={items} />
      </Suspense>
    );
  }

  if (type === 'ninja') {
    const { items } = await fetchNinjaLaunches();
    return (
      <Suspense fallback={<TokensSkeleton />}>
        <NinjaLaunchList tokens={items} />
      </Suspense>
    );
  }

  if (type === 'mev') {
    const { items } = await fetchMevTransactions();
    return (
      <Suspense fallback={<TokensSkeleton />}>
        <MevList trades={items} />
      </Suspense>
    );
  }

  // No type — show a default state
  return <div>Select a quick action to get started</div>;
};

export default SearchRoute;
