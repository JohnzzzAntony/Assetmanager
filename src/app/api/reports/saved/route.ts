import { NextRequest, NextResponse } from 'next/server'
import { savedReportRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await savedReportRepo.list()
    return NextResponse.json({ data })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Saved reports list error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const created = await savedReportRepo.create({
      name: body.name.trim(),
      description: body.description ?? null,
      section: body.section ?? null,
      config: body.config ?? {},
      createdBy: body.createdBy ?? null,
    })
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Saved report create error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
