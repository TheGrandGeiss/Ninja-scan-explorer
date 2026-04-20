'use server';

export async function fetchLiveTxData() {
  const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;

  if (!BIRDEYE_API_KEY) {
    console.error('Missing Birdeye API Key');
    return { success: false, items: [] };
  }

  try {
    // Using the V3 All Trades endpoint
    const response = await fetch(
      'https://public-api.birdeye.so/defi/v3/txs?offset=0&limit=100&sort_by=block_unix_time&sort_type=desc&tx_type=all&ui_amount_mode=scaled',
      {
        method: 'GET',
        headers: {
          'X-API-KEY': BIRDEYE_API_KEY,
          'x-chain': 'solana',
          accept: 'application/json',
        },
        next: { revalidate: 10 },
      },
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

    console.log(result);

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
        tokenAddress: tx.quote.address,
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
