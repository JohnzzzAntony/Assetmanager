import { NextRequest, NextResponse } from 'next/server'
import { maintenanceRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// List maintenance schedules for an asset
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    return NextResponse.json(await maintenanceRepo.listForAsset(id))
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
