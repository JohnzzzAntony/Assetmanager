import { NextRequest, NextResponse } from 'next/server'
import { notificationRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const data = await notificationRepo.list({
      limit: sp.get('limit') ? Number(sp.get('limit')) : 100,
      onlyUnread: sp.get('unread') === 'true',
      type: sp.get('type') || undefined,
    })
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.title || !body.message) {
      return NextResponse.json({ error: 'title and message required' }, { status: 400 })
    }
    const created = await notificationRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
