'use client';

export default function TokensSkeleton() {
  return (
    <div className='max-w-4xl mx-auto mt-4 mb-24 w-full'>
      <section className='w-full border border-gray-300 font-mono'>
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className='flex items-center gap-4 w-full py-3 px-4 border-b border-gray-300 overflow-hidden relative'>
            {/* Shimmer overlay */}
            <div className='absolute inset-0 -translate-x-full animate-shimmer bg-linear-to-r from-transparent via-white/60 to-transparent skew-x-[-20deg]' />

            {/* Icon + Name */}
            <div className='flex items-center gap-2 w-40 shrink-0'>
              <div className='w-5 h-5 rounded-full bg-gray-200' />
              <div className='h-3 w-16 bg-gray-200 rounded-sm' />
            </div>

            {/* Risk badge */}
            <div className='shrink-0'>
              <div className='h-5 w-24 bg-gray-200 rounded-sm' />
            </div>

            {/* Risk reasons */}
            <div className='flex items-center gap-1 flex-1'>
              <div className='h-4 w-32 bg-gray-200 rounded-sm' />
              <div className='h-4 w-24 bg-gray-200 rounded-sm' />
              <div className='h-4 w-20 bg-gray-200 rounded-sm' />
            </div>

            {/* Price + Volume */}
            <div className='flex items-center gap-3 shrink-0 ml-auto'>
              <div className='h-3 w-16 bg-gray-200 rounded-sm' />
              <div className='h-4 w-20 bg-gray-200 rounded-sm' />
              <div className='w-4 h-4 bg-gray-200 rounded-sm' />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
