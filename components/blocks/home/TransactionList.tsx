import { FaExternalLinkAlt, FaRegCopy } from 'react-icons/fa';
import Image from 'next/image';

interface Transaction {
  id: string;
  from: string;
  fromName?: string;
  to: string;
  toName?: string;
  amount: number;
  uiAmount: string;
  valueUsd: number;
  symbol: string;
  icon: string;
}

export default function TransactionList({
  transactions,
}: {
  transactions: Transaction[];
}) {
  return (
    <div className='w-full border-t border-gray-200 font-mono max-w-4xl mx-auto'>
      {transactions.map((tx, index) => (
        <div
          key={index}
          className='group flex items-center justify-between py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors'>
          {/* Left Section: Icon & Intent */}
          <div className='flex items-center gap-3 overflow-hidden'>
            <FaExternalLinkAlt className='text-gray-300 text-[10px] shrink-0' />

            <div className='flex items-center gap-1 text-[13px] whitespace-nowrap overflow-hidden'>
              <span className='text-gray-500'>Transfer from</span>
              <span className='font-bold text-black'>
                {tx.fromName ||
                  (tx.from
                    ? `${tx.from.slice(0, 5)}...${tx.from.slice(-5)}`
                    : 'Unknown')}
              </span>
              <FaRegCopy className='text-gray-300 text-[10px] cursor-pointer hover:text-black' />

              <span className='text-gray-500 ml-1'>to</span>
              <span className='font-bold text-black'>
                {tx.toName ||
                  (tx.to
                    ? `${tx.to.slice(0, 5)}...${tx.to.slice(-5)}`
                    : 'Unknown')}
              </span>
              <FaRegCopy className='text-gray-300 text-[10px] cursor-pointer hover:text-black' />
            </div>
          </div>

          {/* Right Section: Amount & Token */}
          <div className='flex items-center gap-4 shrink-0'>
            <div className='flex items-center gap-2'>
              <span className='text-gray-500 text-[12px]'>for</span>
              <span className='font-bold text-[13px]'>{tx.uiAmount}</span>
              <span className='bg-gray-100 text-gray-400 text-[10px] px-1 py-0.5 rounded-sm'>
                $
                {(tx.valueUsd ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className='flex items-center gap-2 min-w-20 justify-end'>
              {tx.icon ? (
                <img
                  src={tx.icon}
                  alt={tx.symbol}
                  className='w-5 h-5 rounded-full border border-gray-200'
                />
              ) : (
                <div className='w-5 h-5 rounded-full bg-gray-200' />
              )}
              <span className='font-bold text-[13px]'>{tx.symbol}</span>
              <FaExternalLinkAlt className='text-gray-300 text-[10px]' />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
