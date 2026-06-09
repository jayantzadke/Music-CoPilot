import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl } from '@/lib/utils'
import type { JioSaavnPlaylist } from '@/types'

interface PlaylistCardProps {
  playlist: JioSaavnPlaylist
}

export function PlaylistCard({ playlist }: PlaylistCardProps) {
  const imgUrl = getImageUrl(playlist.image, '150x150')

  return (
    <Link
      href={`/playlist/${playlist.id}`}
      className="group flex flex-col gap-2 p-3 rounded-md bg-surface hover:bg-surface-elevated cursor-pointer transition-colors w-[160px] shrink-0"
    >
      <div className="relative aspect-square w-full rounded overflow-hidden">
        <Image
          src={imgUrl}
          alt={playlist.name}
          fill
          sizes="160px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{playlist.name}</p>
        <p className="text-xs text-muted">{playlist.songCount} songs</p>
      </div>
    </Link>
  )
}
