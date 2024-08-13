"use client"
import Link  from 'next/link';
import { usePathname } from 'next/navigation';
import classnames from 'classnames';

import { AiFillBug } from 'react-icons/ai';
const NavBar = () => {
    const currentPath = usePathname()
    const links = [
        {label:'Dashboard', href:"/"},
        {label:'Issues', href:"/issues"}
    ]

  return (
    <nav className='flex border-b space-x-6 px-5 h-14 items-center mb-5'>
        <div ><AiFillBug/></div>
        <ul className='flex space-x-6'>
           {
            links.map((link)=>(
                <Link key={link.href} href={link.href} className={
                    classnames(
                        {
                            'text-zinc-900':currentPath === link.href,
                            'text-zinc-500':link.href !== currentPath,
                            'hover:text-zinc-800 transition-colors':true

                        }
                    )
                } >
                    {link.label}
                </Link>
            ))
           }
        </ul>
    
    </nav>
  )
}

export default NavBar