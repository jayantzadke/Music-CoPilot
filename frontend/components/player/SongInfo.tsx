'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { cn, getImageUrl } from '@/lib/utils'
import { useLikeButton } from '@/hooks/useLikeButton'
import { usePlayerStore } from '@/stores/playerStore'
import type { Song } from '@/types'

export function SongInfo() {
  const currentSong = usePlayerStore((s) => s.currentSong)
  const { isLiked, toggle } = useLikeButton(currentSong ?? ({} as Song))

  if (!currentSong) return <div className="w-[30%] min-w-0" />
  const imgUrl = getImageUrl(currentSong.image, '150x150')
  const isLongName = currentSong.name.length > 30

  return (
    <div className="flex items-center gap-3 w-[30%] min-w-0">
      <div className="relative shrink-0 w-14 h-14 rounded overflow-hidden">
        <Image src={imgUrl} alt={currentSong.name} fill sizes="56px" className="object-cover" />
      </div>

      <div className="min-w-0 flex-1">
        <div className={cn('text-sm font-medium text-white', isLongName && 'marquee-container')}>
          <span className={cn(isLongName && 'marquee-text')}>
            {isLongName ? `${currentSong.name}    ${currentSong.name}` : currentSong.name}
          </span>
        </div>
        <Link
          href={`/album/${currentSong.album.id}`}
          className="text-xs text-muted hover:text-white transition-colors line-clamp-1"
        >
          {currentSong.primaryArtists}
        </Link>
      </div>

      <button
        onClick={toggle}
        className={cn('shrink-0 transition-colors', isLiked ? 'text-accent' : 'text-muted hover:text-white')}
        aria-label={isLiked ? 'Unlike' : 'Like'}
      >
        <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}
