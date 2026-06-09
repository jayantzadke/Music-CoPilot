# Design Document — Saavn Clone

## Overview

Full-stack music streaming web app. Frontend on Next.js 14 App Router deployed to Vercel. Backend on Fastify 4 / Node.js 20 deployed to Railway. PostgreSQL on Neon via Drizzle ORM. Redis on Upstash via ioredis. Music data from the JioSaavn unofficial API at saavn.sumit.co.

The backend is a strict layered architecture: Routes → Controllers → Services → Repositories. The frontend uses Server Components for initial page loads and Zustand for all client state.

---

## Architecture

```
Browser
  └── Next.js 14 (Vercel)
        ├── Server Components → fetch from Backend API
        ├── Client Components → Zustand stores + SWR/React Query
        └── Next.js API Routes → proxy to Backend (avoids CORS)

Backend (Railway)
  └── Fastify 4
        ├── Auth middleware (JWT verify + Redis blacklist check)
        ├── Routes → Controllers → Services → Repositories
        ├── JioSaavnService (cached proxy to saavn.sumit.co)
        └── Redis (Upstash) — cache + token blacklist

Database (Neon)
  └── PostgreSQL 16 via Drizzle ORM
        └── 8 tables: users, refresh_tokens, playlists, playlist_songs,
            liked_songs, followed_artists, play_history, search_history

External
  └── saavn.sumit.co — music catalogue, stream URLs, metadata
```

---

## Backend

### Folder Structure

```
backend/
├── src/
│   ├── server.ts
│   ├── config/
│   │   ├── env.ts          (zod-validated env)
│   │   └── db.ts           (drizzle + postgres pool)
│   ├── db/
│   │   ├── schema/
│   │   │   ├── users.ts
│   │   │   ├── refresh_tokens.ts
│   │   │   ├── playlists.ts
│   │   │   ├── playlist_songs.ts
│   │   │   ├── liked_songs.ts
│   │   │   ├── followed_artists.ts
│   │   │   ├── play_history.ts
│   │   │   ├── search_history.ts
│   │   │   └── index.ts
│   │   └── migrations/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   └── auth.schema.ts
│   │   ├── users/
│   │   │   ├── users.routes.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── users.schema.ts
│   │   ├── playlists/
│   │   │   ├── playlists.routes.ts
│   │   │   ├── playlists.controller.ts
│   │   │   ├── playlists.service.ts
│   │   │   ├── playlists.repository.ts
│   │   │   └── playlists.schema.ts
│   │   ├── library/
│   │   │   ├── library.routes.ts
│   │   │   ├── library.controller.ts
│   │   │   ├── library.service.ts
│   │   │   ├── library.repository.ts
│   │   │   └── library.schema.ts
│   │   ├── music/
│   │   │   ├── music.routes.ts
│   │   │   └── music.controller.ts
│   │   └── search/
│   │       ├── search.routes.ts
│   │       └── search.controller.ts
│   ├── plugins/
│   │   ├── jwt.ts
│   │   ├── redis.ts
│   │   └── rate-limit.ts
│   ├── middleware/
│   │   ├── authenticate.ts
│   │   └── optional-auth.ts
│   ├── services/
│   │   ├── jiosaavn.ts
│   │   └── cache.ts
│   ├── errors/
│   │   └── index.ts
│   └── utils/
│       ├── pagination.ts
│       └── token.ts
├── drizzle.config.ts
├── Dockerfile
└── package.json
```

### Error Hierarchy

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational = true
  ) { ... }
}

class NotFoundError     extends AppError  // 404 NOT_FOUND
class UnauthorizedError extends AppError  // 401 UNAUTHORIZED
class ForbiddenError    extends AppError  // 403 FORBIDDEN
class ConflictError     extends AppError  // 409 CONFLICT
class ValidationError   extends AppError  // 400 VALIDATION
class ExternalAPIError  extends AppError  // 502 EXTERNAL_API
class TooManyRequestsError extends AppError // 429 RATE_LIMITED
```

### Auth Flow

```
Registration:
  POST /api/auth/register
  → validate with Zod
  → check email unique
  → bcrypt hash password (cost 12)
  → insert user
  → generate access token (JWT, 15min, HS256)
  → generate refresh token (opaque random, hash + store in DB, 30d)
  → set refreshToken httpOnly cookie
  → return { user: SafeUser, accessToken }

