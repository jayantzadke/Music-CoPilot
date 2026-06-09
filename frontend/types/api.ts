import type { AudioQuality, Language } from './jiosaavn'

export interface User {
  id: string
  email: string
  displayName: string
  avatarUrl: string | null
  isVerified: boolean
  provider: string
  preferredLang: Language
  audioQuality: AudioQuality
  createdAt: string
  updatedAt: string
}

export interface Playlist {
  id: string
  userId: string
  name: string
  description: string | null
  coverUrl: string | null
  isPublic: boolean
  songCount: number
  totalDuration: number
  createdAt: string
  updatedAt: string
}

export interface PlaylistSong {
  id: string
  playlistId: string
  songId: string
  songName: string
  songImage: string | null
  songArtists: string
  songDuration: number
  position: number
  addedAt: string
  addedBy: string
}

export interface LikedSong {
  id: string
  userId: string
  songId: string
  songName: string
  songImage: string | null
  songArtists: string
  songDuration: number
  albumId: string | null
  likedAt: string
}

export interface PlayHistory {
  id: string
  userId: string
  songId: string
  songName: string
  songImage: string | null
  songArtists: string
  albumId: string | null
  playedAt: string
  playDuration: number | null
  completed: boolean
}

export interface FollowedArtist {
  id: string
  userId: string
  artistId: string
  artistName: string
  artistImage: string | null
  followedAt: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total?: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ApiError {
  statusCode: number
  code: string
  message: string
}
