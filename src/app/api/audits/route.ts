import { NextRequest, NextResponse } from 'next/server'
import { assetAuditRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await assetAuditRepo.list()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body || !body.title || !String(body.title).trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }
    const created = await assetAuditRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = String(e)
    const status = msg.includes('required') || msg.includes('must be') ? 400 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