Login:
  POST /api/auth/login
  → validate with Zod
  → fetch user by email
  → bcrypt compare
  → same token flow as registration

Token Refresh:
  POST /api/auth/refresh
  → read refreshToken from httpOnly cookie
  → hash and look up in DB
  → check not revoked, not expired
  → rotate: revoke old, issue new refresh token
  → issue new access token
  → return { accessToken }

Logout:
  POST /api/auth/logout
  → revoke refresh token in DB (set revoked_at)
  → add access token JTI to Redis blacklist (TTL = remaining token life)
  → clear cookie

Auth Middleware:
  → extract Bearer token from Authorization header
  → verify JWT signature + expiry
  → check JTI not in Redis blacklist
  → attach decoded user to request context
```

### JioSaavn Service

All music data flows through one service. Nothing calls saavn.sumit.co directly.

```typescript
class JioSaavnService {
  async searchAll(query: string, page: number, limit: number)
  async searchSongs(query: string, page: number, limit: number)
  async searchAlbums(query: string, page: number, limit: number)
  async searchArtists(query: string, page: number, limit: number)
  async searchPlaylists(query: string, page: number, limit: number)
  async getSong(id: string): Promise<Song>
  async getSongSuggestions(id: string, limit: number): Promise<Song[]>
  async getLyrics(id: string): Promise<{ lyrics: string; snippet: string; copyright: string }>
  async getAlbum(id: string): Promise<Album>
  async getArtist(id: string): Promise<Artist>
  async getArtistSongs(id: string, page: number): Promise<Song[]>
  async getArtistAlbums(id: string, page: number): Promise<Album[]>
  async getPlaylist(id: string): Promise<JioSaavnPlaylist>
  async getModules(languages: string): Promise<HomeModules>  // comma-separated language codes

  private async cachedFetch<T>(path: string, ttl: number): Promise<T>
}
```

Cache TTLs:
- Search results: 300s (5 min)
- Song detail + stream URL: 3600s (1 hour)
- Album detail: 3600s
- Artist detail: 1800s (30 min)
- Home modules: 900s (15 min)

### Redis Key Patterns

```
session:{userId}:{jti}       blacklisted JWT — TTL = token remaining life
search:{hash}                search result cache — TTL 300s
song:{id}                    song detail — TTL 3600s
album:{id}                   album detail — TTL 3600s
artist:{id}                  artist detail — TTL 1800s
modules:{lang}               home modules — TTL 900s
rate:{ip}                    IP rate limit counter — TTL 60s
rate:user:{userId}           user rate limit — TTL 60s
```

### API Endpoints

**AUTH — /api/auth**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /register | None | Create account |
| POST | /login | None | Get tokens |
| POST | /refresh | None (cookie) | Rotate tokens |
| POST | /logout | Bearer | Revoke session |
| GET | /me | Bearer | Get current user |
| PATCH | /me | Bearer | Update profile |
| POST | /change-password | Bearer | Change password |

**SEARCH — /api/search**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /all | Optional | Search all types |
| GET | /songs | Optional | Search songs |
| GET | /albums | Optional | Search albums |
| GET | /artists | Optional | Search artists |
| GET | /playlists | Optional | Search playlists |

**MUSIC — /api/music**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /songs/:id | Optional | Song detail + stream URL |
| GET | /songs/:id/lyrics | Optional | Song lyrics |
| GET | /songs/:id/suggestions | Optional | Recommended songs |
| GET | /albums/:id | Optional | Album + tracklist |
| GET | /artists/:id | Optional | Artist + top songs |
| GET | /artists/:id/songs | Optional | Paginated artist songs |
| GET | /artists/:id/albums | Optional | Artist discography |
| GET | /playlists/:id | Optional | JioSaavn playlist |
| GET | /modules | Optional | Home page content |

**PLAYLISTS — /api/playlists**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | / | Bearer | User's playlists |
| POST | / | Bearer | Create playlist |
| GET | /:id | Optional | Playlist detail |
| PATCH | /:id | Bearer | Update playlist |
| DELETE | /:id | Bearer | Delete playlist |
| POST | /:id/songs | Bearer | Add song |
| DELETE | /:id/songs/:songId | Bearer | Remove song |
| PATCH | /:id/songs/reorder | Bearer | Reorder songs |

**LIBRARY — /api/library**

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /liked | Bearer | Liked songs (paginated) |
| POST | /liked | Bearer | Like a song |
| DELETE | /liked/:songId | Bearer | Unlike a song |
| GET | /liked/:songId | Bearer | Check if liked |
| GET | /history | Bearer | Play history (paginated) |
| POST | /history | Bearer | Record play event |
| DELETE | /history | Bearer | Clear all history |
| GET | /artists | Bearer | Followed artists |
| POST | /artists | Bearer | Follow artist |
| DELETE | /artists/:artistId | Bearer | Unfollow artist |
| GET | /artists/:artistId | Bearer | Check if following |

---

## Database Schema

### users

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
email           varchar(255) NOT NULL UNIQUE
password_hash   varchar(255)               -- null for OAuth users
display_name    varchar(100) NOT NULL
avatar_url      text
is_verified     boolean NOT NULL DEFAULT false
provider        varchar(20) NOT NULL DEFAULT 'local'
provider_id     varchar(255)
preferred_lang  varchar(20) NOT NULL DEFAULT 'hindi'
audio_quality   varchar(10) NOT NULL DEFAULT '320kbps'
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()

UNIQUE(provider, provider_id)
```

