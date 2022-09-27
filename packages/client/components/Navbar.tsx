import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className='py-10'>
      <ul className='mx-auto w-40 flex justify-between text-lg text-semibold text-[#0070f3]'>
        <li className='hover:underline'>
          <Link href='/'>Home</Link>
        </li>
        <li className='hover:underline'>
          <Link href='/theme'>Theme</Link>
        </li>
      </ul>
    </nav>
  )
}
