'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Library, Music } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/library', label: 'Your Library', icon: Library },
]

export function Sidebar() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)
  const { likedSongs } = useLibraryStore()

  return (
    <aside className="hidden md:flex flex-col w-sidebar-sm lg:w-sidebar shrink-0 bg-black h-full py-6 gap-2">
      {/* logo */}
      <div className="px-6 mb-4 hidden lg:flex items-center gap-2">
        <Music className="text-accent" size={28} />
        <span className="font-bold text-lg tracking-tight">Music-Pilot</span>
      </div>
      <div className="px-6 mb-4 flex lg:hidden justify-center">
        <Music className="text-accent" size={28} />
      </div>

      {/* main nav */}
      <nav className="flex flex-col gap-1 px-2">
        {navLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-4 px-4 py-3 rounded-md text-sm font-medium transition-colors',
              'hover:text-white',
              pathname === href ? 'text-white bg-surface-hover' : 'text-muted',
            )}
          >
            <Icon size={20} />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}
      </nav>

      {/* library section */}
      <div className="mt-4 px-2 hidden lg:block">
        <div className="px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
          Library
        </div>
        {user ? (
          <Link
            href="/library"
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-md text-sm transition-colors hover:text-white',
              pathname === '/library' ? 'text-white' : 'text-muted',
            )}
          >
            <span>Liked Songs</span>
            <span className="ml-auto text-xs text-muted">{likedSongs.length}</span>
          </Link>
        ) : (
          <div className="px-4 py-2 text-sm text-muted">
            <Link href="/login" className="text-accent hover:text-accent-hover">
              Sign in
            </Link>{' '}
            to see your library
          </div>
        )}
      </div>
    </aside>
  )
}
