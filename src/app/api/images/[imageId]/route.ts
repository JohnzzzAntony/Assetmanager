export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { imageRepo } from '@/lib/repo'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  try {
    const { imageId } = await params
    const img = await imageRepo.get(imageId)
    if (!img) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const fullPath = path.join('/home/z/my-project', img.filePath)
    const buffer = await readFile(fullPath)
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': img.mimeType,
        'Cache-Control': 'private, max-age=86400',
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
