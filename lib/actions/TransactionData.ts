'use server';
import { createSolanaRpc, address as solanaAddress } from '@solana/kit';

const rpc = createSolanaRpc(
  `https://solana-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
);

export interface TokenSecurityData {
  address: string;
  symbol: string;
  name: string;
  icon: string;
  price: number;
  volume24h: number;
  mintAuthorityEnabled: boolean;
  freezeAuthorityEnabled: boolean;
  top10HolderPercent: number;
  ownerPercentage: number;
  creatorPercentage: number;
  isRisky: boolean;
  riskReasons: string[];
  riskScore: number;
  verdict: 'DANGER' | 'WARNING' | 'NINJA_SAFE';
}

const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

export async function fetchLiveTxData(options?: {
  fresh?: boolean;
  limit?: number;
}) {
  const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

  if (!BIRDEYE_API_KEY) {
    console.error('Missing Birdeye API Key');
    return { success: false, items: [] };
  }

  try {
    const limit = options?.limit ?? 100;
    const fetchOptions = options?.fresh
      ? {
          method: 'GET' as const,
          headers: {
            'X-API-KEY': BIRDEYE_API_KEY,
            'x-chain': 'solana',
            accept: 'application/json',
          },
          cache: 'no-store' as const,
        }
      : {
          method: 'GET' as const,
          headers: {
            'X-API-KEY': BIRDEYE_API_KEY,
            'x-chain': 'solana',
            accept: 'application/json',
          },
          next: { revalidate: 10 },
        };

    // Using the V3 All Trades endpoint
    const response = await fetch(
      `https://public-api.birdeye.so/defi/v3/txs?offset=0&limit=${limit}&sort_by=block_unix_time&sort_type=desc&tx_type=all&ui_amount_mode=scaled`,
      fetchOptions,
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Birdeye Error ${response.status}:`, errorText);
      return { success: false, items: [] };
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Failed to fetch');
    }

    const rawItems = result.data?.items || [];
    const significantTrades = rawItems.map((tx: any) => {
      const isBuy = tx.base.type_swap === 'to';

      const iconUrl = `https://img.logokit.com/crypto/${tx.base.symbol}?token=${process.env.LOGOKIT_API_KEY}`;

      return {
        id: tx.tx_hash,
        from: tx.owner,
        to: tx.source,
        toName: tx.source.charAt(0).toUpperCase() + tx.source.slice(1),
        uiAmount: `${tx.base.ui_amount.toFixed(2)} ${tx.base.symbol}`,
        valueUsd: tx.volume_usd || 0,
        symbol: tx.base.symbol,
        icon: iconUrl,
        tokenAddress: tx.base.address,
        type: tx.tx_type, // "swap"
        description: isBuy
          ? `Bought ${tx.base.symbol} with ${tx.quote.symbol}`
          : `Sold ${tx.base.symbol} for ${tx.quote.symbol}`,
      };
    });

    return {
      success: true,
      items: significantTrades,
    };
  } catch (error) {
    console.error('Birdeye Fetch Error:', error);
    return { success: false, items: [] };
  }
}

