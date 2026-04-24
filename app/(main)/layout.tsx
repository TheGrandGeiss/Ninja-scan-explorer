import type { Metadata } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import '@/app/globals.css';
import { cn } from '@/lib/utils';
import Navbar from '@/components/blocks/home/Navbar';
import RecentTx from '@/components/blocks/home/RecentTx';
import SearchBar from '@/components/blocks/home/Search';
import { Suspense } from 'react';

const jetbrains = JetBrains_Mono({
  display: 'swap',
  weight: ['200', '400', '700'],
  style: 'normal',
});

export const metadata = {
  title: 'Ninja Scan Explorer | Solana Wallet & Token Analyzer',
  description:
    'Explore Solana wallets, inspect token metrics, view recent transactions, and analyze on-chain activity with Ninja Scan Explorer.',
  metadataBase: new URL('https://ninja-scan-explorer.vercel.app'),
  openGraph: {
    title: 'Ninja Scan Explorer',
    description:
      'Fast Solana wallet and token explorer with charts, analytics, and AI insights.',
    url: 'https://ninja-scan-explorer.vercel.app',
    siteName: 'Ninja Scan Explorer',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ninja Scan Explorer',
    description:
      'Analyze Solana wallets, tokens, charts, and transactions instantly.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang='en'
      className={cn(
        'h-full',
        'antialiased',

        'font-mono',
        jetbrains.className,
      )}>
      <body className='min-h-full flex flex-col bg-background'>
        <Navbar />
        <RecentTx />
        <Suspense fallback={null}>
          <SearchBar />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
