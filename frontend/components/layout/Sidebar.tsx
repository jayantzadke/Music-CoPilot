'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Home, Search, Music, LogOut, User, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-[72px] lg:w-[240px] shrink-0 bg-black h-full py-6 pb-[100px] gap-2 overflow-y-auto">
      {/* logo */}
      <div className="px-6 mb-4 hidden lg:flex items-center gap-2">
        <Music className="text-accent" size={28} />
        <span className="font-bold text-lg tracking-tight">Music-CoPilot</span>
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
              pathname === href ? 'text-white bg-elevated' : 'text-muted',
            )}
          >
            <Icon size={20} />
            <span className="hidden lg:block">{label}</span>
          </Link>
        ))}

        {/* liked songs shortcut */}
        {user && (
          <Link
            href="/library"
            className={cn(
              'flex items-center gap-4 px-4 py-3 rounded-md text-sm font-medium transition-colors',
              'hover:text-white',
              pathname === '/library' ? 'text-white bg-elevated' : 'text-muted',
            )}
          >
            <Heart size={20} />
            <span className="hidden lg:block">Liked Songs</span>
          </Link>
        )}
      </nav>

      {/* spacer */}
      <div className="flex-1" />

      {/* user section at bottom */}
      <div className="px-2">
        {user ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-black text-xs font-bold">
                  {user.displayName?.[0]?.toUpperCase() ?? 'U'}
                </span>
              </div>
              <div className="hidden lg:block min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.displayName}</p>
                <p className="text-xs text-muted truncate">{user.email}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-4 px-4 py-2 rounded-md text-sm text-muted hover:text-white transition-colors w-full"
            >
              <LogOut size={18} />
              <span className="hidden lg:block">Log out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-4 px-4 py-3 rounded-md text-sm text-muted hover:text-white transition-colors"
          >
            <User size={20} />
            <span className="hidden lg:block">Log in</span>
          </Link>
        )}
      </div>
    </aside>
  )
}
