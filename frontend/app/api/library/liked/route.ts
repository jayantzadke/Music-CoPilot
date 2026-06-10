import { type NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const res = await fetch(`${API}/api/library/liked`, {
    headers: { authorization: auth },
  }).catch(() => null)
  if (!res) return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  const data = await res.json()
  return NextResponse.json(data, { status: res.status })
}

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const body = await req.json()
  const res = await fetch(`${API}/api/library/liked`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authorization: auth },
    body: JSON.stringify(body),
  }).catch(() => null)
  if (!res) return NextResponse.json({ error: 'unavailable' }, { status: 502 })
  const data = await res.json().catch(() => ({}))
  return NextResponse.json(data, { status: res.status })
}
