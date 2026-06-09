import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl } from '@/lib/utils'
import type { Artist } from '@/types'

interface ArtistCardProps {
  artist: Artist
}

export function ArtistCard({ artist }: ArtistCardProps) {
  const imgUrl = getImageUrl(artist.image, '150x150')

  return (
    <Link
      href={`/artist/${artist.id}`}
      className="group flex flex-col gap-2 p-3 rounded-md bg-surface hover:bg-surface-elevated cursor-pointer transition-colors w-[160px] shrink-0"
    >
      <div className="relative aspect-square w-full rounded-full overflow-hidden">
        <Image
          src={imgUrl}
          alt={artist.name}
          fill
          sizes="160px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="min-w-0 text-center">
        <p className="text-sm font-medium text-white truncate">{artist.name}</p>
        <p className="text-xs text-muted">Artist</p>
      </div>
    </Link>
  )
}
