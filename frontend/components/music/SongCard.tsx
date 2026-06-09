'use client'

import Image from 'next/image'
import { Play } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'
import type { Song } from '@/types'

interface SongCardProps {
  song: Song
  queue?: Song[]
}

export function SongCard({ song, queue }: SongCardProps) {
  const { playSong, currentSong, isPlaying } = usePlayerStore()
  const active = currentSong?.id === song.id
  const imgUrl = getImageUrl(song.image, '150x150')

  return (
    <div
      className={cn(
        'group relative flex flex-col gap-2 p-3 rounded-md bg-surface hover:bg-surface-elevated cursor-pointer transition-colors',
        'w-[160px] shrink-0',
      )}
      onClick={() => playSong(song, queue)}
      role="button"
      aria-label={`Play ${song.name}`}
    >
      <div className="relative aspect-square w-full rounded overflow-hidden">
        <Image src={imgUrl} alt={song.name} fill sizes="160px" className="object-cover" />
        <div className={cn(
          'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity',
          active && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}>
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shadow-lg">
            <Play size={16} fill="black" className="ml-0.5 text-black" />
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <p className={cn('text-sm font-medium truncate', active ? 'text-accent' : 'text-white')}>
          {song.name}
        </p>
        <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
      </div>
    </div>
  )
}
