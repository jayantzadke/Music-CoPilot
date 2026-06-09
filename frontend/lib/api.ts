import { useAuthStore } from '@/stores/authStore'

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

// central fetch wrapper — injects auth header, handles 401 with one refresh retry
async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers, credentials: 'include' })

  if (res.status === 401 && retry) {
    // try to refresh once then retry
    await useAuthStore.getState().refreshToken()
    return request<T>(path, options, false)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }))
    throw Object.assign(new Error(err.message ?? 'request failed'), { statusCode: res.status, code: err.code })
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

const get = <T>(path: string) => request<T>(path)
const post = <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined })
const patch = <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined })
const del = <T>(path: string) => request<T>(path, { method: 'DELETE' })

export const apiClient = {
  auth: {
    login:          (email: string, password: string) => post('/api/auth/login', { email, password }),
    register:       (email: string, password: string, displayName: string) => post('/api/auth/register', { email, password, displayName }),
    logout:         () => post('/api/auth/logout'),
    me:             () => get('/api/auth/me'),
    refresh:        () => post('/api/auth/refresh'),
    updateProfile:  (data: Record<string, unknown>) => patch('/api/auth/me', data),
    changePassword: (currentPassword: string, newPassword: string) => post('/api/auth/change-password', { currentPassword, newPassword }),
  },

  search: {
    all:       (query: string, page = 1) => get(`/api/search/all?query=${encodeURIComponent(query)}&page=${page}`),
    songs:     (query: string, page = 1) => get(`/api/search/songs?query=${encodeURIComponent(query)}&page=${page}`),
    albums:    (query: string, page = 1) => get(`/api/search/albums?query=${encodeURIComponent(query)}&page=${page}`),
    artists:   (query: string, page = 1) => get(`/api/search/artists?query=${encodeURIComponent(query)}&page=${page}`),
    playlists: (query: string, page = 1) => get(`/api/search/playlists?query=${encodeURIComponent(query)}&page=${page}`),
  },

  music: {
    song:            (id: string) => get(`/api/music/songs/${id}`),
    songSuggestions: (id: string, limit = 10) => get(`/api/music/songs/${id}/suggestions?limit=${limit}`),
    album:           (id: string) => get(`/api/music/albums/${id}`),
    artist:          (id: string) => get(`/api/music/artists/${id}`),
    artistSongs:     (id: string, page = 1) => get(`/api/music/artists/${id}/songs?page=${page}`),
    artistAlbums:    (id: string, page = 1) => get(`/api/music/artists/${id}/albums?page=${page}`),
    playlist:        (id: string) => get(`/api/music/playlists/${id}`),
    modules:         (languages = 'hindi') => get(`/api/music/modules?languages=${languages}`),
  },

  playlists: {
    list:       (page = 1) => get(`/api/playlists?page=${page}`),
    create:     (data: { name: string; description?: string; isPublic?: boolean }) => post('/api/playlists', data),
    get:        (id: string) => get(`/api/playlists/${id}`),
    update:     (id: string, data: Record<string, unknown>) => patch(`/api/playlists/${id}`, data),
    delete:     (id: string) => del(`/api/playlists/${id}`),
    addSong:    (id: string, song: Record<string, unknown>) => post(`/api/playlists/${id}/songs`, song),
    removeSong: (id: string, songId: string) => del(`/api/playlists/${id}/songs/${songId}`),
    reorder:    (id: string, songId: string, newPosition: number) => patch(`/api/playlists/${id}/songs/reorder`, { songId, newPosition }),
  },

  library: {
    liked:          (page = 1) => get(`/api/library/liked?page=${page}`),
    likeSong:       (data: Record<string, unknown>) => post('/api/library/liked', data),
    unlikeSong:     (songId: string) => del(`/api/library/liked/${songId}`),
    isLiked:        (songId: string) => get(`/api/library/liked/${songId}`),
    history:        (page = 1) => get(`/api/library/history?page=${page}`),
    addHistory:     (data: Record<string, unknown>) => post('/api/library/history', data),
    clearHistory:   () => del('/api/library/history'),
    followedArtists:(page = 1) => get(`/api/library/artists?page=${page}`),
    followArtist:   (data: Record<string, unknown>) => post('/api/library/artists', data),
    unfollowArtist: (artistId: string) => del(`/api/library/artists/${artistId}`),
    isFollowing:    (artistId: string) => get(`/api/library/artists/${artistId}`),
  },
}
