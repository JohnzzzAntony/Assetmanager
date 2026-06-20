export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { assetRepo } from '@/lib/repo'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ids, action, payload } = body as {
      ids: string[]
      action: 'setStatus' | 'delete' | 'assignTag' | 'removeTag'
      payload?: { status?: string; tagId?: string }
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids must be a non-empty array' }, { status: 400 })
    }

    if (ids.length > 500) {
      return NextResponse.json({ error: 'Cannot process more than 500 assets at once' }, { status: 400 })
    }

    let affected = 0
    let message = ''

    switch (action) {
      case 'setStatus': {
        if (!payload?.status) {
          return NextResponse.json({ error: 'status is required for setStatus' }, { status: 400 })
        }
        affected = await assetRepo.bulkSetStatus(ids, payload.status)
        message = `Updated status to "${payload.status}" for ${affected} asset(s)`
        break
      }
      case 'delete': {
        affected = await assetRepo.bulkDelete(ids)
        message = `Deleted ${affected} asset(s)`
        break
      }
      case 'assignTag': {
        if (!payload?.tagId) {
          return NextResponse.json({ error: 'tagId is required for assignTag' }, { status: 400 })
        }
        affected = await assetRepo.bulkAssignTag(ids, payload.tagId)
        message = `Tagged ${affected} asset(s)`
        break
      }
      case 'removeTag': {
        if (!payload?.tagId) {
          return NextResponse.json({ error: 'tagId is required for removeTag' }, { status: 400 })
        }
        affected = await assetRepo.bulkRemoveTag(ids, payload.tagId)
        message = `Removed tag from ${affected} asset(s)`
        break
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, affected, message })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('Bulk assets error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
