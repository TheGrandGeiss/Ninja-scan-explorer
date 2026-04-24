'use server';

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

export interface TokenPageData {
  overview: TokenOverview;
  tradeData: TokenTradeData;
  aiSummary: {
    summary: string;
    verdict: 'SAFE' | 'CAUTION' | 'DANGER';
    safetyScore: number;
  } | null;
}

const BIRDEYE_HEADERS = (apiKey: string) => ({
  'X-API-KEY': apiKey,
  'x-chain': 'solana',
  accept: 'application/json',
});

export async function fetchTokenPageData(
  mintAddress: string,
): Promise<{ success: boolean; data?: TokenPageData }> {
  const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
  if (!BIRDEYE_API_KEY) return { success: false };

  try {
    const [overviewRes, marketRes, tradeRes] = await Promise.all([
      fetch(
        `https://public-api.birdeye.so/defi/token_overview?address=${mintAddress}`,
        { headers: BIRDEYE_HEADERS(BIRDEYE_API_KEY), next: { revalidate: 30 } },
      ),
      fetch(
        `https://public-api.birdeye.so/defi/v3/token/market-data?address=${mintAddress}`,
        { headers: BIRDEYE_HEADERS(BIRDEYE_API_KEY), next: { revalidate: 30 } },
      ),
      fetch(
        `https://public-api.birdeye.so/defi/v3/token/trade-data/single?address=${mintAddress}`,
        { headers: BIRDEYE_HEADERS(BIRDEYE_API_KEY), next: { revalidate: 30 } },
      ),
    ]);

    const [overviewJson, marketJson, tradeJson] = await Promise.all([
      overviewRes.json(),
      marketRes.json(),
      tradeRes.json(),
    ]);

    const o = overviewJson.data;
    const m = marketJson.data;
    const t = tradeJson.data;

    const overview: TokenOverview = {
      address: mintAddress,
      symbol: o?.symbol || m?.symbol || '???',
      name: o?.name || m?.name || 'Unknown',
      icon:
        o?.logoURI ||
        `https://img.logokit.com/crypto/${o?.symbol || m?.symbol}?token=${process.env.LOGOKIT_API_KEY}`,
      price: m?.price ?? o?.price ?? 0,
      priceChange24h:
        t?.price_change_24h_percent ?? o?.priceChange24hPercent ?? 0,
      marketcap: m?.market_cap ?? o?.marketCap ?? 0,
      liquidity: m?.liquidity ?? o?.liquidity ?? 0,
      holders: m?.holder ?? o?.holder ?? 0,
      supply: m?.total_supply ?? o?.supply ?? 0,
      fdv: m?.fdv ?? o?.fdv ?? 0,
      website: o?.extensions?.website || '',
      twitter: o?.extensions?.twitter || '',
      discord: o?.extensions?.discord || '',
    };

    const tradeData: TokenTradeData = {
      volume24h: t?.volume_24h_usd ?? t?.volume24hUsd ?? 0,
      volume1h: t?.volume_1h_usd ?? t?.volume1hUsd ?? 0,
      buys24h: t?.buy_24h ?? t?.buy24h ?? 0,
      sells24h: t?.sell_24h ?? t?.sell24h ?? 0,
      buyVolume24h: t?.volume_buy_24h_usd ?? t?.volumeBuy24hUsd ?? 0,
      sellVolume24h: t?.volume_sell_24h_usd ?? t?.volumeSell24hUsd ?? 0,
      uniqueWallets24h: t?.unique_wallet_24h ?? t?.uniqueWallet24h ?? 0,
      uniqueWallets1h: t?.unique_wallet_1h ?? t?.uniqueWallet1h ?? 0,
      priceChange1h: t?.price_change_1h_percent ?? t?.priceChange1hPercent ?? 0,
      priceChange4h: t?.price_change_4h_percent ?? t?.priceChange4hPercent ?? 0,
    };

    // safety logic unchanged
    const volumeToLiquidity = tradeData.volume24h / (overview.liquidity || 1);
    const sellBuyRatio =
      tradeData.sellVolume24h / (tradeData.buyVolume24h || 1);
    const liquidityToMcap =
      (overview.liquidity / (overview.marketcap || 1)) * 100;
    const avgTradeSize =
      tradeData.volume24h / (tradeData.buys24h + tradeData.sells24h || 1);

    let safetyScore = 100;
    if (volumeToLiquidity > 3) safetyScore -= 25;
    if (volumeToLiquidity > 6) safetyScore -= 15;
    if (sellBuyRatio > 1.3) safetyScore -= 20;
    if (liquidityToMcap < 5) safetyScore -= 25;
    if (liquidityToMcap < 2) safetyScore -= 15;
    if (avgTradeSize > 10000) safetyScore -= 15;
    safetyScore = Math.max(0, safetyScore);

    const verdict: 'SAFE' | 'CAUTION' | 'DANGER' =
      safetyScore >= 70 ? 'SAFE' : safetyScore >= 40 ? 'CAUTION' : 'DANGER';

    let aiSummary: TokenPageData['aiSummary'] = null;

    try {
      const groqRes = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            max_tokens: 250,
            messages: [
              {
                role: 'system',
                content:
                  'You are a blunt on-chain analyst. Write exactly 3 sentences analyzing a Solana token.',
              },
              {
                role: 'user',
                content: `Token: ${overview.symbol} | MC: ${overview.marketcap} | Liq: ${overview.liquidity}`,
              },
            ],
          }),
        },
      );

      const groqData = await groqRes.json();
      const summaryText = groqData.choices?.[0]?.message?.content ?? '';

      aiSummary = {
        summary: summaryText,
        verdict,
        safetyScore,
      };
    } catch (e) {
      aiSummary = {
        summary: '',
        verdict,
        safetyScore,
      };
    }

    return {
      success: true,
      data: { overview, tradeData, aiSummary },
    };
  } catch (error) {
    console.error('❌ TOKEN PAGE ERROR:', error);
    return { success: false };
  }
}
