'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

import { OHLCVPoint } from '@/lib/actions/tokenChartData';

/* utils */
function fmtTime(unix: number) {
  const d = new Date(unix * 1000);
  return `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
}

function formatPrice(v: number) {
  if (!Number.isFinite(v)) return '$0';
  if (Math.abs(v) >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(2)}K`;
  if (v < 0.001) return `$${v.toFixed(8)}`;
  return `$${v.toFixed(4)}`;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;

  return (
    <div className='bg-white border px-3 py-2 text-[12px]'>
      <p className='text-gray-400'>{label}</p>
      <p className='font-bold'>{formatPrice(Number(payload[0].value))}</p>
    </div>
  );
};

export default function TokenChart({
  ohlcv,
  priceUp,
}: {
  ohlcv: OHLCVPoint[] | undefined;
  priceUp: boolean;
}) {
  if (!ohlcv?.length) {
    return (
      <div className='h-40 flex items-center justify-center text-gray-300'>
        Loading chart...
      </div>
    );
  }

  const chartData = ohlcv.map((p) => ({
    time: fmtTime(p.time),
    price: Number(p.close),
  }));

  const lows = ohlcv.map((p) => Number(p.low)).filter(Number.isFinite);
  const highs = ohlcv.map((p) => Number(p.high)).filter(Number.isFinite);

  const minPrice = Math.min(...lows) * 0.999;
  const maxPrice = Math.max(...highs) * 1.001;

  return (
    <ResponsiveContainer
      width='100%'
      height={220}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray='3 3' />
        <XAxis
          dataKey='time'
          tick={{ fontSize: 10 }}
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tickFormatter={formatPrice}
          tick={{ fontSize: 10 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type='monotone'
          dataKey='price'
          stroke={priceUp ? '#16a34a' : '#dc2626'}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
