export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetRepo } from '@/lib/repo'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const tagIdsParam = url.searchParams.get('tagIds')
    const tagIds = tagIdsParam ? tagIdsParam.split(',').filter(Boolean) : undefined
    const opts = {
      search: url.searchParams.get('search') || undefined,
      assetTypeId: url.searchParams.get('assetTypeId') || undefined,
      status: url.searchParams.get('status') || undefined,
      departmentId: url.searchParams.get('departmentId') || undefined,
      locationId: url.searchParams.get('locationId') || undefined,
      assignedToId: url.searchParams.get('assignedToId') || undefined,
      os: url.searchParams.get('os') || undefined,
      tagIds,
      tagMatch: (url.searchParams.get('tagMatch') as 'any' | 'all' | null) || undefined,
      page: Number(url.searchParams.get('page') || '1'),
      pageSize: Number(url.searchParams.get('pageSize') || '20'),
      sortBy: url.searchParams.get('sortBy') || 'createdAt',
      sortDir: (url.searchParams.get('sortDir') || 'desc') as 'asc' | 'desc',
    }
    const result = await assetRepo.list(opts)
    return NextResponse.json(result)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Assets list error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const created = await assetRepo.create(body)
    return NextResponse.json(created, { status: 201 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Asset create error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
