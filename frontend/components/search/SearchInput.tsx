'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Image from 'next/image'
import { useSearch } from '@/hooks/useSearch'
import { getImageUrl } from '@/lib/utils'
import type { Song } from '@/types'

export function SearchInput() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { results } = useSearch(query)

  const topSongs: Song[] = results?.data?.songs?.results?.slice(0, 5) ?? []

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search/${encodeURIComponent(query.trim())}`)
      setOpen(false)
    }
  }

  const handleSelect = (song: Song) => {
    router.push(`/search/${encodeURIComponent(song.name)}`)
    setOpen(false)
    setQuery('')
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [])

  return (
    <div className="relative">
      <form onSubmit={handleSubmit}>
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3 text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            placeholder="What do you want to play?"
            className="w-full pl-9 pr-8 py-2 bg-[#2a2a2a] rounded-full text-sm text-white placeholder:text-muted outline-none focus:ring-2 focus:ring-white/20 w-[260px] lg:w-[360px]"
            aria-label="Search"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setOpen(false) }}
              className="absolute right-3 text-muted hover:text-white"
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </form>

      {/* suggestions dropdown */}
      {open && query.length >= 2 && topSongs.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 bg-[#282828] rounded-lg shadow-xl overflow-hidden z-50 border border-border">
          {topSongs.map((song) => (
            <button
              key={song.id}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-hover text-left transition-colors"
              onClick={() => handleSelect(song)}
            >
              <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
                <Image src={getImageUrl(song.image, '50x50')} alt={song.name} fill sizes="40px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{song.name}</p>
                <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
