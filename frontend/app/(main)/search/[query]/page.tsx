import { TrackList } from '@/components/music/TrackList'
import { AlbumCard } from '@/components/music/AlbumCard'
import { ArtistCard } from '@/components/music/ArtistCard'
import type { Song, Album, Artist } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function searchAll(query: string) {
  try {
    const res = await fetch(`${API}/api/search/all?query=${encodeURIComponent(query)}&page=1&limit=10`, {
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

interface PageProps {
  params: { query: string }
}

export default async function SearchResultsPage({ params }: PageProps) {
  const query = decodeURIComponent(params.query)
  const results = await searchAll(query)

  const songs: Song[] = results?.data?.songs?.results ?? []
  const albums: Album[] = results?.data?.albums?.results ?? []
  const artists: Artist[] = results?.data?.artists?.results ?? []

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold px-6 mb-6">
        Results for <span className="text-white">&quot;{query}&quot;</span>
      </h1>

      {songs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white px-6 mb-3">Songs</h2>
          <TrackList songs={songs} showAlbum />
        </section>
      )}

      {albums.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white px-6 mb-3">Albums</h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-2">
            {albums.map((a) => <AlbumCard key={a.id} album={a} />)}
          </div>
        </section>
      )}

      {artists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white px-6 mb-3">Artists</h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-2">
            {artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </section>
      )}

      {songs.length === 0 && albums.length === 0 && artists.length === 0 && (
        <div className="px-6 py-12 text-center">
          <p className="text-muted">no results found for &quot;{query}&quot;</p>
          <p className="text-sm text-muted mt-1">try different keywords</p>
        </div>
      )}
    </div>
  )
}
