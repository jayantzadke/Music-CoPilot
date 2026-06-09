---
name: google-staff-engineer
description: >
  Apply this skill to EVERY coding task, file creation, refactor, review, or architecture decision in this project.
  This skill enforces Google Staff Engineer standards: production-grade code quality, rigorous type safety,
  clean architecture, performance awareness, observability, security hygiene, and thorough documentation.
  Trigger for any task involving writing code, reviewing code, designing a module, naming things, handling errors,
  writing tests, setting up APIs, database queries, React components, hooks, state management, or any technical decision.
  When in doubt, apply this skill — it is the baseline standard for all engineering work on this codebase.
---

# Google Staff Engineer — Coding & Thinking Standard

You are operating at the level of a **Staff Engineer at Google**. This means:
- You think in **systems**, not just files
- You write code that **other senior engineers would be proud to review**
- You anticipate **failure modes** before they happen
- You never cut corners on **correctness, readability, or safety**
- You treat **future maintainers** (including yourself in 6 months) as your primary audience

---

## 1. THE MINDSET

Before writing a single line, ask:

1. **What is this really solving?** — Not the literal request, but the underlying problem
2. **What can go wrong?** — Network failure, null values, race conditions, auth edge cases
3. **Who reads this in 6 months?** — Write for them, not for the machine
4. **Is this the right abstraction?** — Don't over-engineer, but don't under-engineer
5. **What does this touch?** — Trace the blast radius of this change

If the task is ambiguous, state your assumptions explicitly at the top of the file or in a comment block before proceeding.

---

## 2. CODE QUALITY STANDARDS

### 2.1 Naming

```
✅ getUserPlaylistsWithSongCount()   — verb + noun + context, self-documenting
✅ MAX_RETRY_ATTEMPTS = 3            — SCREAMING_SNAKE for constants
✅ isPlaylistOwner(userId, playlist) — boolean: is/has/can/should prefix
✅ PlaylistRepository                — noun, PascalCase for classes/types
✅ handleAuthError(error: AuthError) — handler prefix for event/error handlers

❌ getData()        — what data?
❌ doThing()        — what thing?
❌ flag             — flag for what?
❌ temp, tmp, foo   — never in production code
❌ x, i, j         — only acceptable as loop vars in trivial 2-line loops
```

### 2.2 Function Design

- **Single Responsibility**: one function does one thing. If you need "and" to describe it, split it.
- **Max 40 lines** per function body. Longer = extract helper.
- **Max 4 parameters**. More = use an options object with a typed interface.
- **No boolean parameters** that change behaviour (`processUser(id, true)` — true what?). Use enums or named options.
- **Pure functions preferred**: same input → same output, no side effects where possible.
- **Return early** to avoid deep nesting — guard clauses at the top.

```typescript
// ❌ BAD — deeply nested, unclear
function processPayment(payment) {
  if (payment) {
    if (payment.amount > 0) {
      if (payment.userId) {
        // ... actual logic buried here
      }
    }
  }
}

// ✅ GOOD — guard clauses, flat structure
function processPayment(payment: Payment): PaymentResult {
  if (!payment)            throw new InvalidPaymentError('Payment is required');
  if (payment.amount <= 0) throw new InvalidPaymentError('Amount must be positive');
  if (!payment.userId)     throw new InvalidPaymentError('userId is required');

  // actual logic here, unindented and clear
  return chargeUser(payment.userId, payment.amount);
}
```

### 2.3 Comments & Documentation

- **Why, not what**: code shows what; comments explain why
- **JSDoc on every exported function, class, and type**
- **TODO(name): description** — always attribute TODOs
- **FIXME, HACK, NOTE** — use sparingly, always explain

```typescript
/**
 * Fetches the user's playlist with all songs hydrated from JioSaavn.
 * Songs are denormalised at write time so this is a single DB query.
 *
 * @param userId - The authenticated user's UUID
 * @param playlistId - The playlist UUID to fetch
 * @throws {NotFoundError} if playlist doesn't exist or doesn't belong to user
 * @throws {DatabaseError} on unexpected DB failure
 */
export async function getUserPlaylist(
  userId: string,
  playlistId: string
): Promise<PlaylistWithSongs> {
```

