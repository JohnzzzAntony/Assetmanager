export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { vendorRepo } from '@/lib/repo'

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET() {
  try {
    const vendors = await vendorRepo.list()
    const headers = ['Name', 'Category', 'Contact Person', 'Email', 'Phone', 'Website', 'Address', 'Tax ID', 'Payment Terms', 'Rating', 'Active', 'Purchase Orders', 'Total Spent', 'Notes', 'Created At']
    const rows = vendors.map((v) => [
      v.name, v.category || '', v.contactPerson || '', v.email || '', v.phone || '', v.website || '',
      v.address || '', v.taxId || '', v.paymentTerms || '', v.rating, v.isActive ? 'Yes' : 'No',
      v._count?.purchaseOrders || 0, v._sum?.totalSpent || 0, v.notes || '', v.createdAt,
    ])
    const csv = [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="vendors-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
