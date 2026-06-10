'use client'

import Image from 'next/image'
import { Play, Pause, Heart, Loader2 } from 'lucide-react'
import { useState } from 'react'
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

export function SongRow({ song, index, queue, showAlbum = false }: SongRowProps) {
  const { playSong, currentSong, isPlaying, togglePlay } = usePlayerStore()
  const { isLiked, toggle: toggleLike } = useLikeButton(song)
  const [loading, setLoading] = useState(false)
  const active = currentSong?.id === song.id
  const imgUrl = getImageUrl(song.image, '50x50')
  const displayName = song.name ?? (song as unknown as Record<string, string>).title ?? ''
  const albumName = typeof song.album === 'string' ? song.album : song.album?.name ?? ''

  const handlePlay = async () => {
    if (loading) return
    if (active) { togglePlay(); return }
    setLoading(true)
    const playable = await resolvePlayableSong(song)
    playSong(playable, queue ?? [playable])
    setLoading(false)
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
      <div className="flex items-center justify-center w-4 text-sm text-muted">
        <span className={cn('group-hover:hidden', active && isPlaying ? 'hidden' : 'block')}>
          {index + 1}
        </span>
        <button
          onClick={handlePlay}
          className={cn('hidden group-hover:block', active && isPlaying ? '!block' : '')}
          aria-label={active && isPlaying ? 'Pause' : 'Play'}
        >
          {loading ? (
            <Loader2 size={14} className="animate-spin text-white" />
          ) : active && isPlaying ? (
            <Pause size={14} fill="currentColor" className="text-white" />
          ) : (
            <Play size={14} fill="currentColor" className="text-white" />
          )}
        </button>
      </div>

      <div className="flex items-center gap-3 min-w-0">
        <div className="relative w-10 h-10 rounded overflow-hidden shrink-0">
          <Image src={imgUrl} alt={displayName} fill sizes="40px" className="object-cover" />
        </div>
        <div className="min-w-0">
          <p className={cn('text-sm font-medium truncate', active ? 'text-accent' : 'text-white')}>
            {displayName}
          </p>
          <p className="text-xs text-muted truncate">{song.primaryArtists}</p>
        </div>
      </div>

      {showAlbum && (
        <p className="text-sm text-muted truncate hidden lg:block">{albumName}</p>
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
