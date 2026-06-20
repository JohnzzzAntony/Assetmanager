import { NextRequest, NextResponse } from 'next/server'
import { assetRepo } from '@/lib/repo'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Generate a printable asset label as SVG (acts as a "QR code" placeholder)
// Includes the asset tag, name, serial number, and a Code-128-like barcode pattern
function generateBarcodeSvg(value: string, width = 280, height = 60): string {
  // Simple deterministic barcode-like pattern based on the string
  const bars: string[] = []
  let x = 4
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    // 4 bars per char (varying widths)
    const widths = [(code >> 6) & 3, (code >> 4) & 3, (code >> 2) & 3, code & 3].map((w) => w + 1)
    for (let j = 0; j < 4; j++) {
      const w = widths[j]
      const fill = j % 2 === 0 ? '#000' : 'none'
      if (fill === '#000') {
        bars.push(`<rect x="${x}" y="4" width="${w}" height="${height - 16}" fill="${fill}"/>`)
      }
      x += w + 1
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.max(width, x)}" height="${height}" viewBox="0 0 ${Math.max(width, x)} ${height}">
    ${bars.join('\n    ')}
    <text x="${Math.max(width, x) / 2}" y="${height - 3}" font-family="monospace" font-size="10" text-anchor="middle" fill="#000">${value}</text>
  </svg>`
}

// Generate a "QR-like" 2D matrix as SVG
function generateQrLikeSvg(value: string, size = 100): string {
  // Deterministic pseudo-QR matrix based on string hash
  const cells = 21  // 21x21 like QR Code Version 1
  const cellSize = size / cells
  // Simple hash function to seed pattern
  let seed = 0
  for (let i = 0; i < value.length; i++) seed = (seed * 31 + value.charCodeAt(i)) >>> 0
  function next() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0xffffffff }

  const rects: string[] = []
  // Finder patterns at 3 corners
  function finder(cx: number, cy: number) {
    rects.push(`<rect x="${cx}" y="${cy}" width="${cellSize * 7}" height="${cellSize * 7}" fill="#000"/>`)
    rects.push(`<rect x="${cx + cellSize}" y="${cy + cellSize}" width="${cellSize * 5}" height="${cellSize * 5}" fill="#fff"/>`)
    rects.push(`<rect x="${cx + cellSize * 2}" y="${cy + cellSize * 2}" width="${cellSize * 3}" height="${cellSize * 3}" fill="#000"/>`)
  }
  finder(0, 0)
  finder((cells - 7) * cellSize, 0)
  finder(0, (cells - 7) * cellSize)

  for (let r = 0; r < cells; r++) {
    for (let c = 0; c < cells; c++) {
      // Skip finder pattern regions
      const inFinder =
        (r < 8 && c < 8) ||
        (r < 8 && c >= cells - 8) ||
        (r >= cells - 8 && c < 8)
      if (inFinder) continue
      if (next() > 0.5) {
        rects.push(`<rect x="${c * cellSize}" y="${r * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`)
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges">
    <rect width="${size}" height="${size}" fill="#fff"/>
    ${rects.join('\n    ')}
  </svg>`
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const asset = await assetRepo.get(id)
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

    const sp = req.nextUrl.searchParams
    const format = sp.get('format') || 'svg'  // svg | json
    const label = asset.assetTag || asset.serialNumber || asset.id.slice(0, 8)
    const fullName = [asset.make, asset.model].filter(Boolean).join(' ') || label

    if (format === 'json') {
      return NextResponse.json({
        assetId: asset.id,
        assetTag: asset.assetTag,
        label,
        name: fullName,
        serial: asset.serialNumber,
        url: `/api/assets/${asset.id}`,
      })
    }

    // Label physical dimensions: 45.7mm x 21.2mm
    // SVG viewBox in 1/10 mm units => 457 x 212 user units (1 user unit = 0.1mm)
    // Rendered at ~3.78px/mm: width≈173px, height≈80px (but we use a larger canvas for quality)
    const W = 457   // 45.7 mm * 10
    const H = 212   // 21.2 mm * 10

    // QR-like pattern (compact, 80x80 units in the left area)
    const qrSize = 160
    const qr = generateQrLikeSvg(label, qrSize)

    // Barcode across the bottom
    const barcode = generateBarcodeSvg(label, W - qrSize - 20, 30)

    // Format purchase date
    const purchaseDateStr = asset.purchaseDate
      ? new Date(asset.purchaseDate as string).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : '—'

    // Truncate helpers
    const trunc = (s: string | null | undefined, n: number) =>
      s ? (s.length > n ? s.slice(0, n - 1) + '…' : s) : '—'

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
      <!-- Label background -->
      <rect width="${W}" height="${H}" fill="#fff" stroke="#222" stroke-width="1.5"/>

      <!-- Header band -->
      <rect width="${W}" height="30" fill="#0f172a"/>
      <text x="${W / 2}" y="20" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#ffffff" text-anchor="middle" letter-spacing="1">Maylaa International</text>

      <!-- QR code block -->
      <g transform="translate(6, 36)">${qr}</g>

      <!-- Vertical divider -->
      <line x1="${qrSize + 12}" y1="34" x2="${qrSize + 12}" y2="${H - 2}" stroke="#ddd" stroke-width="1"/>

      <!-- Right side fields -->
      <g transform="translate(${qrSize + 20}, 36)" font-family="Arial, sans-serif">
        <!-- Asset Tag -->
        <text y="10" font-size="10" fill="#666" font-weight="bold">Asset Tag</text>
        <text y="24" font-size="13" font-weight="bold" fill="#0f172a" font-family="monospace">${trunc(asset.assetTag, 18)}</text>

        <!-- Description (Make + Model) -->
        <text y="38" font-size="10" fill="#666" font-weight="bold">Description</text>
        <text y="50" font-size="11" fill="#1e293b">${trunc(fullName, 26)}</text>

        <!-- Serial Number -->
        <text y="64" font-size="10" fill="#666" font-weight="bold">Serial Number</text>
        <text y="76" font-size="11" fill="#1e293b" font-family="monospace">${trunc(asset.serialNumber, 24)}</text>

        <!-- Type -->
        <text y="90" font-size="10" fill="#666" font-weight="bold">Type</text>
        <text y="102" font-size="11" fill="#1e293b">${trunc(asset.assetType?.name, 20)}</text>

        <!-- Barcode strip -->
        <g transform="translate(-6, 112)">${barcode}</g>
      </g>
    </svg>`

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=60',
      },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