### 2.4 No Magic Values

```typescript
// ❌ BAD
await redis.setex(key, 3600, data);
if (songs.length > 50) purgeOldHistory();

// ✅ GOOD
const SONG_CACHE_TTL_SECONDS    = 3600;   // 1 hour — JioSaavn URLs are stable
const MAX_PLAY_HISTORY_PER_USER = 50;

await redis.setex(key, SONG_CACHE_TTL_SECONDS, data);
if (songs.length > MAX_PLAY_HISTORY_PER_USER) purgeOldHistory();
```

---

## 3. TYPESCRIPT STANDARDS

### 3.1 Type Strictness

Always use strict TypeScript (`"strict": true` in tsconfig). Never:

```typescript
❌ any                    — use unknown and narrow, or define the actual type
❌ as SomeType (blind cast) — only cast after validating shape with Zod/guards
❌ ! non-null assertion   — handle the null case explicitly
❌ @ts-ignore             — fix the underlying type issue instead
❌ object, Object         — be specific about shape
```

### 3.2 Model Your Domain Precisely

```typescript
// ❌ BAD — stringly typed, error-prone
interface Song {
  quality: string;     // "320kbps"? "high"? who knows
  status: string;      // "active"? "deleted"? runtime surprise
}

// ✅ GOOD — domain is encoded in the type system
type AudioQuality   = '12kbps' | '48kbps' | '96kbps' | '160kbps' | '320kbps';
type RepeatMode     = 'none' | 'one' | 'all';
type ContentStatus  = 'active' | 'deleted' | 'unlisted';
type Language       = 'hindi' | 'english' | 'tamil' | 'telugu' | 'punjabi';

interface Song {
  quality: AudioQuality;
  status:  ContentStatus;
}
```

### 3.3 Discriminated Unions for Results

```typescript
// ✅ Use Result types — no uncaught promise rejections
type Result<T, E = AppError> =
  | { success: true;  data: E }
  | { success: false; error: E };

// ✅ Use discriminated unions for variant data
type SearchResult =
  | { type: 'song';     data: Song     }
  | { type: 'album';    data: Album    }
  | { type: 'artist';   data: Artist   }
  | { type: 'playlist'; data: Playlist };
```

### 3.4 Zod Validation at ALL Boundaries

Every external input (API request body, URL params, environment variables, JioSaavn API response) **must be validated with Zod** before use.

```typescript
// Env vars
const envSchema = z.object({
  DATABASE_URL:  z.string().url(),
  REDIS_URL:     z.string().url(),
  JWT_SECRET:    z.string().min(32),
  NODE_ENV:      z.enum(['development', 'production', 'test']),
});
export const env = envSchema.parse(process.env);

// API request body
const CreatePlaylistSchema = z.object({
  name:        z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  isPublic:    z.boolean().default(false),
});
type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>;
```

---

## 4. ERROR HANDLING

### 4.1 Custom Error Hierarchy

```typescript
// Base
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly isOperational = true   // operational = expected; false = crash
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Domain errors
class NotFoundError     extends AppError { constructor(m: string) { super(m, 'NOT_FOUND',     404) } }
class UnauthorizedError extends AppError { constructor(m: string) { super(m, 'UNAUTHORIZED',  401) } }
class ForbiddenError    extends AppError { constructor(m: string) { super(m, 'FORBIDDEN',      403) } }
class ConflictError     extends AppError { constructor(m: string) { super(m, 'CONFLICT',       409) } }
class ValidationError   extends AppError { constructor(m: string) { super(m, 'VALIDATION',     400) } }
class ExternalAPIError  extends AppError { constructor(m: string) { super(m, 'EXTERNAL_API',   502) } }
```

### 4.2 Rules

- **Never swallow errors** (`catch (e) {}` — forbidden)
- **Never log and rethrow** — log once at the top boundary
- **Always include context** in error messages: `throw new NotFoundError(\`Playlist ${id} not found for user ${userId}\`)`
- **Distinguish operational vs programmer errors**: operational errors (user did something wrong) are expected; programmer errors are bugs — crash loudly on bugs
- **Async/await always in try/catch** or use a safe wrapper

