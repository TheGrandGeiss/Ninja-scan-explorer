import Image from 'next/image';
import { FaWallet } from 'react-icons/fa';
import usdc from '@/assets/usdc.svg';
import ore from '@/assets/ore.png';

export default function RecentTx() {
  return (
    <>
      <section className='max-w-4xl md:mx-auto border border-gray-300 w-full py-10 px-20 mt-8 flex flex-col justify-center items-center mx-6 '>
        <div>
          <h4 className='flex items-center gap-3'>
            <span className='text-accent-orange flex gap-2 items-center'>
              <FaWallet size={20} /> <span>8a2y...43W2</span>
            </span>{' '}
            &rarr;
            <span className='text-accent-orange flex gap-2 items-center'>
              <span className='text-red-400'>-83,128 </span>
              <Image
                src={usdc}
                alt='usdc token icon'
                width={25}
              />
              <span>USDC</span>
            </span>{' '}
            &rarr;
            <span className='text-accent-orange flex gap-2 items-center'>
              <span className='text-green-400'>+546.46 </span>
              <Image
                src={ore}
                alt='ore token icon'
                width={25}
              />
              <span>ORE</span>
            </span>{' '}
          </h4>
          <p className='text-xs text-center pt-6'>
            Transaction using{' '}
            <span className='underline'>Jupiter Aggregator V6</span> that
            involves <span className='underline'>USDC</span>,{' '}
            <span className='underline'>ORE</span>,{' '}
            <span className='underline'>SOL</span>
          </p>
        </div>
      </section>
    </>
  );
}
