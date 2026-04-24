'use server';

export interface OHLCVPoint {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BIRDEYE_HEADERS = (apiKey: string) => ({
  'X-API-KEY': apiKey,
  'x-chain': 'solana',
  accept: 'application/json',
});

const TTL_MS = 60_000;
const chartCache = new Map<string, { expiresAt: number; data: OHLCVPoint[] }>();
const inflight = new Map<
  string,
  Promise<{ success: boolean; data?: OHLCVPoint[] }>
>();

export async function fetchTokenChartData(mintAddress: string) {
  const nowMs = Date.now();
  const cached = chartCache.get(mintAddress);

  if (cached && cached.expiresAt > nowMs) {
    return { success: true, data: cached.data };
  }

  const ongoing = inflight.get(mintAddress);
  if (ongoing) return ongoing;

  const request = (async () => {
    const BIRDEYE_API_KEY = process.env.BIRDEYE_API_KEY;
    if (!BIRDEYE_API_KEY) return { success: false };

    try {
      const now = Math.floor(Date.now() / 1000);
      const oneDayAgo = now - 86400;

      const res = await fetch(
        `https://public-api.birdeye.so/defi/ohlcv?address=${mintAddress}&type=15m&time_from=${oneDayAgo}&time_to=${now}`,
        {
          headers: BIRDEYE_HEADERS(BIRDEYE_API_KEY),
          next: { revalidate: 300 },
        },
      );

      if (!res.ok) {
        return { success: false };
      }

      const json = await res.json();

      const ohlcv: OHLCVPoint[] = (json.data?.items || []).map((item: any) => ({
        time: item.unixTime,
        open: item.o,
        high: item.h,
        low: item.l,
        close: item.c,
        volume: item.v,
      }));

      chartCache.set(mintAddress, {
        expiresAt: Date.now() + TTL_MS,
        data: ohlcv,
      });

      return {
        success: true,
        data: ohlcv,
      };
    } catch (err) {
      console.error('❌ CHART FETCH ERROR:', err);
      return { success: false };
    } finally {
      inflight.delete(mintAddress);
    }
  })();

  inflight.set(mintAddress, request);
  return request;
}