### refresh_tokens

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
token_hash  varchar(255) NOT NULL
device_info text
expires_at  timestamptz NOT NULL
created_at  timestamptz NOT NULL DEFAULT now()
revoked_at  timestamptz

INDEX(user_id)
INDEX(expires_at)
```

### playlists

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
name            varchar(200) NOT NULL
description     text
cover_url       text
is_public       boolean NOT NULL DEFAULT false
song_count      integer NOT NULL DEFAULT 0
total_duration  integer NOT NULL DEFAULT 0
created_at      timestamptz NOT NULL DEFAULT now()
updated_at      timestamptz NOT NULL DEFAULT now()

INDEX(user_id)
INDEX(is_public) WHERE is_public = true
```

### playlist_songs

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
playlist_id     uuid NOT NULL REFERENCES playlists(id) ON DELETE CASCADE
song_id         varchar(50) NOT NULL
song_name       varchar(300) NOT NULL
song_image      text
song_artists    varchar(500) NOT NULL
song_duration   integer NOT NULL DEFAULT 0
position        integer NOT NULL
added_at        timestamptz NOT NULL DEFAULT now()
added_by        uuid NOT NULL REFERENCES users(id)

UNIQUE(playlist_id, song_id)
INDEX(playlist_id)
INDEX(position)
```

### liked_songs

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
song_id         varchar(50) NOT NULL
song_name       varchar(300) NOT NULL
song_image      text
song_artists    varchar(500) NOT NULL
song_duration   integer NOT NULL DEFAULT 0
album_id        varchar(50)
liked_at        timestamptz NOT NULL DEFAULT now()

UNIQUE(user_id, song_id)
INDEX(user_id, liked_at DESC)
```

### followed_artists

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
artist_id       varchar(50) NOT NULL
artist_name     varchar(200) NOT NULL
artist_image    text
followed_at     timestamptz NOT NULL DEFAULT now()

UNIQUE(user_id, artist_id)
INDEX(user_id)
```

### play_history

```sql
id              uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
song_id         varchar(50) NOT NULL
song_name       varchar(300) NOT NULL
song_image      text
song_artists    varchar(500) NOT NULL
album_id        varchar(50)
played_at       timestamptz NOT NULL DEFAULT now()
play_duration   integer
completed       boolean NOT NULL DEFAULT false

