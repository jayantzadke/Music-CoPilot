import crypto from 'crypto'
import bcrypt from 'bcryptjs'

// 32 bytes gives us enough entropy without being ridiculous
const TOKEN_BYTES = 32
const BCRYPT_ROUNDS = 12

export function generateRefreshToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString('hex')
}

export async function hashToken(token: string): Promise<string> {
  return bcrypt.hash(token, BCRYPT_ROUNDS)
}

export async function verifyToken(token: string, hash: string): Promise<boolean> {
  return bcrypt.compare(token, hash)
}

export function getTokenExpiry(durationStr: string): Date {
  const now = Date.now()
  const match = durationStr.match(/^(\d+)([smhd])$/)
  if (!match) throw new Error(`invalid duration format: ${durationStr}`)

  const [, amount, unit] = match
  const ms: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }
  return new Date(now + Number(amount) * (ms[unit as string] ?? 0))
}