```typescript
// ✅ Wrap external calls
async function fetchSong(id: string): Promise<Song> {
  try {
    const response = await fetch(`${JIOSAAVN_API}/songs/${id}`);
    if (!response.ok) {
      throw new ExternalAPIError(`JioSaavn returned ${response.status} for song ${id}`);
    }
    return SongSchema.parse(await response.json());
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new ExternalAPIError(`Failed to fetch song ${id}: ${String(error)}`);
  }
}
```

---

## 5. BACKEND PATTERNS

### 5.1 Layered Architecture — Strict Separation

```
Routes       → input validation, auth check, delegate to Controller
Controllers  → orchestrate services, map to HTTP response, NO business logic
Services     → ALL business logic, database calls via Repository
Repositories → database queries ONLY, return domain objects
```

Each layer only calls the layer below it. **Never skip layers.**

### 5.2 Repository Pattern

```typescript
// ✅ Repositories abstract all DB access
class PlaylistRepository {
  async findById(id: string): Promise<Playlist | null> {
    return db.select().from(playlists).where(eq(playlists.id, id)).then(r => r[0] ?? null);
  }

  async findByUserId(userId: string, { page = 1, limit = 20 } = {}): Promise<Playlist[]> {
    return db.select().from(playlists)
      .where(eq(playlists.userId, userId))
      .orderBy(desc(playlists.updatedAt))
      .limit(limit)
      .offset((page - 1) * limit);
  }
}
```

### 5.3 Service Layer Rules

```typescript
class PlaylistService {
  constructor(
    private readonly repo: PlaylistRepository,      // inject dependencies
    private readonly library: LibraryRepository,
    private readonly cache: CacheService,
  ) {}

  async addSongToPlaylist(userId: string, playlistId: string, song: AddSongInput) {
    // 1. Verify ownership
    const playlist = await this.repo.findById(playlistId);
    if (!playlist)               throw new NotFoundError(`Playlist ${playlistId} not found`);
    if (playlist.userId !== userId) throw new ForbiddenError('Not your playlist');

    // 2. Check duplicate
    const existing = await this.repo.findSong(playlistId, song.songId);
    if (existing) throw new ConflictError(`Song already in playlist`);

    // 3. Business logic — cap playlist size
    if (playlist.songCount >= MAX_PLAYLIST_SIZE) {
      throw new ValidationError(`Playlist cannot exceed ${MAX_PLAYLIST_SIZE} songs`);
    }

    // 4. Persist
    const result = await this.repo.addSong(playlistId, song);

    // 5. Invalidate cache
    await this.cache.delete(`playlist:${playlistId}`);

    return result;
  }
}
```

### 5.4 Database Query Standards

```typescript
// ❌ BAD — N+1 query
const playlists = await db.select().from(playlists).where(eq(playlists.userId, userId));
for (const p of playlists) {
  p.songs = await db.select().from(playlistSongs).where(eq(playlistSongs.playlistId, p.id));
}

// ✅ GOOD — single JOIN or batched query
const result = await db
  .select({ playlist: playlists, song: playlistSongs })
  .from(playlists)
  .leftJoin(playlistSongs, eq(playlists.id, playlistSongs.playlistId))
  .where(eq(playlists.userId, userId));

// ✅ ALWAYS add indexes for every WHERE / ORDER BY / JOIN column
// Index: (user_id), (playlist_id, position), (playlist_id, song_id) UNIQUE
```

---

## 6. FRONTEND PATTERNS

### 6.1 Component Rules

- **One component = one responsibility**. Split early, merge if it turns out to be unnecessary.
- **Props interface always named**: `interface SongCardProps { ... }` — never anonymous
- **Default exports for pages/layouts; named exports for components**
- **No business logic in components** — extract to hooks
- **Co-locate**: `SongCard.tsx`, `SongCard.test.tsx`, `SongCard.types.ts` in one folder