INDEX(user_id, played_at DESC)
INDEX(song_id)
-- cron purges rows beyond 500 per user weekly
```

### search_history

```sql
id          uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE
query       varchar(255) NOT NULL
result_type varchar(20)
result_id   varchar(50)
searched_at timestamptz NOT NULL DEFAULT now()

INDEX(user_id, searched_at DESC)
-- max 20 rows per user, service layer enforces this
```

---

## Frontend

### Folder Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── (main)/
│   │   │   ├── layout.tsx          (sidebar + now-playing bar shell)
│   │   │   ├── page.tsx            (/home)
│   │   │   ├── search/
│   │   │   │   ├── page.tsx        (/search)
│   │   │   │   └── [query]/
│   │   │   │       └── page.tsx    (/search/[query])
│   │   │   ├── album/[id]/
│   │   │   │   └── page.tsx
│   │   │   ├── artist/[id]/
│   │   │   │   └── page.tsx
│   │   │   ├── playlist/[id]/
│   │   │   │   └── page.tsx
│   │   │   └── library/
│   │   │       └── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── register/page.tsx
│   │   └── api/
│   │       ├── auth/[...route]/route.ts
│   │       ├── music/[...path]/route.ts
│   │       ├── search/[...path]/route.ts
│   │       ├── playlists/[...path]/route.ts
│   │       └── library/[...path]/route.ts
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── NowPlayingBar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── QueueDrawer.tsx
│   │   ├── player/
│   │   │   ├── SongInfo.tsx
│   │   │   ├── AudioControls.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── VolumeControl.tsx
│   │   │   └── LyricsModal.tsx
│   │   ├── music/
│   │   │   ├── SongRow.tsx
│   │   │   ├── SongCard.tsx
│   │   │   ├── AlbumCard.tsx
│   │   │   ├── ArtistCard.tsx
│   │   │   ├── PlaylistCard.tsx
│   │   │   ├── TrackList.tsx
│   │   │   └── ContextMenu.tsx
│   │   ├── search/
│   │   │   ├── SearchInput.tsx
│   │   │   ├── SearchResults.tsx
│   │   │   └── FilterBar.tsx
│   │   ├── home/
│   │   │   └── HomeSection.tsx
│   │   ├── album/
│   │   │   └── AlbumHeader.tsx
│   │   ├── artist/
│   │   │   └── ArtistHeader.tsx
│   │   ├── library/
│   │   │   └── LibraryTabs.tsx
│   │   └── ui/                     (shadcn/ui primitives)
│   ├── hooks/
│   │   ├── useAudio.ts
│   │   ├── usePlayer.ts
│   │   ├── useSearch.ts
│   │   ├── useInfiniteScroll.ts
│   │   ├── useLikeButton.ts
│   │   ├── useFollowButton.ts
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useMediaSession.ts
│   ├── stores/
│   │   ├── playerStore.ts
│   │   ├── authStore.ts
│   │   └── libraryStore.ts
│   ├── lib/
│   │   ├── api.ts
│   │   └── utils.ts
│   └── types/
│       ├── jiosaavn.ts
│       ├── api.ts
│       └── index.ts
├── public/
│   └── manifest.json
└── next.config.ts
```

### Zustand Stores

**playerStore**

```typescript
interface PlayerStore {
  currentSong:    Song | null
  queue:          Song[]
  originalQueue:  Song[]
  queueIndex:     number
  isPlaying:      boolean
  isLoading:      boolean
  progress:       number        // 0-1
  currentTime:    number        // seconds
  duration:       number        // seconds
  volume:         number        // 0-1, persisted to localStorage
  isMuted:        boolean
  quality:        AudioQuality  // persisted to localStorage
  shuffle:        boolean
  repeat:         'none' | 'one' | 'all'
  showQueue:      boolean
  showLyrics:     boolean

  playSong:        (song: Song, queue?: Song[]) => void
  playQueue:       (songs: Song[], startIndex?: number) => void
  togglePlay:      () => void
  next:            () => void
  previous:        () => void
  seek:            (pct: number) => void
  setVolume:       (v: number) => void
  toggleMute:      () => void
  toggleShuffle:   () => void
  cycleRepeat:     () => void
  addToQueue:      (song: Song) => void
  removeFromQueue: (index: number) => void
  reorderQueue:    (from: number, to: number) => void
  setQuality:      (q: AudioQuality) => void
}
```

