import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl } from '@/lib/utils'
import type { Album } from '@/types'

interface AlbumCardProps {
  album: Album
}

export function AlbumCard({ album }: AlbumCardProps) {
  const imgUrl = getImageUrl(album.image, '150x150')
  const year = album.year

  return (
    <Link
      href={`/album/${album.id}`}
      className="group flex flex-col gap-2 p-3 rounded-md bg-surface hover:bg-surface-elevated cursor-pointer transition-colors w-[160px] shrink-0"
    >
      <div className="relative aspect-square w-full rounded overflow-hidden">
        <Image
          src={imgUrl}
          alt={album.name}
          fill
          sizes="160px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-white truncate">{album.name}</p>
        <p className="text-xs text-muted truncate">
          {year} · {album.artists?.primary?.[0]?.name ?? (album as Record<string, unknown>).artist as string ?? 'Various Artists'}
        </p>
      </div>
    </Link>
  )
}
