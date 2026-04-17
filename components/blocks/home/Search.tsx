'use client';

import { useState } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { FaSearch } from 'react-icons/fa';

export const QUICK_ACTION_CHIPS = [
  {
    id: 'rug-radar',
    label: '⚠️ Rug Radar',
    prompt:
      'Find tokens launched in the last 24h with unlocked liquidity or active mint authority.',
  },
  {
    id: 'whale-watch',
    label: '🐳 Whale Watch',
    prompt:
      'Show me wallets that have moved more than 500 SOL in the last 4 hours.',
  },
  {
    id: 'smart-money',
    label: '💎 Smart Money',
    prompt:
      'List tokens where the top 10 holders are known profitable DEX traders.',
  },
  {
    id: 'stealth-launches',
    label: '🚀 Ninja Launches',
    prompt: 'Show new tokens with high social volume but low market cap.',
  },
  {
    id: 'mev-activity',
    label: '🤖 Bot Tracker',
    prompt:
      'Analyze recent transactions for sandwich attacks and arbitrage bot clusters.',
  },
];

export default function SearchBar() {
  const [searchValue, setSearchValue] = useState('');

  return (
    <section className='max-w-4xl mx-auto w-full mt-4 px-6 md:px-0 font-mono'>
      {/* Search Input */}
      <InputGroup className='flex w-full h-14 bg-transparent border border-black rounded-none transition-all focus-within:ring-1 focus-within:ring-black'>
        <InputGroupInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder='Paste address or ask Ninja AI...'
          className='flex-1 w-full bg-transparent border-none rounded-none px-4 outline-none focus:ring-0 text-sm'
        />

        <InputGroupAddon
          align='inline-end'
          className='flex items-center justify-center px-5 bg-transparent border-l border-black'>
          <button
            type='button'
            className='text-black hover:scale-110 transition-transform flex items-center justify-center'>
            <FaSearch size={18} />
          </button>
        </InputGroupAddon>
      </InputGroup>

      <div className='flex flex-wrap gap-2 mt-4'>
        {QUICK_ACTION_CHIPS.map((chip) => (
          <button
            key={chip.id}
            onClick={() => setSearchValue(chip.prompt)}
            className='group relative border border-gray-300 px-3 py-1.5 bg-white hover:border-black hover:bg-black transition-all rounded-none'>
            <span className='text-[10px] uppercase tracking-tighter text-gray-500 group-hover:text-white font-bold whitespace-nowrap'>
              {chip.label}
            </span>

            {/* Tooltip on Hover (Optional but clean) */}
            <div className='absolute hidden group-hover:block bottom-full left-0 mb-2 w-48 bg-black text-white text-[9px] p-2 rounded-none pointer-events-none z-10 border border-white'>
              {chip.prompt}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
