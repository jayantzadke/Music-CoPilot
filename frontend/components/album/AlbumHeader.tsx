'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Play, Shuffle } from 'lucide-react'
import { formatDuration, getImageUrl } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'
import type { Album } from '@/types'

interface AlbumHeaderProps {
  album: Album
}

export function AlbumHeader({ album }: AlbumHeaderProps) {
  const { playQueue } = usePlayerStore()
  const imgUrl = getImageUrl(album.image, '500x500')
  const totalDuration = album.songs.reduce((sum, s) => sum + s.duration, 0)

  return (
    <div className="flex flex-col sm:flex-row items-end gap-6 px-6 pt-6 pb-8 bg-gradient-to-b from-surface-elevated to-background">
      <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded shadow-2xl shrink-0 overflow-hidden">
        <Image src={imgUrl} alt={album.name} fill sizes="224px" className="object-cover" priority />
      </div>

      <div className="flex flex-col gap-3 min-w-0">
        <p className="text-xs font-semibold uppercase text-muted">Album</p>
        <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight">{album.name}</h1>

        <div className="flex items-center gap-1 text-sm text-muted flex-wrap">
          {album.artists.primary.map((a, i) => (
            <span key={a.id}>
              {i > 0 && <span className="mx-1">·</span>}
              <Link href={`/artist/${a.id}`} className="hover:text-white transition-colors font-medium text-white">
                {a.name}
              </Link>
            </span>
          ))}
          <span className="mx-1">·</span>
          <span>{album.year}</span>
          <span className="mx-1">·</span>
          <span>{album.songs.length} songs</span>
          <span className="mx-1">·</span>
          <span>{formatDuration(totalDuration)}</span>
        </div>

        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => playQueue(album.songs, 0)}
            className="w-14 h-14 rounded-full bg-accent flex items-center justify-center hover:bg-accent-hover hover:scale-105 transition-all shadow-lg"
            aria-label="Play album"
          >
            <Play size={20} fill="black" className="text-black ml-1" />
          </button>
          <button
            onClick={() => {
              const shuffled = [...album.songs].sort(() => Math.random() - 0.5)
              playQueue(shuffled, 0)
            }}
            className="text-muted hover:text-white transition-colors"
            aria-label="Shuffle play"
          >
            <Shuffle size={22} />
          </button>
        </div>
      </div>
    </div>
  )
}
