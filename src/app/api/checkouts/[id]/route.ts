import { NextRequest, NextResponse } from 'next/server'
import { checkoutRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const c = await checkoutRepo.get(id)
    if (!c) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(c)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const updated = await checkoutRepo.update(id, body)
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await checkoutRepo.delete(id)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
