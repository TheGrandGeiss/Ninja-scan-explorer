'use client';

import { truncate } from '@/lib/utils';
import { GoZap, GoAlert } from 'react-icons/go';
import { EmptyState } from './EmptyState';

export default function MevList({ trades }: { trades: any[] }) {
  if (trades.length === 0)
    return (
      <EmptyState
        label='No bot clusters detected in this block...'
        icon='🤖'
      />
    );

  return (
    <div className='w-full border border-black font-mono bg-background max-w-4xl mx-auto my-4'>
      {trades.map((bot, i) => (
        <div
          key={i}
          className='flex items-center justify-between py-4 px-4 border-b border-gray-200 hover:bg-red-50 group transition-all'>
          <div className='flex items-center gap-3'>
            <div
              className={`p-2 border ${bot.type === 'ARBITRAGE' ? 'bg-blue-50 border-blue-200 text-blue-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <GoZap size={18} />
            </div>

            <div className='flex flex-col'>
              <div className='flex items-center gap-2'>
                <span className='font-bold text-[14px]'>
                  {truncate(bot.botAddress)}
                </span>
                <span
                  className={`text-[9px] px-1 border border-black font-bold ${bot.type === 'ARBITRAGE' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}`}>
                  {bot.label}
                </span>
              </div>
              <p className='text-[11px] text-gray-500'>
                Pattern: {bot.frequency} txs in current batch targeting $
                {bot.valueUsd.toFixed(0)} vol
              </p>
            </div>
          </div>

          <div className='flex items-center gap-4'>
            <div className='flex flex-col items-end'>
              <span className='text-[10px] text-gray-400 uppercase'>
                Target
              </span>
              <div className='flex items-center gap-1.5'>
                <img
                  src={bot.targetIcon}
                  className='w-4 h-4 rounded-full border border-gray-200'
                  alt=''
                />
                <span className='font-bold text-[12px]'>{bot.targetToken}</span>
              </div>
            </div>
            <GoAlert className='text-gray-300 group-hover:text-red-500 transition-colors' />
          </div>
        </div>
      ))}
    </div>
  );
}
