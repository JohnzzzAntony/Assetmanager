export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetTagRepo } from '@/lib/repo'

export async function GET() {
  try {
    return NextResponse.json(await assetTagRepo.list())
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    if (!data.name || !String(data.name).trim()) {
      return NextResponse.json({ error: 'Tag name is required' }, { status: 400 })
    }
    const existing = await assetTagRepo.getByName(String(data.name).trim())
    if (existing) {
      return NextResponse.json({ error: 'A tag with this name already exists' }, { status: 409 })
    }
    const tag = await assetTagRepo.create({ name: String(data.name).trim(), color: data.color, description: data.description })
    return NextResponse.json(tag, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
