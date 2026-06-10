'use client'

import Image from 'next/image'
import { Play, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { cn, getImageUrl } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'
import type { Song } from '@/types'

interface SongCardProps {
  song: Song
  queue?: Song[]
}

// fetches full song detail if downloadUrl is missing (search results dont have it)
async function resolvePlayableSong(song: Song): Promise<Song> {
  if (song.downloadUrl?.length) return song
  try {
    const res = await fetch(`/api/music/songs/${song.id}`)
    if (!res.ok) return song
    const data = await res.json()
    return (data.data ?? data) as Song
  } catch {
    return song
  }
}

export function SongCard({ song, queue }: SongCardProps) {
  const { playSong, currentSong, isPlaying } = usePlayerStore()
  const [loading, setLoading] = useState(false)
  const active = currentSong?.id === song.id
  // handle both `name` (full song) and `title` (search result)
  const displayName = song.name ?? (song as unknown as Record<string, string>).title ?? ''
  const imgUrl = getImageUrl(song.image, '150x150')

  const handlePlay = async () => {
    if (loading) return
    setLoading(true)
    const playable = await resolvePlayableSong(song)
    const resolvedQueue = queue?.map ? queue : [playable]
    playSong(playable, resolvedQueue)
    setLoading(false)
  }

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 p-3 rounded-md bg-surface hover:bg-surface-elevated cursor-pointer transition-colors',
        'w-[160px] shrink-0',
      )}
      onClick={handlePlay}
      role="button"
      aria-label={`Play ${displayName}`}
    >
      <div className="relative aspect-square w-full rounded overflow-hidden">
        <Image src={imgUrl} alt={displayName} fill sizes="160px" className="object-cover" />
        <div className={cn(
          'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity',
          active && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
            {loading
              ? <Loader2 size={16} className="animate-spin text-black" />
              : <Play size={16} fill="black" className="ml-0.5 text-black" />
            }
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <p className={cn('text-sm font-medium truncate', active ? 'text-accent' : 'text-white')}>
          {displayName}
        </p>
        <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
      </div>
    </div>
  )
}
