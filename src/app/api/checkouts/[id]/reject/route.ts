import { NextRequest, NextResponse } from 'next/server'
import { checkoutRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    if (!body.approverId) return NextResponse.json({ error: 'approverId required' }, { status: 400 })
    const updated = await checkoutRepo.reject(id, body.approverId, body.notes)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
