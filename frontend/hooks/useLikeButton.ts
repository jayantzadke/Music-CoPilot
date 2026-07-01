'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { apiClient } from '@/lib/api'
import { getImageUrl } from '@/lib/utils'
import type { Song } from '@/types'

export function useLikeButton(song: Song) {
  const user  = useAuthStore((s) => s.user)
  const { isLiked, toggleLike } = useLibraryStore()
  const [isLoading, setIsLoading] = useState(false)

  const liked = song?.id ? isLiked(song.id) : false

  const toggle = async () => {
    if (!song?.id) return

    if (!user) {
      // guest — localStorage only
      toggleLike(song)
      return
    }

    // optimistic update first so UI feels instant
    toggleLike(song)
    setIsLoading(true)

    try {
      if (liked) {
        await apiClient.library.unlikeSong(song.id)
      } else {
        const songName    = song.name ?? (song as unknown as Record<string, unknown>).title as string ?? 'Unknown'
        const songArtists = song.primaryArtists || 
          song.artists?.primary?.map((a: {name: string}) => a.name).join(', ') || 
          'Unknown Artist'
        await apiClient.library.likeSong({
          songId:      song.id,
          songName,
          songImage:   getImageUrl(song.image, '150x150') || null,
          songArtists,
          songDuration: song.duration ?? 0,
          albumId:     song.album?.id ?? null,
        })
      }
    } catch (err) {
      // revert optimistic update on failure
      toggleLike(song)
      const msg = err instanceof Error ? err.message : 'failed to update like'
      toast.error(msg)
    } finally {
      setIsLoading(false)
    }
  }

  return { isLiked: liked, toggle, isLoading }
}
