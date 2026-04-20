'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaRegCopy } from 'react-icons/fa';
import { GoArrowUpRight } from 'react-icons/go';

interface Transaction {
  id: string;
  from: string;
  tokenAddress: string;
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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(transactions.length / itemsPerPage);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = transactions.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  function truncate(address: string) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className='max-w-4xl mx-auto mt-4 mb-24 w-full'>
      <section className='w-full border border-gray-300 font-mono'>
        {currentTransactions.map((tx, index) => (
          <div
            key={index}
            className='group flex items-center gap-4 w-full py-3 px-4 border-b border-gray-300 hover:bg-gray-50 transition-colors'>
            <div className='flex items-center gap-3 w-full'>
              <GoArrowUpRight
                size={20}
                className='text-gray-300 shrink-0'
              />

              <div className='flex items-center gap-1 text-[13px]'>
                <span className='text-gray-500'>Transfer from</span>
                <Link href={`/wallet/${tx.from}`}>
                  <span className='font-bold text-black hover:underline'>
                    {truncate(tx.from) || 'Unknown'}
                  </span>
                </Link>
                <FaRegCopy
                  className='text-gray-300 text-[10px] cursor-pointer hover:text-black'
                  onClick={() => handleCopy(tx.from)}
                />
                <span className='text-gray-500 ml-1'>to</span>
                <Link href={`/ex/${tx.to}`}>
                  <span className='font-bold text-black hover:underline'>
                    {tx.toName || truncate(tx.to) || 'Unknown'}
                  </span>
                </Link>
                <FaRegCopy
                  className='text-gray-300 text-[10px] cursor-pointer hover:text-black'
                  onClick={() => handleCopy(tx.to)}
                />
              </div>

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
                <Link
                  href={`/token/${tx.tokenAddress}`}
                  className='flex gap-2 hover:underline'>
                  <img
                    src={tx.icon}
                    alt={tx.symbol}
                    height={20}
                    width={20}
                    className='rounded-full'
                  />
                  <span className='font-bold text-[13px]'>{tx.symbol}</span>
                </Link>
                <FaRegCopy
                  className='text-gray-300 text-[10px] cursor-pointer hover:text-black'
                  onClick={() => handleCopy(tx.tokenAddress)}
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Pagination */}
      <div className='flex justify-center items-center gap-2 mt-4 font-mono'>
        {/* Prev arrow */}
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className='px-3 py-1 border border-gray-300 text-[13px] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed'>
          ←
        </button>

        {/* Page numbers */}
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
          <button
            key={num}
            onClick={() => setCurrentPage(num)}
            className={`px-3 py-1 border text-[13px] ${
              currentPage === num
                ? 'bg-black text-white border-black'
                : 'border-gray-300 hover:bg-gray-50'
            }`}>
            {num}
          </button>
        ))}

        {/* Next arrow */}
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          className='px-3 py-1 border border-gray-300 text-[13px] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed'>
          →
        </button>
      </div>

      {/* Page counter */}
      <p className='text-center text-[11px] text-gray-400 font-mono mt-2'>
        Page {currentPage} of {totalPages} · {transactions.length} transactions
      </p>
    </div>
  );
}
