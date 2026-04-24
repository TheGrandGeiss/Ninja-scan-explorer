'use client';

import { useEffect, useState } from 'react';
import { FaRegCopy } from 'react-icons/fa';
import { GoArrowUpRight, GoArrowDownRight } from 'react-icons/go';

import { TokenPageData } from '@/lib/actions/tokenData';
import { truncate } from '@/lib/utils';
import TokenChart from '@/components/blocks/token/tokenChart';
import { OHLCVPoint } from '@/types';
import { fetchTokenChartData } from '@/lib/actions/tokenChartData';

/* ---------------- utils ---------------- */

function fmt(n: number, decimals = 2) {
  if (!Number.isFinite(n)) return '$0';
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(decimals)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(decimals)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(decimals)}K`;
  return `$${n.toFixed(decimals)}`;
}

function ensureUrl(url?: string) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `https://${url}`;
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className='border border-gray-200 px-4 py-3 flex flex-col gap-0.5'>
      <span className='text-[10px] text-gray-400 uppercase'>{label}</span>
      <span className='text-[15px] font-bold'>{value}</span>
      {sub && <span className='text-[10px] text-gray-400'>{sub}</span>}
    </div>
  );
}
/* ---------------- types ---------------- */

type Props = {
  data: TokenPageData;
  address: string;
};

/* ---------------- main ---------------- */

export default function TokenPageClient({ data, address }: Props) {
  const { overview, tradeData, aiSummary } = data;

  const [copied, setCopied] = useState(false);

  // CHART STATE
  const [ohlcv, setOhlcv] = useState<OHLCVPoint[] | undefined>([]);
  const [loadingChart, setLoadingChart] = useState(true);
  const [errorChart, setErrorChart] = useState<string | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(overview.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const priceUp = overview.priceChange24h >= 0;

  const totalVolume =
    (tradeData.buyVolume24h || 0) + (tradeData.sellVolume24h || 0);

  const buyPct = totalVolume
    ? (tradeData.buyVolume24h / totalVolume) * 100
    : 50;

  const sellPct = 100 - buyPct;
  const dexScreenerUrl = `https://dexscreener.com/solana/${address}`;
  const solscanUrl = `https://solscan.io/token/${address}`;

  /* ---------------- FETCH CHART CLIENT SIDE ---------------- */

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!address) {
        setErrorChart('Invalid token address');
        setLoadingChart(false);
        return;
      }

      setLoadingChart(true);
      setErrorChart(null);

      const res = await fetchTokenChartData(address);
      if (!active) return;

      if (res.success) {
        setOhlcv(res.data);
      } else {
        setErrorChart('Chart unavailable');
      }

      setLoadingChart(false);
    };

    run();

    return () => {
      active = false;
    };
  }, [address]);

  return (
    <div className='max-w-4xl mx-auto mt-6 mb-24 px-4 font-mono'>
      {/* HEADER */}
      <div className='flex justify-between mb-6'>
        <div className='flex gap-3 items-center'>
          <img
            src={overview.icon}
            className='w-10 h-10 rounded-full'
          />

          <div>
            <div className='flex gap-2 items-center'>
              <h1 className='font-bold'>{overview.symbol}</h1>
              <span className='text-gray-400 text-sm'>{overview.name}</span>

              {aiSummary && (
                <span className='text-xs px-2 py-0.5 bg-green-100 text-green-700'>
                  {aiSummary.verdict} · {aiSummary.safetyScore}/100
                </span>
              )}
            </div>

            <div className='text-[11px] text-gray-400 flex gap-1'>
              {truncate(overview.address)}
              <FaRegCopy
                onClick={handleCopy}
                className='cursor-pointer'
              />
              {copied && <span className='text-green-500'>copied</span>}
            </div>
          </div>
        </div>

        <div className='text-right'>
          <div className='text-xl font-bold'>
            {overview.price < 1
              ? fmt(overview.price)
              : `$${overview.price.toFixed(4)}`}
          </div>

          <div
            className={`text-sm font-bold flex items-center justify-end gap-1 ${
              priceUp ? 'text-green-600' : 'text-red-500'
            }`}>
            {priceUp ? <GoArrowUpRight /> : <GoArrowDownRight />}
            {overview.priceChange24h.toFixed(2)}%
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className='border border-gray-200 p-4 mb-4'>
        <div className='text-[11px] text-gray-400 mb-2'>Price — 24h</div>

        {loadingChart ? (
          <div className='h-40 flex items-center justify-center text-gray-400'>
            Loading chart...
          </div>
        ) : errorChart ? (
          <div className='h-40 flex items-center justify-center text-red-400'>
            {errorChart}
          </div>
        ) : (
          <TokenChart
            ohlcv={ohlcv}
            priceUp={priceUp}
          />
        )}
      </div>

      {/* AI */}
      {aiSummary?.summary && (
        <div className='border p-4 mb-4 text-sm text-gray-700'>
          {aiSummary.summary}
        </div>
      )}

      {/* STATS */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-2 mb-4'>
        <StatCard
          label='MC'
          value={fmt(overview.marketcap)}
        />
        <StatCard
          label='Liquidity'
          value={fmt(overview.liquidity)}
        />
        <StatCard
          label='Holders'
          value={overview.holders.toString()}
        />
        <StatCard
          label='FDV'
          value={fmt(overview.fdv)}
        />
      </div>

      {/* BUY/SELL */}
      <div className='border p-4 mb-4'>
        <div className='flex items-center justify-between text-[11px] mb-2'>
          <span className='text-green-600 font-bold'>Buys {buyPct.toFixed(1)}%</span>
          <span className='text-red-500 font-bold'>Sells {sellPct.toFixed(1)}%</span>
        </div>
        <div className='flex h-2 overflow-hidden'>
          <div
            className='bg-green-500'
            style={{ width: `${buyPct}%` }}
          />
          <div
            className='bg-red-500'
            style={{ width: `${sellPct}%` }}
          />
        </div>
      </div>

      {/* LINKS */}
      <div className='border p-4'>
        <div className='flex flex-wrap gap-2'>
          <a
            href={dexScreenerUrl}
            target='_blank'
            rel='noreferrer'
            className='px-3 py-1.5 border text-xs hover:bg-gray-50'>
            Dexscreener
          </a>

          <a
            href={solscanUrl}
            target='_blank'
            rel='noreferrer'
            className='px-3 py-1.5 border text-xs hover:bg-gray-50'>
            Solscan
          </a>

          {overview.twitter && (
            <a
              href={ensureUrl(overview.twitter)}
              target='_blank'
              rel='noreferrer'
              className='px-3 py-1.5 border text-xs hover:bg-gray-50'>
              Twitter
            </a>
          )}

          {overview.discord && (
            <a
              href={ensureUrl(overview.discord)}
              target='_blank'
              rel='noreferrer'
              className='px-3 py-1.5 border text-xs hover:bg-gray-50'>
              Discord
            </a>
          )}

          {overview.website && (
            <a
              href={ensureUrl(overview.website)}
              target='_blank'
              rel='noreferrer'
              className='px-3 py-1.5 border text-xs hover:bg-gray-50'>
              Website
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
