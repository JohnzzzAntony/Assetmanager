import { NextResponse } from 'next/server'
import { notificationRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Re-scan the system and regenerate system notifications (warranty, maintenance, license)
export async function POST() {
  try {
    const result = await notificationRepo.regenerateSystemNotifications()
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
