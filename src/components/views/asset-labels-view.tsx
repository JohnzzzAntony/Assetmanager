'use client'

import { useState, useMemo, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { assetsApi, assetTypesApi, assetActivityApi } from '@/lib/api'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import {
  QrCode,
  Printer,
  Search,
  Download,
  Eye,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export function AssetLabelsView() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [previewId, setPreviewId] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  const { data: types } = useQuery({ queryKey: ['asset-types'], queryFn: () => assetTypesApi.list() })
  const { data: assets, isLoading } = useQuery({
    queryKey: ['assets-all-labels', typeFilter],
    queryFn: () => assetsApi.list({
      pageSize: 100,
      sortBy: 'assetTag',
      sortDir: 'asc',
      assetTypeId: typeFilter === 'all' ? undefined : typeFilter,
    }),
  })

  const filtered = useMemo(() => {
    if (!assets) return []
    if (!search) return assets.data
    const s = search.toLowerCase()
    return assets.data.filter((a) =>
      (a.assetTag || '').toLowerCase().includes(s) ||
      (a.make || '').toLowerCase().includes(s) ||
      (a.model || '').toLowerCase().includes(s) ||
      (a.serialNumber || '').toLowerCase().includes(s)
    )
  }, [assets, search])

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    setSelected(new Set(filtered.map((a) => a.id)))
  }

  function clearSelection() {
    setSelected(new Set())
  }

  function printSelected() {
    if (selected.size === 0) {
      toast.error('Select at least one asset to print labels')
      return
    }
    // Open print window with SVG labels
    const win = window.open('', '_blank', 'width=800,height=600')
    if (!win) {
      toast.error('Popup blocked. Please allow popups to print labels.')
      return
    }
    const selectedAssets = (assets?.data || []).filter((a) => selected.has(a.id))
    const labelsHtml = selectedAssets.map((a) => `
      <div class="label" data-id="${a.id}">
        <img src="/api/assets/${a.id}/qr?XTransformPort=3000" alt="QR" width="120" height="120" />
      </div>
    `).join('')
    win.document.write(`
      <html>
      <head>
        <title>Maylaa Asset Labels</title>
        <style>
          @page { margin: 5mm; size: auto; }
          body { margin: 0; font-family: Arial, sans-serif; }
          .label-grid { display: flex; flex-wrap: wrap; gap: 3mm; padding: 3mm; }
          .label { width: 45.7mm; height: 21.2mm; overflow: hidden; page-break-inside: avoid; box-sizing: border-box; }
          .label img { width: 100%; height: 100%; object-fit: contain; display: block; }
          @media print { .label { border: none; } }
        </style>
      </head>
      <body>
        <div class="label-grid">
          ${labelsHtml}
        </div>
        <script>
          window.onload = () => { window.print(); }
        </script>
      </body>
      </html>
    `)
    win.document.close()
    toast.success(`Printing ${selected.size} label(s)`)
  }

  function downloadSvg(assetId: string, assetTag: string) {
    fetch(`/api/assets/${assetId}/qr`)
      .then((r) => r.text())
      .then((svg) => {
        const blob = new Blob([svg], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `label-${assetTag || assetId.slice(0, 8)}.svg`
        a.click()
        URL.revokeObjectURL(url)
        toast.success('Label SVG downloaded')
      })
      .catch(() => toast.error('Download failed'))
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Print Asset Labels</h2>
          <p className="text-sm text-muted-foreground">
            Generate printable QR/barcode labels for physical asset tagging.
          </p>
        </div>
        <Button onClick={printSelected} disabled={selected.size === 0}>
          <Printer className="h-4 w-4 mr-1.5" /> Print {selected.size > 0 ? `(${selected.size})` : ''}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by tag, make, model..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Asset Type</Label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types?.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button variant="outline" size="sm" onClick={selectAll} className="flex-1">
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="flex-1">
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Asset grid with label previews */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="aspect-[3/2] w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))
        ) : filtered.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="py-12 text-center text-muted-foreground">
              <QrCode className="h-10 w-10 mx-auto mb-2" />
              <p>No assets found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((a) => {
            const isSelected = selected.has(a.id)
            return (
              <Card key={a.id} className={`relative cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}>
                <CardContent className="p-3">
                  <div className="absolute right-2 top-2 z-10">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(a.id)}
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2 pt-3">
                    <img
                      src={assetActivityApi.qrUrl(a.id)}
                      alt="Asset label"
                      className="w-full max-w-[200px] rounded border bg-white p-2"
                      onClick={() => setPreviewId(a.id)}
                    />
                    <div className="w-full text-center">
                      <p className="font-mono text-sm font-bold">{a.assetTag || '—'}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {a.make} {a.model}
                      </p>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        <Badge variant="outline" className="text-[10px]">{a.assetType?.name}</Badge>
                      </div>
                    </div>
                    <div className="flex w-full gap-1">
                      <Button size="sm" variant="outline" className="h-7 flex-1 text-xs" onClick={() => setPreviewId(a.id)}>
                        <Eye className="h-3 w-3 mr-1" /> Preview
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => downloadSvg(a.id, a.assetTag || '')}>
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Preview modal */}
      {previewId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setPreviewId(null)}
        >
          <Card className="max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Label Preview</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => setPreviewId(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <img
                src={assetActivityApi.qrUrl(previewId)}
                alt="Asset label"
                className="max-w-full rounded border"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => downloadSvg(previewId, '')}>
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download SVG
                </Button>
                <Button size="sm" onClick={() => {
                  const win = window.open(assetActivityApi.qrUrl(previewId), '_blank')
                  if (win) setTimeout(() => win.print(), 500)
                }}>
                  <Printer className="h-3.5 w-3.5 mr-1.5" /> Print
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
