'use client';

import { useState, useTransition } from 'react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { FaSearch } from 'react-icons/fa';
import { useRouter, useSearchParams } from 'next/navigation';
import { resolveAddressSearch } from '@/lib/actions/resolveAddressSearch';

export const QUICK_ACTION_CHIPS = [
  {
    id: 'rug-radar',
    label: '⚠️ Rug Radar',
    route: 'rug',
    prompt:
      'Find tokens launched in the last 24h with unlocked liquidity or active mint authority.',
  },
  {
    id: 'whale-watch',
    label: '🐳 Whale Watch',
    route: 'whale',
    prompt:
      'Show me wallets that have moved more than 500 SOL in the last 4 hours.',
  },
  {
    id: 'smart-money',
    label: '💎 Smart Money',
    route: 'smart-money',
    prompt:
      'List tokens where the top 10 holders are known profitable DEX traders.',
  },
  {
    id: 'stealth-launches',
    label: '🚀 Ninja Launches',
    route: 'ninja',
    prompt: 'Show new tokens with high social volume but low market cap.',
  },
  {
    id: 'mev-activity',
    label: '🤖 Bot Tracker',
    route: 'mev',
    prompt:
      'Analyze recent transactions for sandwich attacks and arbitrage bot clusters.',
  },
];

export default function SearchBar() {
  const [searchValue, setSearchValue] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams(); // Hook to read URL params

  // Get the current 'type' from the URL (e.g., 'whale', 'rug')
  const currentType = searchParams.get('type');

  const runSearch = () => {
    const q = searchValue.trim();
    if (!q) return;

    startTransition(async () => {
      const resolved = await resolveAddressSearch(q);
      if (resolved.ok) {
        router.push(resolved.path);
        return;
      }
    });
  };

  return (
    <section className='max-w-4xl mx-auto w-full mt-4 px-6 md:px-0 font-mono'>
      <InputGroup className='flex w-full h-14 bg-transparent border border-black rounded-none transition-all focus-within:ring-1 focus-within:ring-black'>
        <InputGroupInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              runSearch();
            }
          }}
          placeholder='Paste wallet or token mint address…'
          className='flex-1 w-full bg-transparent border-none rounded-none px-4 outline-none focus:ring-0 text-sm'
        />
        <InputGroupAddon
          align='inline-end'
          className='flex items-center justify-center px-5 bg-transparent border-l border-black'>
          <button
            type='button'
            disabled={isPending}
            onClick={runSearch}
            className='text-black hover:scale-110 transition-transform flex items-center justify-center disabled:opacity-40'>
            <FaSearch size={18} />
          </button>
        </InputGroupAddon>
      </InputGroup>

      <div className='flex flex-wrap gap-2 mt-4'>
        {QUICK_ACTION_CHIPS.map((chip) => {
          // Check if this specific chip is currently active based on the URL
          const isActive = currentType === chip.route;

          return (
            <button
              key={chip.id}
              onClick={() => {
                if (isActive) {
                  setSearchValue('');
                  router.push('/');
                } else {
                  setSearchValue(chip.prompt);
                  router.push(`/search?type=${chip.route}`);
                }
              }}
              className={`group relative border px-3 py-1.5 transition-all rounded-none ${
                isActive
                  ? 'bg-black border-black' // Active state
                  : 'bg-white border-gray-300 hover:border-black hover:bg-black' // Idle/Hover state
              }`}>
              <span
                className={`text-[10px] uppercase tracking-tighter font-bold whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-500 group-hover:text-white'
                }`}>
                {chip.label}
              </span>

              <div className='absolute hidden group-hover:block bottom-full left-0 mb-2 w-48 bg-black text-white text-[9px] p-2 rounded-none pointer-events-none z-10 border border-white'>
                {chip.prompt}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