// Scans a single token using on-chain data + Birdeye holder data
async function getNinjaSecurityReport(mintAddress: string) {
  try {
    const [holderResponse, accountResponse] = await Promise.all([
      // Birdeye free endpoint for holder distribution
      fetch(
        `https://public-api.birdeye.so/defi/v3/token/holder?address=${mintAddress}&offset=0&limit=20`,
        {
          headers: {
            'X-API-KEY': BIRDEYE_API_KEY!,
            'x-chain': 'solana',
            accept: 'application/json',
          },
        },
      ),
      // Solana Kit on-chain mint account data
      rpc
        .getAccountInfo(solanaAddress(mintAddress), { encoding: 'base64' })
        .send(),
    ]);

    const holderData = await holderResponse.json();
    const accountInfo = accountResponse.value;

    // Parse mint authority + freeze authority from raw mint account bytes
    // Token Mint layout: bytes 4-36 = mint authority, bytes 44-76 = freeze authority
    let isMintRevoked = true;
    let isFreezeRevoked = true;

    if (accountInfo?.data) {
      const rawData = Buffer.from(accountInfo.data[0], 'base64');
      const mintAuthRaw = rawData.slice(4, 36);
      const freezeAuthRaw = rawData.slice(44, 76);
      isMintRevoked = mintAuthRaw.every((b) => b === 0);
      isFreezeRevoked = freezeAuthRaw.every((b) => b === 0);
    }

    // Calculate top 10 holder concentration from Birdeye
    const holders = holderData.data?.items || [];
    const top10Concentration = holders
      .slice(0, 10)
      .reduce((acc: number, h: any) => acc + (h.ui_percent || 0), 0);

    // Build risk profile
    const riskReasons: string[] = [];
    let riskScore = 0;

    if (!isMintRevoked) {
      riskScore += 40;
      riskReasons.push('Mint authority active');
    }
    if (!isFreezeRevoked) {
      riskScore += 30;
      riskReasons.push('Freeze authority active');
    }
    if (top10Concentration > 50) {
      riskScore += 20;
      riskReasons.push(`Top 10 holders own ${top10Concentration.toFixed(1)}%`);
    }

    const finalScore = Math.min(riskScore, 100);

    return {
      isMintRevoked,
      isFreezeRevoked,
      top10Concentration,
      riskReasons,
      riskScore: finalScore,
      verdict:
        finalScore > 50
          ? ('DANGER' as const)
          : finalScore > 20
            ? ('WARNING' as const)
            : ('NINJA_SAFE' as const),
    };
  } catch (error) {
    console.error(`Ninja scan failed for ${mintAddress}:`, error);
    return {
      isMintRevoked: true,
      isFreezeRevoked: true,
      top10Concentration: 0,
      riskReasons: [],
      riskScore: 0,
      verdict: 'NINJA_SAFE' as const,
    };
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const current = nextIndex++;
      if (current >= items.length) return;
      results[current] = await mapper(items[current], current);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

export async function fetchTokenSecurityList(): Promise<{
  success: boolean;
  items: TokenSecurityData[];
}> {
  if (!BIRDEYE_API_KEY) return { success: false, items: [] };

  try {
    const trendingRes = await fetch(
      'https://public-api.birdeye.so/defi/token_trending?sort_by=rank&interval=24h&sort_type=asc&offset=0&limit=10&ui_amount_mode=scaled',
      {
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'x-chain': 'solana',
          accept: 'application/json',
        },
        next: { revalidate: 60 },
      },
    );

    if (!trendingRes.ok)
      throw new Error(`New Listing Error ${trendingRes.status}`);

    const trendingData = await trendingRes.json();
    const tokens = trendingData.data?.tokens || [];
    console.log('tokens fetched:', tokens.length);

    // Faster than strict sequential while still controlling burst rate
    const securityReports = await mapWithConcurrency(
      tokens,
      3,
      async (token: any) => getNinjaSecurityReport(token.address),
    );

    const enriched: TokenSecurityData[] = tokens.map(
      (token: any, i: number) => {
        const report = securityReports[i];
        const iconUrl = `https://img.logokit.com/crypto/${token.symbol}?token=${process.env.LOGOKIT_API_KEY}`;

        return {
          address: token.address,
          symbol: token.symbol,
          name: token.name,
          icon: token.logoURI || iconUrl,
          price: token.price || 0,
          volume24h: token.volume24hUSD || 0,
          mintAuthorityEnabled: !report.isMintRevoked,
          freezeAuthorityEnabled: !report.isFreezeRevoked,
          top10HolderPercent: report.top10Concentration,
          ownerPercentage: 0,
          creatorPercentage: 0,
          isRisky: report.riskScore > 0,
          riskReasons: report.riskReasons,
          riskScore: report.riskScore,
          verdict: report.verdict,
        };
      },
    );

    const rugTokensOnly = enriched.filter((token) => token.riskScore > 0);
    return { success: true, items: rugTokensOnly };
  } catch (error) {
    console.error('Security fetch error:', error);
    return { success: false, items: [] };
  }
}

//whale radar fetch function
export async function fetchWhaleTransactions(): Promise<{
  success: boolean;
  items: any[];
}> {
  if (!BIRDEYE_API_KEY) return { success: false, items: [] };

  try {
    const response = await fetch(
      'https://public-api.birdeye.so/defi/v3/txs?offset=0&limit=100&sort_by=block_unix_time&sort_type=desc&tx_type=all&ui_amount_mode=scaled&min_volume_usd=10000',
      {
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'x-chain': 'solana',
          accept: 'application/json',
        },
        next: { revalidate: 15 },
      },
    );

    if (!response.ok) throw new Error(`Birdeye Error ${response.status}`);

    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Failed to fetch');

    const rawItems = result.data?.items || [];

    const whaleTrades = rawItems
      .filter((tx: any) => (tx.volume_usd || 0) >= 5000)
      .map((tx: any) => {
        const iconUrl = `https://img.logokit.com/crypto/${tx.base.symbol}?token=${process.env.LOGOKIT_API_KEY}`;

        const isBuy = tx.base.type_swap === 'to';
        return {
          id: tx.tx_hash,
          hash: tx.tx_hash,
          from: tx.owner,
          to: tx.source,
          toName: tx.source.charAt(0).toUpperCase() + tx.source.slice(1),
          uiAmount: `${tx.base.ui_amount.toFixed(2)} ${tx.base.symbol}`,
          valueUsd: tx.volume_usd || 0,
          symbol: tx.base.symbol,
          icon: iconUrl,
          tokenAddress: tx.base.address,
          type: tx.tx_type,
          description: isBuy
            ? `Bought ${tx.base.symbol} with ${tx.quote.symbol}`
            : `Sold ${tx.base.symbol} for ${tx.quote.symbol}`,
          isBuy,
          blockUnixTime: tx.block_unix_time,
        };
      });

    return { success: true, items: whaleTrades };
  } catch (error) {
    console.error('Whale fetch error:', error);
    return { success: false, items: [] };
  }
}

