'use client'

import { useState, useRef, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { importApi, importAliasesApi } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, FileSpreadsheet, Download, CheckCircle2, XCircle, Loader2, AlertCircle, Database, Plus, Check, X, Edit2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

const SAMPLE_CSV = `Asset Tag,Type,Make,Model,Serial Number,Status,OS,CPU,RAM,Storage,User,Department,Location,Cost,Purchase Date
TC-000100,Desktop,Dell,Optiplex 7050,DL7050SN100,In Use,Windows 11 PRO,Intel Core i5-7500,8GB,256GB SSD,John Smith,IT,Maylaa HO,700,2024-01-15
TC-000101,Laptop,Lenovo,ThinkPad T14,LNVT14SN101,In Use,Windows 11 PRO,Intel Core i7-1260P,16GB,512GB SSD,Jane Doe,Finance,Maylaa HO,1400,2024-02-20
TC-000102,Mobile,Apple,iPhone 14,F2LW14ABC102,In Stock,iOS 17,,,128GB,,,,799,2024-03-10`

const ASSET_FIELDS = [
  { value: 'assetTag', label: 'Asset Tag' },
  { value: 'assetTypeId', label: 'Asset Type' },
  { value: 'make', label: 'Make / Brand' },
  { value: 'model', label: 'Model' },
  { value: 'modelNumber', label: 'Model Number' },
  { value: 'serialNumber', label: 'Serial Number' },
  { value: 'partNumber', label: 'Part Number' },
  { value: 'status', label: 'Status' },
  { value: 'purchaseDate', label: 'Purchase Date' },
  { value: 'cost', label: 'Cost' },
  { value: 'warrantyExpiry', label: 'Warranty Expiry' },
  { value: 'os', label: 'Operating System' },
  { value: 'osKey', label: 'OS Key' },
  { value: 'officeKey', label: 'Office Key' },
  { value: 'cpu', label: 'CPU' },
  { value: 'gpu', label: 'GPU' },
  { value: 'ram', label: 'RAM' },
  { value: 'storage', label: 'Storage / HDD' },
  { value: 'color', label: 'Color' },
  { value: 'imei1', label: 'IMEI 1' },
  { value: 'imei2', label: 'IMEI 2' },
  { value: 'rom', label: 'ROM' },
  { value: 'otpMobileNumber', label: 'OTP Mobile' },
  { value: 'googleAppleAccount', label: 'Google/Apple Account' },
  { value: 'monitorMake', label: 'Monitor Make' },
  { value: 'monitorModel', label: 'Monitor Model' },
  { value: 'monitorSn', label: 'Monitor Serial Number' },
  { value: 'monitorSize', label: 'Monitor Size' },
  { value: 'monitorPartNumber', label: 'Monitor Part Number' },
  { value: 'keyboardMake', label: 'Keyboard Make' },
  { value: 'keyboardModel', label: 'Keyboard Model' },
  { value: 'keyboardSn', label: 'Keyboard Serial Number' },
  { value: 'mouseMake', label: 'Mouse Make' },
  { value: 'mouseModel', label: 'Mouse Model' },
  { value: 'mouseSn', label: 'Mouse Serial Number' },
  { value: 'mousePn', label: 'Mouse Part Number' },
  { value: 'assignedToId', label: 'Assigned To Person' },
  { value: 'departmentId', label: 'Department' },
  { value: 'locationId', label: 'Location' },
  { value: 'comments', label: 'Comments' },
  { value: 'computerName', label: 'Computer Name' },
  { value: 'manufactureYear', label: 'Manufacture Year' },
  { value: 'ipAddress', label: 'IP Address' },
  { value: 'tonersModel', label: 'Toners Model' },
  { value: 'deviceType', label: 'Device Type' },
  { value: 'qty', label: 'Quantity' },
  { value: 'barcodeScannerModel', label: 'Barcode Scanner Model' },
  { value: 'barcodeScannerSn', label: 'Barcode Scanner SN' },
  { value: 'scaleMachineIpAddress', label: 'Scale Machine IP' },
  { value: 'hddInstalledDate', label: 'HDD Installed Date' },
  { value: 'hddInstalledDate2', label: 'HDD Installed Date 2' },
]

interface ImportAlias {
  id: string
  alias: string
  field: string
}

export function ImportView() {
  const qc = useQueryClient()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null)
  const [csvText, setCsvText] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Alias state variables
  const [aliases, setAliases] = useState<ImportAlias[]>([])
  const [loadingAliases, setLoadingAliases] = useState(false)
  const [newAlias, setNewAlias] = useState('')
  const [newField, setNewField] = useState('assetTag')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingAlias, setEditingAlias] = useState('')
  const [editingField, setEditingField] = useState('')

  const fetchAliases = async () => {
    setLoadingAliases(true)
    try {
      const data = await importAliasesApi.list()
      setAliases(data)
    } catch (e) {
      console.error('Failed to fetch aliases:', e)
    } finally {
      setLoadingAliases(false)
    }
  }

  useEffect(() => {
    fetchAliases()
  }, [])

  const handleAddAlias = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newAlias.trim()) return
    try {
      await importAliasesApi.create({ alias: newAlias.trim(), field: newField })
      toast.success('Alias mapping added')
      setNewAlias('')
      fetchAliases()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const handleUpdateAlias = async (id: string) => {
    if (!editingAlias.trim()) return
    try {
      await importAliasesApi.update(id, { alias: editingAlias.trim(), field: editingField })
      toast.success('Alias mapping updated')
      setEditingId(null)
      fetchAliases()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const handleDeleteAlias = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alias mapping?')) return
    try {
      await importAliasesApi.delete(id)
      toast.success('Alias mapping removed')
      fetchAliases()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  function handleFile(f: File) {
    setFile(f)
    setResult(null)
    f.text().then(setCsvText)
  }

  async function handleImport() {
    setImporting(true)
    try {
      const fileToImport = file || new File([csvText], 'manual.csv', { type: 'text/csv' })
      if (!fileToImport) { toast.error('Please provide a CSV'); return }
      const res = await importApi.excel(fileToImport)
      setResult(res)
      if (res.imported > 0) {
        toast.success(`Imported ${res.imported} assets`)
        qc.invalidateQueries({ queryKey: ['assets'] })
        qc.invalidateQueries({ queryKey: ['dashboard'] })
      }
    } catch (e) {
      toast.error('Import failed: ' + String(e))
    } finally {
      setImporting(false)
    }
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'asset-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 animate-fade-in-up">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-500/5 border">
          <Upload className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Import Assets from CSV/Excel</h2>
          <p className="text-sm text-muted-foreground">Bulk import assets from a CSV or Excel file. New departments, locations, and persons will be auto-created.</p>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" /> Upload Excel or CSV File
              </CardTitle>
              <CardDescription>Drag & drop or click to select a file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
                onDragLeave={() => setDragActive(false)}
                onDrop={(e) => { e.preventDefault(); setDragActive(false); const f = e.dataTransfer.files?.[0]; if (f) handleFile(f) }}
                onClick={() => inputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer ${
                  dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/30 hover:border-primary/50'
                }`}
              >
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm font-medium">{file ? file.name : 'Drop file here or click to browse'}</p>
                <p className="text-xs text-muted-foreground">Supports .csv, .xlsx, .xls</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv,.xlsx,.xls"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
                />
              </div>

              {csvText && file?.name.endsWith('.csv') && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Preview (first 1000 chars)</span>
                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setCsvText('')}>Clear</Button>
                  </div>
                  <Textarea readOnly value={csvText.slice(0, 1000)} className="font-mono text-xs max-h-40" rows={5} />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleImport} disabled={importing || !file} className="flex-1">
                  {importing ? <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Importing...</> : <><Upload className="h-4 w-4 mr-1.5" /> Import Now</>}
                </Button>
                <Button variant="outline" onClick={downloadTemplate}>
                  <Download className="h-4 w-4 mr-1.5" /> Template
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Manage Column Title Mappings Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4" /> Manage Column Title Mappings
              </CardTitle>
              <CardDescription>
                Add, edit, or remove custom spreadsheet column mapping aliases to resolve import columns dynamically.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <form onSubmit={handleAddAlias} className="flex gap-2 items-end bg-muted/20 p-3 rounded-xl border">
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold">Column Title (Spreadsheet Header)</label>
                  <input
                    type="text"
                    placeholder="e.g. Hostname"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  />
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs font-semibold">Maps to Database Field</label>
                  <select
                    value={newField}
                    onChange={(e) => setNewField(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:bg-zinc-900"
                  >
                    {ASSET_FIELDS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                </div>
                <Button type="submit" size="sm" className="h-9">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </form>

              {loadingAliases ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading mappings...
                </div>
              ) : aliases.length === 0 ? (
                <div className="text-center py-6 text-sm text-muted-foreground border rounded-xl border-dashed">
                  No custom mapping overrides defined. Default mappings are active.
                </div>
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <div className="divide-y max-h-80 overflow-y-auto">
                    {aliases.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 hover:bg-muted/10 transition-colors text-sm">
                        {editingId === item.id ? (
                          <div className="flex-1 flex gap-2 items-center">
                            <input
                              type="text"
                              value={editingAlias}
                              onChange={(e) => setEditingAlias(e.target.value)}
                              className="flex-1 h-8 rounded-md border border-input bg-transparent px-2.5 text-xs focus-visible:outline-none"
                            />
                            <select
                              value={editingField}
                              onChange={(e) => setEditingField(e.target.value)}
                              className="flex-1 h-8 rounded-md border border-input bg-background px-2.5 text-xs focus-visible:outline-none dark:bg-zinc-900"
                            >
                              {ASSET_FIELDS.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                            <div className="flex gap-1">
                              <Button size="sm" className="h-8 px-2" onClick={() => handleUpdateAlias(item.id)}>
                                <Check className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingId(null)}>
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-xs text-muted-foreground mr-1">Title:</span>
                                <span className="font-semibold">{item.alias}</span>
                              </div>
                              <div>
                                <span className="text-xs text-muted-foreground mr-1">Maps to:</span>
                                <Badge variant="outline" className="text-xs font-mono font-normal">
                                  {ASSET_FIELDS.find(f => f.value === item.field)?.label || item.field}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex gap-1 ml-2 shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={() => {
                                  setEditingId(item.id)
                                  setEditingAlias(item.alias)
                                  setEditingField(item.field)
                                }}
                              >
                                <Edit2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0 hover:bg-rose-500/10"
                                onClick={() => handleDeleteAlias(item.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {result && (
            <Alert variant={result.errors.length > 0 ? 'destructive' : 'default'}>
              <div className="flex items-start gap-2">
                {result.imported > 0 ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <XCircle className="h-4 w-4" />}
                <div>
                  <p className="font-medium">Import Complete</p>
                  <AlertDescription>
                    Successfully imported <strong>{result.imported}</strong> assets.
                    {result.errors.length > 0 && ` ${result.errors.length} errors occurred.`}
                  </AlertDescription>
                  {result.errors.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs cursor-pointer">View errors</summary>
                      <ul className="mt-1 space-y-0.5 text-xs max-h-32 overflow-y-auto scrollbar-thin">
                        {result.errors.map((e, i) => <li key={i} className="font-mono">{e}</li>)}
                      </ul>
                    </details>
                  )}
                </div>
              </div>
            </Alert>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Supported Columns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {ASSET_FIELDS.map((c) => (
                  <Badge key={c.value} variant="secondary" className="text-[10px]">{c.label}</Badge>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Column names are matched case-insensitively. You can add mapping overrides on the left to map any custom columns in your Excel sheets.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
            <CardContent className="p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Tips</p>
                  <p>• New departments, locations, and persons are auto-created from values</p>
                  <p>• Asset Type values should match existing types (Desktop, Laptop, etc.)</p>
                  <p>• Dates should be in YYYY-MM-DD format</p>
                  <p>• Costs should be numeric (without currency symbols)</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
