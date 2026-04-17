import Image from 'next/image';
import Link from 'next/link';
import birdeye from '@/assets/birdeye.png';

export default function Navbar() {
  return (
    <>
      <div className='border-b border-gray-300'>
        <nav className='max-w-6xl md:mx-auto mx-auto py-4 w-full flex justify-between items-center '>
          <h1 className='text-3xl text-accent-orange'>
            <Link href={'/'}>NINJA SCAN</Link>
          </h1>

          <div className='flex gap-4 items-center'>
            <span>powered by </span>
            <Link href={'https://bds.birdeye.so/'}>
              <Image
                src={birdeye}
                alt='birdeye logo'
                width={80}
              />
            </Link>
          </div>
        </nav>
      </div>
    </>
  );
}
