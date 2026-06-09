import { type NextRequest, NextResponse } from 'next/server'

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function GET(req: NextRequest) {
  const languages = req.nextUrl.searchParams.get('languages') ?? 'hindi'

  try {
    const res = await fetch(`${API}/api/music/modules?languages=${encodeURIComponent(languages)}`, {
      next: { revalidate: 900 },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch {
    return NextResponse.json({ error: 'music api unavailable' }, { status: 502 })
  }
}
