import crypto from 'crypto'
import { ExternalAPIError } from '@errors/index.js'
import { CacheService } from './cache.js'
import { env } from '@config/env.js'

const SEARCH_TTL = 300
const SONG_TTL = 3600
const ALBUM_TTL = 3600
const ARTIST_TTL = 1800
const MODULES_TTL = 900
const LYRICS_TTL = 3600

function hashPath(path: string): string {
  return crypto.createHash('md5').update(path).digest('hex')
}

export class MusicApiService {
  constructor(private cache: CacheService) {}

  async getModules(languages = 'hindi') {
    return this.cachedFetch(`/api/modules?languages=${encodeURIComponent(languages)}`, MODULES_TTL)
  }

  async searchAll(query: string, page = 1, limit = 20) {
    return this.cachedFetch(
      `/api/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      SEARCH_TTL,
    )
  }

  async searchSongs(query: string, page = 1, limit = 20) {
    return this.cachedFetch(
      `/api/search/songs?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      SEARCH_TTL,
    )
  }

  async searchAlbums(query: string, page = 1, limit = 10) {
    return this.cachedFetch(
      `/api/search/albums?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      SEARCH_TTL,
    )
  }

  async searchArtists(query: string, page = 1, limit = 10) {
    return this.cachedFetch(
      `/api/search/artists?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      SEARCH_TTL,
    )
  }

  // playlist search not confirmed on saavn.sumit.co — falling back to general search
  async searchPlaylists(query: string, page = 1, limit = 10) {
    return this.cachedFetch(
      `/api/search?query=${encodeURIComponent(query)}&page=${page}&limit=${limit}`,
      SEARCH_TTL,
    )
  }

  async getSong(id: string) {
    const data = await this.cachedFetch<unknown[]>(`/api/songs?ids=${id}`, SONG_TTL)
    return Array.isArray(data) ? data[0] : data
  }

  async getSongBatch(ids: string[]) {
    return this.cachedFetch<unknown[]>(`/api/songs?ids=${ids.join(',')}`, SONG_TTL)
  }

  // no confirmed replacement for suggestions on the new host
  async getSongSuggestions(_id: string, _limit = 10): Promise<never[]> {
    return []
  }

  async getAlbum(id: string) {
    return this.cachedFetch(`/api/albums?id=${id}`, ALBUM_TTL)
  }

  async getArtist(id: string) {
    return this.cachedFetch<Record<string, unknown>>(`/api/artists?id=${id}`, ARTIST_TTL)
  }

  // top songs/albums live inside the artist payload, no separate endpoint
  async getArtistSongs(id: string, _page = 1) {
    const artist = await this.getArtist(id)
    return (artist?.topSongs ?? []) as unknown[]
  }

  async getArtistAlbums(id: string, _page = 1) {
    const artist = await this.getArtist(id)
    return (artist?.topAlbums ?? []) as unknown[]
  }

  async getPlaylist(id: string) {
    return this.cachedFetch(`/api/playlists?id=${id}`, ALBUM_TTL)
  }

  async getLyrics(id: string) {
    return this.cachedFetch(`/api/lyrics?id=${id}`, LYRICS_TTL)
  }

  private async cachedFetch<T = unknown>(path: string, ttl: number): Promise<T> {
    const key = `api_cache:${hashPath(path)}`

    try {
      const cached = await this.cache.get<T>(key)
      if (cached) return cached
    } catch {
      // redis unavailable, go direct
    }

    const url = `${env.MUSIC_API_URL}${path}`

    let response: Response
    try {
      response = await fetch(url)
    } catch (err) {
      throw new ExternalAPIError(`music api request failed for ${path}: ${String(err)}`)
    }

    if (!response.ok) {
      throw new ExternalAPIError(`music api returned ${response.status} for ${path}`)
    }

    const json = (await response.json()) as { data?: T } | T
    const data = (json as { data?: T }).data !== undefined
      ? (json as { data: T }).data
      : (json as T)

    try {
      await this.cache.set(key, data, ttl)
    } catch {
      // redis unavailable, skip caching
    }

    return data
  }
}
