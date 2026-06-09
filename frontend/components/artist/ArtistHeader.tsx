'use client'

import Image from 'next/image'
import { formatPlayCount, getImageUrl } from '@/lib/utils'
import { useFollowButton } from '@/hooks/useFollowButton'
import { cn } from '@/lib/utils'
import type { Artist } from '@/types'

interface ArtistHeaderProps {
  artist: Artist
}

export function ArtistHeader({ artist }: ArtistHeaderProps) {
  const { isFollowing, toggle, isLoading } = useFollowButton(artist)
  const imgUrl = getImageUrl(artist.image, '500x500')

  return (
    <div className="relative">
      {/* hero image */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden">
        <Image src={imgUrl} alt={artist.name} fill sizes="100vw" className="object-cover object-top" priority />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-background" />
      </div>

      {/* artist info */}
      <div className="px-6 pb-8 -mt-16 relative z-10">
        <h1 className="text-4xl sm:text-6xl font-black text-white mb-3">{artist.name}</h1>

        <div className="flex items-center gap-4 flex-wrap">
          {artist.followerCount && (
            <span className="text-sm text-muted">
              {formatPlayCount(artist.followerCount)} followers
            </span>
          )}
          <button
            onClick={toggle}
            disabled={isLoading}
            className={cn(
              'px-6 py-1.5 rounded-full border text-sm font-semibold transition-colors',
              isFollowing
                ? 'border-muted text-muted hover:border-white hover:text-white'
                : 'border-white text-white hover:border-accent hover:text-accent',
            )}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        </div>
      </div>
    </div>
  )
}