**authStore**

```typescript
interface AuthStore {
  user:         User | null
  accessToken:  string | null
  isLoading:    boolean

  login:         (email: string, password: string) => Promise<void>
  register:      (email: string, password: string, displayName: string) => Promise<void>
  logout:        () => Promise<void>
  refreshToken:  () => Promise<void>
  updateProfile: (data: Partial<UpdateProfileInput>) => Promise<void>
}
```

**libraryStore** (guest + cached state)

```typescript
interface LibraryStore {
  likedSongs:      Song[]        // persisted to localStorage
  recentlyPlayed:  Song[]        // max 50, persisted
  followedArtists: Artist[]      // persisted

  isLiked:      (songId: string)   => boolean
  isFollowing:  (artistId: string) => boolean
  toggleLike:   (song: Song)       => void
  addToRecent:  (song: Song)       => void
  toggleFollow: (artist: Artist)   => void
}
```

### TypeScript Types

```typescript
type AudioQuality = '12kbps' | '48kbps' | '96kbps' | '160kbps' | '320kbps'
type RepeatMode   = 'none' | 'one' | 'all'
type Language     = 'hindi' | 'english' | 'tamil' | 'telugu' | 'punjabi'
type ContentType  = 'song' | 'album' | 'artist' | 'playlist'

interface Song {
  id:               string
  name:             string
  type:             'song'
  year:             string
  releaseDate:      string
  duration:         number
  label:            string
  primaryArtists:   string
  primaryArtistsId: string
  featuredArtists:  string
  explicitContent:  boolean
  playCount:        string
  language:         string
  hasLyrics:        boolean
  url:              string
  copyright:        string
  image:            Array<{ quality: string; url: string }>
  downloadUrl:      Array<{ quality: AudioQuality; url: string }>
  album:            { id: string; name: string; url: string }
  artists:          { primary: Artist[]; featured: Artist[]; all: Artist[] }
  lyrics?:          { lyrics: string; snippet: string; copyright: string }
}

interface Album {
  id:          string
  name:        string
  type:        'album'
  year:        string
  releaseDate: string
  playCount:   string
  language:    string
  explicitContent: boolean
  url:         string
  image:       Array<{ quality: string; url: string }>
  artists:     { primary: Artist[]; featured: Artist[]; all: Artist[] }
  songs:       Song[]
}

interface Artist {
  id:             string
  name:           string
  type:           'artist'
  url:            string
  image:          Array<{ quality: string; url: string }>
  followerCount:  string
  fanCount:       string
  isVerified:     boolean
  dominantLanguage: string
  dominantType:   string
  bio:            Array<{ text: string; title: string; sequence: string }>
  dob:            string
  fb:             string
  twitter:        string
  wiki:           string
  availableLanguages: string[]
  isRadioPresent: boolean
  topSongs?:      Song[]
  topAlbums?:     Album[]
}

interface User {
  id:            string
  email:         string
  displayName:   string
  avatarUrl:     string | null
  isVerified:    boolean
  provider:      string
  preferredLang: Language
  audioQuality:  AudioQuality
  createdAt:     string
}
```

### Key Hooks

**useAudio** — singleton Audio element, drives playerStore progress

```
- creates one Audio element for the lifetime of the app
- subscribes to playerStore.currentSong changes, updates src
- wires timeupdate → playerStore progress
- wires ended → playerStore.next()
- wires error → quality fallback logic then playerStore.next()
- calls useMediaSession on each song change
```

**usePlayer** — thin wrapper over playerStore for components

```
- exposes computed values: isCurrentSong(id), progressPct, formattedTime
- components never import playerStore directly
```

