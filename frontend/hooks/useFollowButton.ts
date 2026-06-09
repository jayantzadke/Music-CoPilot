'use client'

import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useLibraryStore } from '@/stores/libraryStore'
import { apiClient } from '@/lib/api'
import type { Artist } from '@/types'

export function useFollowButton(artist: Artist) {
  const user = useAuthStore((s) => s.user)
  const { isFollowing, toggleFollow } = useLibraryStore()
  const [isLoading, setIsLoading] = useState(false)

  const following = isFollowing(artist.id)

  const toggle = async () => {
    if (!user) {
      toggleFollow(artist)
      return
    }

    setIsLoading(true)
    try {
      if (following) {
        await apiClient.library.unfollowArtist(artist.id)
      } else {
        await apiClient.library.followArtist({
          artistId: artist.id,
          artistName: artist.name,
          artistImage: artist.image?.[1]?.url ?? null,
        })
      }
      toggleFollow(artist)
    } catch {
      // silent fail — local state is already updated
    } finally {
      setIsLoading(false)
    }
  }

  return { isFollowing: following, toggle, isLoading }
}
