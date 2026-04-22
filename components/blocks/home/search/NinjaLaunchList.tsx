'use client';

import { truncate } from '@/lib/utils';
import { GoRocket } from 'react-icons/go';
import { EmptyState } from './EmptyState';
import Link from 'next/link';

export default function NinjaLaunchList({ tokens }: { tokens: any[] }) {
  if (tokens.length === 0)
    return (
      <EmptyState
        label='Searching for fresh stealth launches...'
        icon='🚀'
      />
    );

  return (
    <div className='max-w-4xl mx-auto mt-4 mb-24 w-full'>
      <section className='w-full border border-black font-mono bg-background'>
        {tokens.map((token, i) => (
          <Link
            href={`/token/${token.id}`}
            key={i}>
            <div className='flex items-center justify-between py-4 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer group'>
              <div className='flex items-center gap-3'>
                {/* Logo Spot */}
                <div className='w-8 h-8 shrink-0 overflow-hidden border border-gray-200'>
                  <img
                    src={token.icon || `https://jup.ag{token.id}`}
                    alt={token.symbol}
                    className='w-full h-full object-cover'
                    onError={(e) =>
                      (e.currentTarget.src = '/fallback-token.png')
                    }
                  />
                </div>

                <div className='flex flex-col'>
                  <div className='flex items-center gap-2'>
                    <span className='font-bold text-[14px]'>
                      {token.symbol}
                    </span>
                    <span className='text-[9px] px-1 bg-green-100 text-green-700 border border-green-200 uppercase font-bold'>
                      {token.isStealth ? 'STEALTH' : 'JUST LISTED'}
                    </span>
                  </div>
                  <span className='text-[10px] text-gray-400 font-mono'>
                    {truncate(token.address)}
                  </span>
                </div>
              </div>

              <div className='flex items-center gap-6'>
                <div className='flex flex-col items-end font-mono'>
                  <span className='text-[10px] text-gray-400 uppercase'>
                    Liquidity
                  </span>
                  <span className='font-bold text-[12px] text-green-600'>
                    $
                    {(token.liquidity ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                    })}
                  </span>
                </div>
                <GoRocket className='text-orange-500 group-hover:animate-bounce hidden md:block' />
                <button className='bg-black text-white px-4 py-1 text-[10px] uppercase font-bold hover:bg-gray-800 transition-all'>
                  ANALYZE
                </button>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
