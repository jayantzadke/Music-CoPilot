'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, Heart } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'

export function MobileNav() {
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const links = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/search', label: 'Search', icon: Search },
    ...(user ? [{ href: '/library', label: 'Liked', icon: Heart }] : []),
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-center justify-around px-2 h-16">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            'flex flex-col items-center gap-0.5 py-2 px-4 transition-colors',
            pathname === href ? 'text-accent' : 'text-muted',
          )}
        >
          <Icon size={22} />
          <span className="text-[10px] font-medium">{label}</span>
        </Link>
      ))}
    </nav>
  )
}
