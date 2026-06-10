import { type NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function DELETE(req: NextRequest, { params }: { params: { songId: string } }) {
  const auth = req.headers.get('authorization') ?? ''
  const res = await fetch(`${API}/api/library/liked/${params.songId}`, {
    method: 'DELETE',
    headers: { authorization: auth },
  }).catch(() => null)
  if (!res) return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  return new NextResponse(null, { status: res.status })
}
