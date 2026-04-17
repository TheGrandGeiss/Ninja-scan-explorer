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

    const rawItems = result.data?.items || [];
    const significantTrades = rawItems.filter(
      (tx: any) => (tx.volume_usd || 0) >= 100,
    );

    return {
      success: true,
      items: significantTrades.slice(0, 20),
    };
  } catch (error) {
    console.error('Birdeye Fetch Error:', error);
    return { success: false, items: [] };
  }
}
