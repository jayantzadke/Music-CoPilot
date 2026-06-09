import { type NextRequest, NextResponse } from 'next/server'

const SAAVN_BASE = 'https://saavn.dev/api'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const page = req.nextUrl.searchParams.get('page') ?? '1'
  try {
    const res = await fetch(`${SAAVN_BASE}/artists/${params.id}/albums?page=${page}`, { next: { revalidate: 1800 } })
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
}
