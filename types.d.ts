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

declare module '*css';

export interface TokenOverview {
  address: string;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  priceChange24h: number;
  marketcap: number;
  liquidity: number;
  holders: number;
  supply: number;
  fdv: number;
  website: string;
  twitter: string;
  discord: string;
}

export interface TokenTradeData {
  volume24h: number;
  volume1h: number;
  buys24h: number;
  sells24h: number;
  buyVolume24h: number;
  sellVolume24h: number;
  uniqueWallets24h: number;
  uniqueWallets1h: number;
  priceChange1h: number;
  priceChange4h: number;
}

export interface OHLCVPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TokenPageData {
  overview: TokenOverview;
  tradeData: TokenTradeData;
  ohlcv?: OHLCVPoint[];
  aiSummary: {
    summary: string;
    verdict: 'SAFE' | 'CAUTION' | 'DANGER';
    safetyScore: number;
  } | null;
}
