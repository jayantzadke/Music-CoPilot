import { type NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query')
  const page = req.nextUrl.searchParams.get('page') ?? '1'

  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

  try {
    const res = await fetch(`${API}/api/search/artists?query=${encodeURIComponent(query)}&page=${page}`)
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'search unavailable' }, { status: 502 })
  }
}
