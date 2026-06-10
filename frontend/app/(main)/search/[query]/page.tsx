'use client'

import { useEffect, useState } from 'react'
import { TrackList } from '@/components/music/TrackList'
import { AlbumCard } from '@/components/music/AlbumCard'
import { ArtistCard } from '@/components/music/ArtistCard'
import { Skeleton } from '@/components/ui/skeleton'
import type { Song, Album, Artist } from '@/types'

interface SearchData {
  songs: Song[]
  albums: Album[]
  artists: Artist[]
}

function normalize(item: Record<string, unknown>) {
  return { ...item, name: item.name ?? item.title }
}

export default function SearchResultsPage({ params }: { params: { query: string } }) {
  const query = decodeURIComponent(params.query)
  const [data, setData] = useState<SearchData>({ songs: [], albums: [], artists: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)

    fetch(`/api/search/all?query=${encodeURIComponent(query)}&limit=20`)
      .then((r) => r.json())
      .then((res) => {
        const d = res.data ?? res
        setData({
          songs:   (d.songs?.results   ?? []).map(normalize) as Song[],
          albums:  (d.albums?.results  ?? []).map(normalize) as Album[],
          artists: (d.artists?.results ?? []).map(normalize) as Artist[],
        })
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [query])

  const hasResults = data.songs.length > 0 || data.albums.length > 0 || data.artists.length > 0

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold px-6 mb-6 text-white">
        Results for <span className="text-muted">&quot;{query}&quot;</span>
      </h1>

      {loading && (
        <div className="px-6 space-y-8">
          {[1, 2].map((i) => (
            <div key={i}>
              <Skeleton className="h-5 w-32 mb-4 bg-elevated" />
              <div className="flex gap-4">
                {[1,2,3,4,5].map((j) => (
                  <div key={j} className="w-[160px] space-y-2 shrink-0">
                    <Skeleton className="aspect-square w-full rounded bg-elevated" />
                    <Skeleton className="h-4 w-3/4 bg-elevated" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="px-6 py-12 text-center">
          <p className="text-muted">something went wrong — check your connection</p>
        </div>
      )}

      {!loading && !error && !hasResults && (
        <div className="px-6 py-12 text-center">
          <p className="text-muted text-lg">no results for &quot;{query}&quot;</p>
          <p className="text-sm text-subtle mt-1">try a different spelling or keyword</p>
        </div>
      )}

      {!loading && !error && data.songs.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white px-6 mb-3">Songs</h2>
          <TrackList songs={data.songs} showAlbum />
        </section>
      )}

      {!loading && !error && data.albums.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white px-6 mb-3">Albums</h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-2">
            {data.albums.map((a) => <AlbumCard key={a.id} album={a} />)}
          </div>
        </section>
      )}

      {!loading && !error && data.artists.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-white px-6 mb-3">Artists</h2>
          <div className="flex gap-4 overflow-x-auto px-6 pb-2">
            {data.artists.map((a) => <ArtistCard key={a.id} artist={a} />)}
          </div>
        </section>
      )}
    </div>
  )
}
