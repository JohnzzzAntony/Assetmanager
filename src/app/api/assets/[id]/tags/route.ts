export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetTagRepo } from '@/lib/repo'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await assetTagRepo.listForAsset(id))
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Replace all tags on an asset
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { tagIds } = await req.json()
    if (!Array.isArray(tagIds)) {
      return NextResponse.json({ error: 'tagIds array is required' }, { status: 400 })
    }
    await assetTagRepo.setAssetTags(id, tagIds)
    return NextResponse.json({ success: true, tags: await assetTagRepo.listForAsset(id) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Attach a single tag
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const { tagId } = await req.json()
    if (!tagId) return NextResponse.json({ error: 'tagId is required' }, { status: 400 })
    await assetTagRepo.attachToAsset(id, tagId)
    return NextResponse.json({ success: true, tags: await assetTagRepo.listForAsset(id) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// Detach a single tag (tagId in query)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const url = new URL(req.url)
    const tagId = url.searchParams.get('tagId')
    if (!tagId) return NextResponse.json({ error: 'tagId query param is required' }, { status: 400 })
    await assetTagRepo.detachFromAsset(id, tagId)
    return NextResponse.json({ success: true, tags: await assetTagRepo.listForAsset(id) })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
