import { z } from 'zod'

export const CreatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).trim(),
  description: z.string().max(1000).trim().optional(),
  isPublic: z.boolean().default(false),
})

export const UpdatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).trim().optional(),
  description: z.string().max(1000).trim().optional().nullable(),
  coverUrl: z.string().url().optional().nullable(),
  isPublic: z.boolean().optional(),
})

export const AddSongSchema = z.object({
  songId: z.string().min(1).max(50),
  songName: z.string().min(1).max(300),
  songImage: z.string().url().optional().nullable(),
  songArtists: z.string().min(1).max(500),
  songDuration: z.number().int().min(0).default(0),
  albumId: z.string().max(50).optional(),
})

export const ReorderSongSchema = z.object({
  songId: z.string().min(1),
  newPosition: z.number().int().min(1),
})

export type CreatePlaylistInput = z.infer<typeof CreatePlaylistSchema>
export type UpdatePlaylistInput = z.infer<typeof UpdatePlaylistSchema>
export type AddSongInput = z.infer<typeof AddSongSchema>
export type ReorderSongInput = z.infer<typeof ReorderSongSchema>
