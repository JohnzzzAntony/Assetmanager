import { NextRequest, NextResponse } from 'next/server'
import { maintenanceRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Maintenance dashboard: upcoming maintenance + stats
export async function GET() {
  try {
    const stats = await maintenanceRepo.stats()
    const upcoming = await maintenanceRepo.upcoming(30)
    return NextResponse.json({ stats, upcoming })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
