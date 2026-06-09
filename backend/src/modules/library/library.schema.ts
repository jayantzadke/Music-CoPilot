import { z } from 'zod'

export const LikeSongSchema = z.object({
  songId: z.string().min(1).max(50),
  songName: z.string().min(1).max(300),
  songImage: z.string().url().optional().nullable(),
  songArtists: z.string().min(1).max(500),
  songDuration: z.number().int().min(0).default(0),
  albumId: z.string().max(50).optional(),
})

export const AddHistorySchema = z.object({
  songId: z.string().min(1).max(50),
  songName: z.string().min(1).max(300),
  songImage: z.string().url().optional().nullable(),
  songArtists: z.string().min(1).max(500),
  albumId: z.string().max(50).optional(),
  playDuration: z.number().int().min(0).optional(),
  completed: z.boolean().default(false),
})

export const FollowArtistSchema = z.object({
  artistId: z.string().min(1).max(50),
  artistName: z.string().min(1).max(200),
  artistImage: z.string().url().optional().nullable(),
})

export type LikeSongInput = z.infer<typeof LikeSongSchema>
export type AddHistoryInput = z.infer<typeof AddHistorySchema>
export type FollowArtistInput = z.infer<typeof FollowArtistSchema>