// lib/actions/TransactionData.ts
export async function fetchSmartMoneyMoves(): Promise<{
  success: boolean;
  items: any[];
}> {
  if (!BIRDEYE_API_KEY) return { success: false, items: [] };

  try {
    // Fetch global trades, no minimum volume here so we see EVERYTHING, then we filter
    const res = await fetch(
      'https://public-api.birdeye.so/defi/v3/txs?offset=0&limit=100&sort_by=block_unix_time&sort_type=desc&tx_type=swap&ui_amount_mode=scaled',
      {
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'x-chain': 'solana',
          accept: 'application/json',
        },
      },
    );

    const result = await res.json();
    const trades = result.data?.items || [];

    // Filter for wallets buying significant amounts (> $2000) of trending tokens
    const smartMoves = trades
      .filter((tx: any) => tx.tx_type === 'swap' && (tx.volume_usd || 0) > 2000)
      .slice(0, 5)
      .map((tx: any) => {
        const iconUrl = `https://img.logokit.com/crypto/${tx.base.symbol}?token=${process.env.LOGOKIT_API_KEY}`;
        return {
          address: tx.owner,
          tokenSymbol: tx.base?.symbol || 'SOL',
          tokenAddress: tx.base?.address,
          icon: tx.base?.logo_uri || iconUrl,
          reason: `Accumulated $${tx.volume_usd?.toFixed(0)} of ${tx.base?.symbol}`,
          confidence: tx.volume_usd > 10000 ? 'HIGH' : 'MEDIUM',
          timestamp: tx.block_unix_time,
        };
      });

    return { success: true, items: smartMoves };
  } catch (error) {
    console.error('Smart money fetch error:', error);
    return { success: false, items: [] };
  }
}

