import { notFound } from 'next/navigation'
import { ArtistHeader } from '@/components/artist/ArtistHeader'
import { TrackList } from '@/components/music/TrackList'
import { AlbumCard } from '@/components/music/AlbumCard'
import type { Artist, Album, Song } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002'

async function getArtistData(id: string) {
  try {
    const [artistRes, albumsRes] = await Promise.all([
      fetch(`${API}/api/music/artists/${id}`, { next: { revalidate: 1800 } }),
      fetch(`${API}/api/music/artists/${id}/albums`, { next: { revalidate: 1800 } }),
    ])
    if (!artistRes.ok) return null

    const artistData = await artistRes.json()
    const albumsData = albumsRes.ok ? await albumsRes.json() : { data: [] }

    return {
      artist: (artistData.data ?? artistData) as Artist,
      albums: (albumsData.data?.results ?? []) as Album[],
    }
  } catch {
    return null
  }
}

interface PageProps {
  params: { id: string }
}

export default async function ArtistPage({ params }: PageProps) {
  const result = await getArtistData(params.id)
  if (!result) notFound()

  const { artist, albums } = result
  const topSongs: Song[] = artist.topSongs?.slice(0, 5) ?? []

  return (
    <div>
      <ArtistHeader artist={artist} />

      <div className="px-6 pb-8">
        {topSongs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Popular</h2>
            <TrackList songs={topSongs} />
          </section>
        )}

        {albums.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-white mb-4">Discography</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {albums.map((a) => <AlbumCard key={a.id} album={a} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
