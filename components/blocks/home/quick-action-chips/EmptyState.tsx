export function EmptyState({ label, icon }: { label: string; icon: string }) {
  return (
    <div className='max-w-4xl mx-auto mt-4 p-20 border border-dashed border-gray-300 flex flex-col items-center font-mono bg-background w-full mb-20'>
      <span className='text-3xl mb-3'>{icon}</span>
      <h3 className='uppercase font-bold tracking-tighter text-black'>
        {label}
      </h3>
      <p className='text-gray-400 text-[10px] mt-1'>
        Data stream refreshing every 30s...
      </p>
    </div>
  );
}