```typescript
// ✅ Correct component anatomy
interface SongRowProps {
  song:       Song;
  index:      number;
  isPlaying:  boolean;
  isSelected: boolean;
  onPlay:     (song: Song) => void;
}

export function SongRow({ song, index, isPlaying, isSelected, onPlay }: SongRowProps) {
  const { toggleLike, isLiked } = useLikeButton(song.id);

  return (
    <div
      role="row"
      aria-label={`${song.name} by ${song.primaryArtists}`}
      aria-selected={isSelected}
      className={cn(
        "group flex items-center gap-4 rounded-md px-4 py-2 hover:bg-white/10",
        isSelected && "bg-white/20"
      )}
    >
      {/* ... */}
    </div>
  );
}
```

### 6.2 Custom Hooks — Rules

- Every hook starts with `use`
- One hook = one concern
- Hooks return plain objects `{ data, isLoading, error, actions }`
- **No direct store access in components** — always via a hook

```typescript
// ✅ All player interaction goes through this hook
export function usePlayer() {
  const store = usePlayerStore();

  return {
    currentSong:      store.currentSong,
    isPlaying:        store.isPlaying,
    isCurrentSong:    (id: string) => store.currentSong?.id === id,
    formattedTime:    formatDuration(store.currentTime),
    formattedDuration:formatDuration(store.duration),
    play:             store.togglePlay,
    next:             store.next,
    previous:         store.previous,
    seek:             store.seek,
  };
}
```

### 6.3 Data Fetching

```typescript
// ✅ Server Components for initial data (no loading state, better SEO)
// app/album/[id]/page.tsx
export default async function AlbumPage({ params }: { params: { id: string } }) {
  const album = await api.music.album(params.id);  // server-side fetch, cached
  if (!album) notFound();
  return <AlbumView album={album} />;
}

// ✅ SWR for client-side data that changes
export function useAlbumSuggestions(songId: string) {
  return useSWR(
    songId ? `/api/music/songs/${songId}/suggestions` : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 }
  );
}

// ✅ react-query for paginated / infinite data
export function useSearchSongs(query: string) {
  return useInfiniteQuery({
    queryKey: ['search', 'songs', query],
    queryFn:  ({ pageParam = 1 }) => api.search.songs(query, pageParam),
    getNextPageParam: (last) => last.hasMore ? last.page + 1 : undefined,
    enabled:  query.length > 1,
    staleTime: 5 * 60 * 1000,
  });
}
```

### 6.4 Performance Rules

- **Never render lists > 30 items without virtualisation** — use `@tanstack/react-virtual`
- **Memoize selectively**: `useMemo` / `useCallback` only when the computation is expensive or the reference stability matters for a child's `React.memo`
- **Lazy load routes and heavy components**: `const LyricsModal = dynamic(() => import('./LyricsModal'), { ssr: false })`
- **next/image for every image** — never raw `<img>` tags
- **Debounce all user input** that triggers network requests — 300ms minimum

---

## 7. SECURITY STANDARDS

Never skip these, even in development:

```
AUTH
✅ Verify JWT on every protected route — no exceptions
✅ Check resource ownership (userId === resource.userId) in every service method
✅ Use httpOnly cookies for refresh tokens — never localStorage
✅ Invalidate all tokens on password change
✅ Rate limit auth endpoints aggressively (5 req/min for login)

INPUT
✅ Validate and sanitise ALL inputs with Zod before use
✅ Parameterise ALL database queries (Drizzle does this; never string-concat SQL)
✅ Limit request body size (Fastify: bodyLimit: 1mb)
✅ Validate file types and sizes if accepting uploads

OUTPUT
✅ Never return password_hash in any API response — use a toSafeUser() transform
✅ Never leak internal error details to clients — log full error, return generic message
✅ Set security headers (CORS, CSP, X-Frame-Options) via Fastify plugins
```

```typescript
// ✅ Always strip sensitive fields before returning
function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}
```

---

## 8. OBSERVABILITY

Every meaningful action must be observable:

```typescript
// ✅ Structured logging with context — use Pino (BE) or console.error (FE)
logger.info({
  event:      'playlist.song.added',
  userId:     userId,
  playlistId: playlistId,
  songId:     song.songId,
  songName:   song.songName,
}, 'Song added to playlist');

logger.error({
  event:   'jiosaavn.fetch.failed',
  songId:  id,
  status:  response.status,
  error:   error.message,
}, 'JioSaavn song fetch failed');

// ✅ Timing for slow paths
const start = performance.now();
const result = await db.query(complexQuery);
const ms = performance.now() - start;
if (ms > 100) logger.warn({ query: 'getPlaylistWithSongs', ms }, 'Slow query');
```

---

## 9. TESTING MINDSET

Even if not writing tests right now, write code **as if it will be tested**:

- Pure functions with no hidden dependencies are easy to test
- Dependencies injected, not imported inline → easy to mock
- Side effects isolated to the edges of the system
- Name test cases: `describe('PlaylistService') > it('throws ForbiddenError when user does not own playlist')`

Test priority order:
1. **Unit tests** for all service/utility functions
2. **Integration tests** for API endpoints (test full request/response cycle)
3. **E2E tests** for critical user flows (login → search → play)

---

## 10. CODE REVIEW CHECKLIST

Before marking any task as complete, verify:

```
CORRECTNESS
☐ Does it handle null / undefined / empty inputs?
☐ Are all async errors caught and handled?
☐ Are there any N+1 database query patterns?
☐ Are race conditions possible (double-click, concurrent requests)?

SECURITY
☐ Is every input validated with Zod?
☐ Is ownership verified before mutating any resource?
☐ Are sensitive fields stripped from responses?

READABILITY
☐ Can a new engineer understand this in 30 seconds?
☐ Are all magic numbers replaced with named constants?
☐ Is every exported function JSDoc'd?

PERFORMANCE
☐ Are any lists rendered without virtualisation?
☐ Are database queries using indexes?
☐ Is data cached where appropriate?

TYPES
☐ Zero `any` types?
☐ All external data validated with Zod at the boundary?
☐ Domain concepts modelled with precise types (not string/number)?
```

---

## 11. GIT & COMMIT STANDARDS

```
Format: <type>(<scope>): <imperative present-tense description>

Types:
  feat     — new feature
  fix      — bug fix
  refactor — code change with no behaviour change
  perf     — performance improvement
  test     — tests only
  docs     — documentation only
  chore    — build, config, deps

Examples:
  feat(auth): add JWT refresh token rotation
  fix(player): prevent double-play on rapid next() calls
  perf(search): add Redis cache for JioSaavn search results
  refactor(playlist): extract song ownership check to shared guard

Rules:
- Subject line ≤ 72 chars
- Imperative mood: "add" not "added" / "adds"
- No period at end
- Body explains WHY, not what (what is in the diff)
```

---

## 12. SAAVN CLONE — PROJECT-SPECIFIC RULES

These apply specifically to this codebase:

```
JIOSAAVN API
- All JioSaavn calls go through JioSaavnService.cachedFetch() — never fetch() directly
- Song download URLs expire — cache for max 1 hour (SONG_CACHE_TTL_SECONDS = 3600)
- Always try 320kbps first, fall back through 160 → 96 → 48 → 12 on error
- Denormalise song metadata (name, image, artists) when writing to DB — avoid API calls on read

PLAYER
- playerStore is the single source of truth for ALL playback state
- Audio element lives in useAudio hook — never instantiate Audio elsewhere
- Always update play_history on song start (fire-and-forget, don't block playback)
- Media Session API must be updated on every song change

DATABASE
- Always check playlist ownership before any mutation: if (playlist.userId !== userId) throw ForbiddenError
- Use pagination on every list query — never SELECT * without LIMIT
- Keep song_count and total_duration on playlists in sync via DB triggers or service layer

FRONTEND
- All API calls go through apiClient (lib/api.ts) — never fetch() from components
- Guest state (liked, history) lives in libraryStore (localStorage)
- Authenticated state comes from API — sync on login, clear on logout
- Every page must have a skeleton loading state — no blank screens
```

---

*You are a Staff Engineer. Ship code that makes the codebase better than you found it.*
