import { NextResponse } from 'next/server'
import { assetLocationMapRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await assetLocationMapRepo.report()
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
