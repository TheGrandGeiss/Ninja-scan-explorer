'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FaRegCopy } from 'react-icons/fa';
import { GoArrowUpRight } from 'react-icons/go';

function truncate(address: string, chars = 6) {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

function fmtTime(unix: number) {
  if (!unix) return '—';
  return new Date(unix * 1000).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function initialLabel(symbol?: string) {
  if (!symbol) return '?';
  return symbol.slice(0, 2).toUpperCase();
}

const RISK_CONFIG = {
  Conservative: {
    bg: 'bg-green-100',
    text: 'text-green-700',
  },
  Moderate: {
    bg: 'bg-yellow-100',
    text: 'text-yellow-700',
  },
  Aggressive: {
    bg: 'bg-red-100',
    text: 'text-red-700',
  },
} as const;

type RiskProfile = keyof typeof RISK_CONFIG;

type WalletData = {
  wallet: string;
  healthScore: number;
  status: 'Healthy' | 'Warning' | 'Risky';
  stats: {
    solBalance: number;
    accountAgeDays: number;
    txCount: number;
    spamAssets: number;
    verifiedAssets: number;
    rentLamports: number;
    recentActivity: boolean;
  };
  detectedAssets: {
    mint: string;
    symbol: string;
    name: string;
    image?: string | null;
    verified: boolean;
    flagged: boolean;
  }[];
  last10: {
    signature: string;
    description: string;
    type: string;
    timestamp: number;
    token: {
      mint: string;
      symbol: string;
      name: string;
      image: string | null;
    } | null;
    counterparty: string;
  }[];
  aiSummary?: {
    summary: string;
    riskProfile: RiskProfile;
    verdict: string;
  };
};

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: 'green' | 'red';
}) {
  return (
    <div className='border border-gray-200 px-4 py-3 flex flex-col gap-0.5'>
      <span className='text-[10px] text-gray-400 font-mono uppercase tracking-wider'>
        {label}
      </span>

      <span
        className={`text-[15px] font-bold font-mono ${
          highlight === 'green'
            ? 'text-green-600'
            : highlight === 'red'
              ? 'text-red-500'
              : 'text-black'
        }`}>
        {value}
      </span>

      {sub && (
        <span className='text-[10px] text-gray-400 font-mono'>{sub}</span>
      )}
    </div>
  );
}