**useLikeButton** — handles both auth and guest cases

```
- if authenticated: calls API, updates optimistically
- if guest: writes to libraryStore (localStorage)
- returns { isLiked, toggle, isLoading }
```

**useKeyboardShortcuts** — global keyboard handler

```
Space         → playerStore.togglePlay()
Ctrl+Right    → playerStore.next()
Ctrl+Left     → playerStore.previous()
M             → playerStore.toggleMute()
L             → useLikeButton.toggle() for currentSong
```

### Audio Quality Fallback

```
1. try 320kbps
2. on error → try 160kbps
3. on error → try 96kbps
4. on error → try 48kbps
5. on error → try 12kbps
6. all failed → toast error + playerStore.next()
```

This logic lives entirely in useAudio.

### Page Data Flow

**Home page (/)**
- Server Component
- fetch /api/music/modules?language=hindi (server-side, cached 15min)
- render HomeSection rows (horizontal scroll, SongCard / AlbumCard)
- language selector triggers client-side refetch via SWR

**Search (/search/[query])**
- Server Component for initial render
- react-query useInfiniteQuery for tab content
- Intersection Observer sentinel div triggers loadMore
- FilterBar updates ?lang= query param

**Album (/album/[id])**
- Server Component
- fetch /api/music/albums/:id (cached 1hr)
- TrackList renders SongRow per track (virtualised if > 30)
- Play All → playerStore.playQueue(tracks)

**Artist (/artist/[id])**
- Server Component
- parallel fetch: artist detail + top songs + albums
- top songs: show 5, expandable to 20 without refetch
- Follow button: useFollowButton hook

**Library (/library)**
- Client Component (auth required)
- tabs: Liked Songs | Recently Played | Followed Artists | My Playlists
- data from API when authenticated, from libraryStore when guest

---

## Deployment

```
Frontend   → Vercel (auto-deploy on main push, preview URLs on PRs)
Backend    → Railway (Docker container from Dockerfile)
Database   → Neon (serverless Postgres, connection pooling via pgBouncer)
Redis      → Upstash (serverless Redis, HTTP-based ioredis adapter)
CI/CD      → GitHub Actions (lint → tsc → test → deploy)
Monitoring → Axiom (BE logs) + Vercel Analytics (FE)
```

### Environment Variables

**Backend**
```
DATABASE_URL      postgres connection string (Neon)
REDIS_URL         redis connection string (Upstash)
JWT_SECRET        min 32 chars random string
JWT_EXPIRES_IN    15m
REFRESH_TOKEN_EXPIRES_IN  30d
JIOSAAVN_API_URL  https://saavn.sumit.co
NODE_ENV          development | production | test
PORT              3001
```

**Frontend**
```
NEXT_PUBLIC_API_URL           http://localhost:3001 (dev)
NEXT_PUBLIC_DEFAULT_QUALITY   320kbps
NEXT_PUBLIC_DEFAULT_LANGUAGE  hindi
JIOSAAVN_API_URL              https://saavn.sumit.co (server-only, for SSR proxy)
```

---

## CI/CD Pipeline

```yaml
# runs on every PR to main
jobs:
  quality:
    - tsc --noEmit          (both FE and BE)
    - eslint                (both)
    - vitest run            (BE unit + integration tests)
    - playwright test       (E2E critical paths)

  deploy (main branch only):
    - deploy BE to Railway
    - deploy FE to Vercel
```

---

## Security Checklist

- Refresh tokens stored as bcrypt hash in DB, raw value only in httpOnly cookie
- Access tokens short-lived (15min), JTI blacklisted in Redis on logout
- Ownership check in every service mutation: `if (resource.userId !== userId) throw ForbiddenError`
- Zod validation on every request before any DB access
- `toSafeUser()` strips passwordHash from every user response
- Rate limiting: 5 req/min on /auth/login, 60 req/min per IP globally
- Fastify bodyLimit: 1mb
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, HSTS (prod)
- Drizzle ORM parameterised queries throughout — no string-concat SQL anywhere
