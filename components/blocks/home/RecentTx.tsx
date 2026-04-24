import { fetchLiveTxData } from '@/lib/actions/TransactionData';
import { truncate } from '@/lib/utils';
import { FaWallet } from 'react-icons/fa';

export default async function RecentTx() {
  const { items } = await fetchLiveTxData({ fresh: true, limit: 1 });
  const tx = items?.[0];

  if (!tx) return null;

  return (
    <section className='max-w-4xl md:mx-auto border border-gray-300 w-full py-8 px-6 md:px-16 mt-8 flex flex-col justify-center items-center mx-6'>
      <div className='w-full'>
        <h4 className='flex items-center gap-3 justify-center flex-wrap'>
          <span className='text-accent-orange flex gap-2 items-center'>
            <FaWallet size={18} />
            <span>{truncate(tx.from)}</span>
          </span>
          <span>&rarr;</span>
          <span className='text-accent-orange flex gap-2 items-center'>
            <span className='text-red-400'>-{tx.uiAmount}</span>
          </span>
          <span>&rarr;</span>
          <span className='text-accent-orange flex gap-2 items-center'>
            <span className='text-green-400'>
              +$
              {(tx.valueUsd ?? 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
            <span>{tx.symbol}</span>
          </span>
        </h4>
        <p className='text-xs text-center pt-6'>
          {tx.description || 'Latest on-chain transaction'}
        </p>
      </div>
    </section>
  );
}