export default function WalletPageClient({ data }: { data: WalletData }) {
  const [copied, setCopied] = useState(false);
  const [tab, setTab] = useState<'assets' | 'activity'>('assets');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data.wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const riskConfig = data.aiSummary
    ? RISK_CONFIG[data.aiSummary.riskProfile] || RISK_CONFIG.Moderate
    : null;

  const scoreWidth = `${Math.max(0, Math.min(100, data.healthScore))}%`;

  return (
    <div className='max-w-4xl mx-auto mt-6 mb-24 w-full px-4 font-mono'>
      {/* Header */}
      <div className='flex items-start justify-between mb-6 gap-4'>
        <div className='flex flex-col gap-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <h1 className='text-[18px] font-bold text-black'>
              {truncate(data.wallet, 8)}
            </h1>

            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${
                data.status === 'Healthy'
                  ? 'bg-green-100 text-green-700'
                  : data.status === 'Risky'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
              }`}>
              {data.status}
            </span>

            {riskConfig && data.aiSummary && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-sm ${riskConfig.bg} ${riskConfig.text}`}>
                {data.aiSummary.riskProfile}
              </span>
            )}
          </div>

          <div className='flex items-center gap-1 text-[11px] text-gray-400 flex-wrap break-all'>
            <span>{data.wallet}</span>

            <FaRegCopy
              className='cursor-pointer hover:text-black transition-colors shrink-0'
              onClick={handleCopy}
            />

            {copied && <span className='text-green-500'>Copied</span>}
          </div>
        </div>

        <div className='flex flex-col items-end gap-2 shrink-0 min-w-[120px]'>
          <span className='text-[22px] font-bold text-black'>
            {data.healthScore}/100
          </span>

          <span className='text-[11px] text-gray-400'>
            {data.stats.solBalance.toFixed(3)} SOL
          </span>

          <div className='w-full h-2 bg-gray-100 rounded-full overflow-hidden'>
            <div
              className={`h-full ${
                data.healthScore >= 75
                  ? 'bg-green-500'
                  : data.healthScore < 45
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
              style={{ width: scoreWidth }}
            />
          </div>
        </div>
      </div>

      {/* AI Summary */}
      {data.aiSummary?.summary && (
        <div className='border border-gray-200 p-4 mb-4'>
          <span className='text-[10px] text-gray-400 uppercase tracking-wider block mb-2'>
            🤖 AI Wallet Intelligence
          </span>

          <p className='text-[13px] text-gray-700 leading-relaxed whitespace-pre-line'>
            {data.aiSummary.summary}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-2 mb-4'>
        <StatCard
          label='Wallet Age'
          value={`${data.stats.accountAgeDays}d`}
        />

        <StatCard
          label='Transactions'
          value={`${data.stats.txCount}`}
        />

        <StatCard
          label='Verified Assets'
          value={`${data.stats.verifiedAssets}`}
          highlight='green'
        />

        <StatCard
          label='Spam Assets'
          value={`${data.stats.spamAssets}`}
          highlight='red'
        />
      </div>

      <div className='grid grid-cols-2 md:grid-cols-2 gap-2 mb-4'>
        <StatCard
          label='Rent Locked'
          value={`${(data.stats.rentLamports / 1e9).toFixed(4)} SOL`}
        />

        <StatCard
          label='Recent Activity'
          value={data.stats.recentActivity ? 'Active' : 'Dormant'}
          highlight={data.stats.recentActivity ? 'green' : 'red'}
        />
      </div>

      {/* Tabs */}
      <div className='flex border-b border-gray-200 mb-4'>
        {(['assets', 'activity'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[12px] capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-black text-black font-bold'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {t === 'assets'
              ? `Detected Assets (${data.detectedAssets.length})`
              : `Last 10 (${data.last10.length})`}
          </button>
        ))}
      </div>

      {/* Assets */}
      {tab === 'assets' && (
        <section className='w-full border border-gray-200'>
          {data.detectedAssets.length === 0 ? (
            <div className='py-8 text-center text-gray-300 text-[12px]'>
              No assets found
            </div>
          ) : (
            data.detectedAssets.map((asset) => (
              <div
                key={asset.mint}
                className='flex items-center gap-3 w-full py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                {asset.image ? (
                  <img
                    src={asset.image}
                    alt={asset.symbol}
                    width={20}
                    height={20}
                    className='rounded-full shrink-0'
                  />
                ) : (
                  <div className='w-5 h-5 rounded-full shrink-0 bg-gray-200 text-[9px] font-bold text-gray-600 flex items-center justify-center'>
                    {initialLabel(asset.symbol)}
                  </div>
                )}

                <Link
                  href={`/token/${asset.mint}`}
                  className='hover:underline min-w-0'>
                  <span className='font-bold text-[13px] text-black'>
                    {asset.symbol}
                  </span>
                </Link>

                <span className='text-gray-400 text-[11px] hidden md:block truncate'>
                  {asset.name}
                </span>

                <div className='ml-auto shrink-0'>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
                      asset.flagged
                        ? 'bg-red-100 text-red-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                    {asset.flagged ? 'Scam Alert' : 'Verified'}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* Activity */}
      {tab === 'activity' && (
        <section className='w-full border border-gray-200'>
          {data.last10.length === 0 ? (
            <div className='py-8 text-center text-gray-300 text-[12px]'>
              No recent activity found
            </div>
          ) : (
            data.last10.map((tx, i) => (
              <div
                key={tx.signature || i}
                className='flex items-center gap-3 w-full py-3 px-4 border-b border-gray-100 hover:bg-gray-50 transition-colors'>
                <span className='text-[10px] font-bold px-2 py-0.5 rounded-sm bg-gray-100 text-gray-600 shrink-0'>
                  {tx.type}
                </span>

                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 min-w-0'>
                    {tx.token?.image ? (
                      <img
                        src={tx.token.image}
                        alt={tx.token?.symbol || 'token'}
                        width={18}
                        height={18}
                        className='rounded-full shrink-0'
                      />
                    ) : (
                      <div className='w-[18px] h-[18px] rounded-full shrink-0 bg-gray-200 text-[8px] font-bold text-gray-600 flex items-center justify-center'>
                        {initialLabel(tx.token?.symbol)}
                      </div>
                    )}

                    {tx.token?.mint ? (
                      <Link
                        href={`/token/${tx.token.mint}`}
                        className='font-bold text-[12px] text-black hover:underline shrink-0'>
                        {tx.token.symbol}
                      </Link>
                    ) : (
                      <span className='font-bold text-[12px] text-black shrink-0'>
                        {tx.token?.symbol || 'UNKNOWN'}
                      </span>
                    )}

                    <p className='text-[12px] text-gray-500 truncate'>
                      {tx.token?.name || tx.description}
                    </p>
                  </div>

                  <div className='flex items-center gap-2 text-[10px] text-gray-400 mt-0.5'>
                    <span>{fmtTime(tx.timestamp)}</span>
                    <span>•</span>
                    <Link
                      href={`/wallet/${tx.counterparty}`}
                      className='hover:underline'>
                      {truncate(tx.counterparty)}
                    </Link>
                  </div>

                  {!tx.token?.mint && (
                    <p className='text-[10px] text-gray-400 truncate mt-0.5'>
                      {tx.description}
                    </p>
                  )}
                </div>

                <a
                  href={`https://solscan.io/tx/${tx.signature}`}
                  target='_blank'
                  rel='noopener noreferrer'>
                  <GoArrowUpRight
                    size={13}
                    className='text-gray-300 hover:text-black'
                  />
                </a>
              </div>
            ))
          )}
        </section>
      )}

      {/* Links */}
      <div className='flex gap-2 text-[11px] mt-4 flex-wrap'>
        <a
          href={`https://solscan.io/account/${data.wallet}`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-1 border border-gray-200 px-3 py-1.5 hover:bg-gray-50 transition-colors'>
          Solscan <GoArrowUpRight size={11} />
        </a>

        <a
          href={`https://de.fi/scanner/wallet?address=${data.wallet}&network=solana`}
          target='_blank'
          rel='noopener noreferrer'
          className='flex items-center gap-1 border border-gray-200 px-3 py-1.5 hover:bg-gray-50 transition-colors'>
          DeFi Scanner <GoArrowUpRight size={11} />
        </a>
      </div>
    </div>
  );
}