//ninja launches
// lib/actions/TransactionData.ts
export async function fetchNinjaLaunches(): Promise<{
  success: boolean;
  items: any[];
}> {
  if (!BIRDEYE_API_KEY) return { success: false, items: [] };

  try {
    const res = await fetch(
      'https://public-api.birdeye.so/defi/v2/tokens/new_listing?limit=10&meme_platform_enabled=false',
      {
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'x-chain': 'solana',
          accept: 'application/json',
        },
        next: { revalidate: 30 },
      },
    );

    const result = await res.json();
    const items = result.data?.items || [];

    // Filter for "Organic" looking launches (at least some volume or active time)
    const ninjaLaunches = items.map((token: any) => {
      const iconUrl = `https://img.logokit.com/crypto/${token.symbol}?token=${process.env.LOGOKIT_API_KEY}`;
      return {
        id: token.address,
        symbol: token.symbol,
        name: token.name,
        icon: token.logo_uri || iconUrl,
        liquidity: token.liquidity || 0,
        creationTime: token.active_time,
        isNinja: true, // Marker for your UI
        label: 'NEW STEALTH LAUNCH',
      };
    });

    return { success: true, items: ninjaLaunches };
  } catch (error) {
    console.error('Ninja launch fetch error:', error);
    return { success: false, items: [] };
  }
}

// fetch for MEV tracker CHip
// lib/actions/TransactionData.ts

export async function fetchMevTransactions() {
  const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
  if (!BIRDEYE_API_KEY) return { success: false, items: [] };

  try {
    const res = await fetch(
      'https://public-api.birdeye.so/defi/v3/txs?offset=0&limit=100&sort_by=block_unix_time&sort_type=desc&tx_type=swap&ui_amount_mode=scaled',
      {
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'x-chain': 'solana',
          accept: 'application/json',
        },
        next: { revalidate: 15 },
      },
    );

    const result = await res.json();
    const trades = result.data?.items || [];

    const botProfile: Record<
      string,
      { count: number; totalVolume: number; tokens: Set<string> }
    > = {};

    trades.forEach((tx: any) => {
      const owner = tx.owner;
      if (!botProfile[owner]) {
        botProfile[owner] = { count: 0, totalVolume: 0, tokens: new Set() };
      }
      botProfile[owner].count += 1;
      botProfile[owner].totalVolume += tx.volume_usd || 0;
      botProfile[owner].tokens.add(tx.base?.symbol || 'Unknown');
    });

    const mevMoves = trades
      .filter((tx: any) => botProfile[tx.owner].count >= 2)
      .map((tx: any) => {
        const profile = botProfile[tx.owner];
        const isArbitrage = profile.tokens.size > 1;
        const iconUrl = `https://img.logokit.com/crypto/${tx.base.symbol}?token=${process.env.LOGOKIT_API_KEY}`;

        return {
          id: tx.tx_hash,
          hash: tx.tx_hash,
          botAddress: tx.owner,
          type: isArbitrage ? 'ARBITRAGE' : 'SANDWICH',
          label: isArbitrage ? 'MULTI-DEX ARBITRAGE' : 'LIQUIDITY SANDWICH',
          targetToken: tx.base?.symbol || 'SOL',
          targetIcon: tx.base?.logo_uri || iconUrl,
          valueUsd: tx.volume_usd || 0,
          frequency: profile.count,
          timestamp: tx.block_unix_time,
        };
      });

    // Remove duplicates from the same bot in this list to keep it clean
    const uniqueMev = Array.from(
      new Map(mevMoves.map((m: any) => [m.botAddress, m])).values(),
    );

    return { success: true, items: uniqueMev };
  } catch (error) {
    console.error('MEV Tracker Error:', error);
    return { success: false, items: [] };
  }
}
