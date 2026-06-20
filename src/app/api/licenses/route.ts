import { NextRequest, NextResponse } from 'next/server'
import { licenseRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    return NextResponse.json(await licenseRepo.list())
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.name) return NextResponse.json({ error: 'name required' }, { status: 400 })
    const created = await licenseRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
