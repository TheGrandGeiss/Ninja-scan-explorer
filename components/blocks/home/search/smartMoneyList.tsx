'use client';

import { truncate } from '@/lib/utils';
import { GoZap, GoGraph } from 'react-icons/go';
import { EmptyState } from './EmptyState';

export default function SmartMoneyList({ moves }: { moves: any[] }) {
  if (moves.length === 0)
    return (
      <EmptyState
        label='Tracking smart accumulators...'
        icon='🧠'
      />
    );

  return (
    <div className='max-w-4xl mx-auto mt-4 mb-24 w-full'>
      <section className='w-full border border-black font-mono bg-background'>
        {moves.map((move, i) => (
          <div
            key={i}
            className='flex items-center justify-between py-4 px-4 border-b border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-yellow-50 border border-yellow-200'>
                <GoZap className='text-yellow-600' />
              </div>
              <div className='flex flex-col'>
                <div className='flex items-center gap-2'>
                  <span className='font-bold text-[14px]'>
                    {truncate(move.address)}
                  </span>
                  <span
                    className={`text-[9px] px-1 border uppercase font-bold ${
                      move.confidence === 'HIGH'
                        ? 'bg-black text-white border-black'
                        : 'text-gray-400 border-gray-300'
                    }`}>
                    {move.confidence} CONFIDENCE
                  </span>
                </div>
                <p className='text-[11px] text-gray-500 italic'>
                  Ninja Intel: {move.reason}
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-1.5 opacity-80'>
                <img
                  src={move.icon}
                  className='w-4 h-4 rounded-full border border-gray-200'
                />
                <span className='font-bold text-[12px]'>
                  {move.tokenSymbol}
                </span>
              </div>
              <GoGraph className='text-gray-300' />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
