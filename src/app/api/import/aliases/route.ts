export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { importAliasRepo } from '@/lib/repo'

export async function GET() {
  try {
    return NextResponse.json(await importAliasRepo.list())
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.alias || !body.field) {
      return NextResponse.json({ error: 'Alias and Field are required' }, { status: 400 })
    }
    const existing = await importAliasRepo.findByAlias(body.alias)
    if (existing) {
      return NextResponse.json({ error: `Alias "${body.alias}" already exists` }, { status: 400 })
    }
    const created = await importAliasRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
