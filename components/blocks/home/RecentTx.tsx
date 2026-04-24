import { fetchLiveTxData } from '@/lib/actions/TransactionData';
import { truncate } from '@/lib/utils';
import { FaWallet } from 'react-icons/fa';

export default async function RecentTx() {
  const { items } = await fetchLiveTxData({ limit: 20 });
  const tx = items?.find(
    (item) =>
      item &&
      typeof item.from === 'string' &&
      typeof item.uiAmount === 'string' &&
      typeof item.symbol === 'string',
  );

  return (
    <section className='max-w-4xl md:mx-auto border border-gray-300 w-full py-8 px-6 md:px-16 mt-8 flex flex-col justify-center items-center mx-6'>
      <div className='w-full'>
        {tx ? (
          <>
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
          </>
        ) : (
          <div className='text-center'>
            <p className='text-sm text-gray-500'>Latest transaction unavailable</p>
            <p className='text-xs text-gray-400 pt-2'>
              Live feed is temporarily delayed, but transaction lists below still
              update.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
