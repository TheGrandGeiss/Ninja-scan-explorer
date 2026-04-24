import { cache } from 'react';

import { fetchLiveTxData } from '@/lib/actions/TransactionData';

/**
 * Single Birdeye request per RSC render. Layout (RecentTx) and home page both
 * call this so we do not double-hit the API and trip rate limits.
 */
export const getHomeLiveTransactions = cache(async () =>
  fetchLiveTxData({ limit: 100 }),
);
