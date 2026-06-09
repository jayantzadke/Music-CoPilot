import { notFound } from 'next/navigation'
import { AlbumHeader } from '@/components/album/AlbumHeader'
import { TrackList } from '@/components/music/TrackList'
import type { Album } from '@/types'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

async function getAlbum(id: string): Promise<Album | null> {
  try {
    const res = await fetch(`${API}/api/music/albums/${id}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const data = await res.json()
    return data.data ?? data
  } catch {
    return null
  }
}

interface PageProps {
  params: { id: string }
}

export default async function AlbumPage({ params }: PageProps) {
  const album = await getAlbum(params.id)
  if (!album) notFound()

  return (
    <div>
      <AlbumHeader album={album} />

      <div className="px-6 mt-4">
        {/* column headers */}
        <div className="grid grid-cols-[16px_1fr_1fr_auto] items-center gap-4 px-4 py-2 text-xs text-muted uppercase border-b border-border mb-2">
          <span>#</span>
          <span>Title</span>
          <span className="hidden lg:block">Album</span>
          <span>Duration</span>
        </div>
        <TrackList songs={album.songs} showAlbum />
      </div>
    </div>
  )
}
