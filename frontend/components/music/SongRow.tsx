'use client'

import Image from 'next/image'
import { Play, Pause, Heart } from 'lucide-react'
import { cn, getImageUrl, formatDuration } from '@/lib/utils'
import { usePlayerStore } from '@/stores/playerStore'
import { useLikeButton } from '@/hooks/useLikeButton'
import type { Song } from '@/types'

interface SongRowProps {
  song: Song
  index: number
  queue?: Song[]
  showAlbum?: boolean
}

export function SongRow({ song, index, queue, showAlbum = false }: SongRowProps) {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore()
  const { isLiked, toggle: toggleLike } = useLikeButton(song)
  const active = currentSong?.id === song.id
  const imgUrl = getImageUrl(song.image, '50x50')

  const handlePlay = () => {
    if (active) {
      togglePlay()
    } else {
      playSong(song, queue)
    }
  }

  return (
    <div
      className={cn(
        'group grid items-center gap-4 px-4 py-2 rounded-md cursor-default',
        'hover:bg-surface-hover transition-colors',
        showAlbum ? 'grid-cols-[16px_1fr_1fr_auto]' : 'grid-cols-[16px_1fr_auto]',
      )}
      role="row"
      aria-selected={active}
    >
      {/* index / play button */}
      <div className="flex items-center justify-center w-4 text-sm text-muted">
        <span className={cn('group-hover:hidden', active && isPlaying ? 'hidden' : 'block')}>
          {index + 1}
        </span>
        <button
          onClick={handlePlay}
          className={cn('hidden group-hover:block', active && isPlaying ? '!block' : '')}
          aria-label={active && isPlaying ? 'Pause' : 'Play'}
        >
          {active && isPlaying
            ? <Pause size={14} fill="currentColor" className="text-white" />
            : <Play size={14} fill="currentColor" className="text-white" />
          }
        </button>
      </div>

      {/* title + artist */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
          <Image src={imgUrl} alt={song.name} fill sizes="40px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium truncate', active ? 'text-accent' : 'text-white')}>
            {song.name}
          </p>
          <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
        </div>
      </div>

      {/* album (optional) */}
      {showAlbum && (
        <p className="text-sm text-muted truncate hidden lg:block">{song.album.name}</p>
      )}

      {/* duration + like */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLike}
          className={cn(
            'transition-colors opacity-0 group-hover:opacity-100',
            isLiked ? 'opacity-100 text-accent' : 'text-muted hover:text-white',
          )}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <Heart size={14} fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        <span className="text-sm text-muted tabular-nums w-10 text-right">
          {formatDuration(song.duration)}
        </span>
      </div>
    </div>
  )
}
