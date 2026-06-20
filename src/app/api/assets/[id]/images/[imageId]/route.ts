export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { imageRepo } from '@/lib/repo'
import { unlink } from 'fs/promises'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  try {
    const { id, imageId } = await params
    const img = await imageRepo.get(imageId)
    if (img && img.filePath) {
      try { await unlink(`/home/z/my-project${img.filePath}`) } catch {}
    }
    await imageRepo.delete(imageId)
    return new NextResponse(null, { status: 204 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
