'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FaRegCopy } from 'react-icons/fa';
import { GoArrowUpRight } from 'react-icons/go';
import { TokenSecurityData } from '@/lib/actions/TransactionData';

export default function RugTokensList({
  tokens,
}: {
  tokens: TokenSecurityData[];
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const totalPages = Math.ceil(tokens.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTokens = tokens.slice(startIndex, startIndex + itemsPerPage);

  const handleCopy = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  function truncate(address: string) {
    if (!address || address.length < 10) return address;
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  }

  return (
    <div className='max-w-4xl mx-auto mt-4 mb-24 w-full'>
      <section className='w-full border border-gray-300 font-mono'>
        {currentTokens.map((token, index) => (
          <div
            key={index}
            className='flex items-center gap-4 w-full py-3 px-4 border-b border-gray-300 hover:bg-gray-50 transition-colors'>
            {/* Icon + Name */}
            <div className='flex items-center gap-2 w-40 shrink-0'>
              <img
                src={token.icon}
                alt={token.symbol}
                height={20}
                width={20}
                className='rounded-full'
              />
              <Link href={`/token/${token.address}`}>
                <span className='font-bold text-[13px] text-black hover:underline'>
                  {token.symbol}
                </span>
              </Link>
              <FaRegCopy
                className='text-gray-300 text-[10px] cursor-pointer hover:text-black'
                onClick={() => handleCopy(token.address)}
              />
            </div>

            {/* Risk Score */}
            <div className='flex items-center gap-1 shrink-0'>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                  token.riskScore >= 75
                    ? 'bg-red-100 text-red-600'
                    : token.riskScore >= 50
                      ? 'bg-orange-100 text-orange-500'
                      : token.riskScore >= 25
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                }`}>
                {token.riskScore >= 75
                  ? '🔴 High Risk'
                  : token.riskScore >= 50
                    ? '🟠 Medium Risk'
                    : token.riskScore >= 25
                      ? '🟡 Low Risk'
                      : '🟢 Safe'}
              </span>
            </div>

            {/* Risk Reasons */}
            <div className='flex items-center gap-1 flex-wrap flex-1'>
              {token.riskReasons.length === 0 ? (
                <span className='text-gray-400 text-[11px]'>
                  No issues found
                </span>
              ) : (
                token.riskReasons.map((reason, i) => (
                  <span
                    key={i}
                    className='bg-gray-100 text-gray-500 text-[10px] px-1.5 py-0.5 rounded-sm'>
                    {reason}
                  </span>
                ))
              )}
            </div>

            {/* Price + Volume */}
            <div className='flex items-center gap-3 shrink-0 ml-auto'>
              <span className='text-[12px] text-gray-500'>
                ${token.price.toFixed(6)}
              </span>
              <span className='bg-gray-100 text-gray-400 text-[10px] px-1 py-0.5 rounded-sm'>
                Vol $
                {token.volume24h.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </span>
              <GoArrowUpRight
                size={16}
                className='text-gray-300'
              />
            </div>
          </div>
        ))}
      </section>

      {totalPages > 1 && (
        <div className='flex justify-center items-center gap-2 mt-4 font-mono'>
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className='px-3 py-1 border border-gray-300 text-[13px] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed'>
            ←
          </button>
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
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className='px-3 py-1 border border-gray-300 text-[13px] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed'>
            →
          </button>
        </div>
      )}

      <p className='text-center text-[11px] text-gray-400 font-mono mt-2'>
        Page {currentPage} of {totalPages} · {tokens.length} tokens
      </p>
    </div>
  );
}
