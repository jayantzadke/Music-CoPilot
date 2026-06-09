import { SongCard } from '@/components/music/SongCard'
import { AlbumCard } from '@/components/music/AlbumCard'
import { ArtistCard } from '@/components/music/ArtistCard'
import { PlaylistCard } from '@/components/music/PlaylistCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Song, Album, Artist, JioSaavnPlaylist, ContentType } from '@/types'

interface HomeSectionProps {
  title: string
  type: ContentType
  items: Array<Song | Album | Artist | JioSaavnPlaylist>
  isLoading?: boolean
}

export function HomeSection({ title, type, items, isLoading }: HomeSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-white mb-4 px-6">{title}</h2>
      <div className="flex gap-4 overflow-x-auto px-6 pb-2 scrollbar-thin">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="w-[160px] shrink-0 space-y-2">
              <Skeleton className="aspect-square w-full rounded bg-surface-hover" />
              <Skeleton className="h-4 w-3/4 rounded bg-surface-hover" />
              <Skeleton className="h-3 w-1/2 rounded bg-surface-hover" />
            </div>
          ))
        ) : items.length === 0 ? null : (
          items.map((item) => {
            if (type === 'song') return <SongCard key={item.id} song={item as Song} queue={items as Song[]} />
            if (type === 'album') return <AlbumCard key={item.id} album={item as Album} />
            if (type === 'artist') return <ArtistCard key={item.id} artist={item as Artist} />
            if (type === 'playlist') return <PlaylistCard key={item.id} playlist={item as JioSaavnPlaylist} />
            return null
          })
        )}
      </div>
    </section>
  )
}
