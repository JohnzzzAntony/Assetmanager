'use client'

import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { assetsApi, assetTypesApi, departmentsApi, locationsApi, personsApi } from '@/lib/api'
import { useNav } from '@/lib/nav'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ASSET_STATUSES, STATUS_CONFIG } from '@/lib/types'
import {
  ArrowLeft,
  Save,
  Package,
  Cpu,
  MemoryStick,
  HardDrive,
  Monitor,
  Keyboard,
  Mouse,
  Smartphone,
  User,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  CircleDot,
  Wand2,
  Plus,
  FileText,
  KeyRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateAssetTag } from '@/lib/format'

interface FormState {
  assetTag: string
  assetTypeId: string
  make: string
  model: string
  modelNumber: string
  serialNumber: string
  partNumber: string
  status: string
  purchaseDate: string
  cost: string
  currency: string
  warrantyExpiry: string
  os: string
  osKey: string
  officeKey: string
  cpu: string
  gpu: string
  ram: string
  storage: string
  color: string
  imei1: string
  imei2: string
  rom: string
  otpMobileNumber: string
  googleAppleAccount: string
  monitorMake: string
  monitorModel: string
  monitorSn: string
  monitorSize: string
  monitorPartNumber: string
  keyboardMake: string
  keyboardModel: string
  keyboardSn: string
  mouseMake: string
  mouseModel: string
  mouseSn: string
  mousePn: string
  assignedToId: string
  departmentId: string
  locationId: string
  computerName: string
  manufactureYear: string
  ipAddress: string
  tonersModel: string
  deviceType: string
  qty: string
  barcodeScannerModel: string
  barcodeScannerSn: string
  scaleMachineIpAddress: string
  hddInstalledDate: string
  hddInstalledDate2: string
  comments: string
}

const EMPTY: FormState = {
  assetTag: '', assetTypeId: '', make: '', model: '', modelNumber: '', serialNumber: '',
  partNumber: '', status: 'In Stock', purchaseDate: '', cost: '', currency: 'USD',
  warrantyExpiry: '', os: '', osKey: '', officeKey: '', cpu: '', gpu: '', ram: '',
  storage: '', color: '', imei1: '', imei2: '', rom: '', otpMobileNumber: '',
  googleAppleAccount: '', monitorMake: '', monitorModel: '', monitorSn: '', monitorSize: '',
  monitorPartNumber: '', keyboardMake: '', keyboardModel: '', keyboardSn: '',
  mouseMake: '', mouseModel: '', mouseSn: '', mousePn: '',
  assignedToId: '', departmentId: '', locationId: '',
  computerName: '', manufactureYear: '', ipAddress: '', tonersModel: '', deviceType: '',
  qty: '', barcodeScannerModel: '', barcodeScannerSn: '', scaleMachineIpAddress: '',
  hddInstalledDate: '', hddInstalledDate2: '', comments: '',
}

function toDateInput(s?: string | null): string {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function Field({ label, children, icon: Icon, hint }: { label: string; children: React.ReactNode; icon?: typeof Cpu; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs flex items-center gap-1.5">
        {Icon && <Icon className="h-3 w-3 text-muted-foreground" />}
        {label}
      </Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function AssetFormView({ mode, id, prefill }: { mode: 'new' | 'edit'; id?: string; prefill?: Partial<FormState> }) {
  const { navigate, back } = useNav()
  const qc = useQueryClient()
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...prefill })
  const [saving, setSaving] = useState(false)
  const [saveAndNew, setSaveAndNew] = useState(false)

  const { data: types } = useQuery({ queryKey: ['asset-types'], queryFn: () => assetTypesApi.list() })
  const { data: depts } = useQuery({ queryKey: ['departments'], queryFn: () => departmentsApi.list() })
  const { data: locs } = useQuery({ queryKey: ['locations'], queryFn: () => locationsApi.list() })
  const { data: persons } = useQuery({ queryKey: ['persons'], queryFn: () => personsApi.list() })

  const { data: existing } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetsApi.get(id!),
    enabled: mode === 'edit' && !!id,
  })

  useEffect(() => {
    if (mode === 'edit' && existing) {
      setForm({
        assetTag: existing.assetTag || '',
        assetTypeId: existing.assetTypeId || '',
        make: existing.make || '',
        model: existing.model || '',
        modelNumber: existing.modelNumber || '',
        serialNumber: existing.serialNumber || '',
        partNumber: existing.partNumber || '',
        status: existing.status || 'In Stock',
        purchaseDate: toDateInput(existing.purchaseDate),
        cost: existing.cost?.toString() || '',
        currency: existing.currency || 'USD',
        warrantyExpiry: toDateInput(existing.warrantyExpiry),
        os: existing.os || '',
        osKey: existing.osKey || '',
        officeKey: existing.officeKey || '',
        cpu: existing.cpu || '',
        gpu: existing.gpu || '',
        ram: existing.ram || '',
        storage: existing.storage || '',
        color: existing.color || '',
        imei1: existing.imei1 || '',
        imei2: existing.imei2 || '',
        rom: existing.rom || '',
        otpMobileNumber: existing.otpMobileNumber || '',
        googleAppleAccount: existing.googleAppleAccount || '',
        monitorMake: existing.monitorMake || '',
        monitorModel: existing.monitorModel || '',
        monitorSn: existing.monitorSn || '',
        monitorSize: existing.monitorSize || '',
        monitorPartNumber: existing.monitorPartNumber || '',
        keyboardMake: existing.keyboardMake || '',
        keyboardModel: existing.keyboardModel || '',
        keyboardSn: existing.keyboardSn || '',
        mouseMake: existing.mouseMake || '',
        mouseModel: existing.mouseModel || '',
        mouseSn: existing.mouseSn || '',
        mousePn: existing.mousePn || '',
        assignedToId: existing.assignedToId || '',
        departmentId: existing.departmentId || '',
        locationId: existing.locationId || '',
        computerName: existing.computerName || '',
        manufactureYear: existing.manufactureYear || '',
        ipAddress: existing.ipAddress || '',
        tonersModel: existing.tonersModel || '',
        deviceType: existing.deviceType || '',
        qty: existing.qty || '',
        barcodeScannerModel: existing.barcodeScannerModel || '',
        barcodeScannerSn: existing.barcodeScannerSn || '',
        scaleMachineIpAddress: existing.scaleMachineIpAddress || '',
        hddInstalledDate: existing.hddInstalledDate || '',
        hddInstalledDate2: existing.hddInstalledDate2 || '',
        comments: existing.comments || '',
      })
    }
  }, [mode, existing])

  // Read OCR prefill from sessionStorage on mount (new mode)
  useEffect(() => {
    if (mode === 'new') {
      try {
        const stored = sessionStorage.getItem('ocr-prefill')
        const storedType = sessionStorage.getItem('ocr-asset-type')
        if (stored || storedType) {
          const parsed = stored ? JSON.parse(stored) : {}
          setForm((f) => ({
            ...f,
            ...parsed,
            assetTypeId: storedType || f.assetTypeId,
          }))
          sessionStorage.removeItem('ocr-prefill')
          sessionStorage.removeItem('ocr-asset-type')
          toast.success('Pre-filled from OCR results')
        }
      } catch {}
    }
  }, [mode])

  // When asset type changes, suggest an asset tag
  useEffect(() => {
    if (mode === 'new' && !form.assetTag && form.assetTypeId && types) {
      const t = types.find((x) => x.id === form.assetTypeId)
      if (t) {
        setForm((f) => ({ ...f, assetTag: generateAssetTag(t.name) }))
      }
    }
  }, [form.assetTypeId, mode, types])

  // Auto-fill department/location from selected person
  useEffect(() => {
    if (form.assignedToId && persons) {
      const p = persons.find((x) => x.id === form.assignedToId)
      if (p) {
        setForm((f) => ({
          ...f,
          departmentId: f.departmentId || p.departmentId || '',
          locationId: f.locationId || p.locationId || '',
        }))
      }
    }
  }, [form.assignedToId, persons])

  const isMobile = (() => {
    if (!form.assetTypeId || !types) return false
    const t = types.find((x) => x.id === form.assetTypeId)
    return ['Mobile', 'Tablet'].includes(t?.name || '')
  })()

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSave(andNew: boolean) {
    if (!form.assetTypeId) {
      toast.error('Please select an asset type')
      return
    }
    setSaving(true)
    setSaveAndNew(andNew)
    try {
      const payload: Record<string, unknown> = {
        ...form,
        cost: form.cost ? parseFloat(form.cost) : null,
        purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
        warrantyExpiry: form.warrantyExpiry ? new Date(form.warrantyExpiry).toISOString() : null,
        assignedToId: form.assignedToId || null,
        departmentId: form.departmentId || null,
        locationId: form.locationId || null,
      }
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') payload[k] = null
      })

      let result
      if (mode === 'edit' && id) {
        result = await assetsApi.update(id, payload)
        toast.success('Asset updated successfully')
      } else {
        result = await assetsApi.create(payload)
        toast.success('Asset created successfully')
      }
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['dashboard'] })

      if (andNew && mode === 'new') {
        setForm({ ...EMPTY })
      } else {
        navigate('asset-detail', { id: result.id })
      }
    } catch (e) {
      toast.error('Save failed: ' + String(e))
    } finally {
      setSaving(false)
      setSaveAndNew(false)
    }
  }

  const cfg = STATUS_CONFIG[form.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['In Stock']

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={back} className="-ml-2">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-bold">
              {mode === 'edit' ? 'Edit Asset' : 'Add New Asset'}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === 'edit' ? 'Update asset information' : 'Create a new asset record'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {mode === 'new' && (
            <Button variant="outline" onClick={() => navigate('ocr-upload')}>
              <Wand2 className="h-4 w-4 mr-1.5" /> Use OCR Instead
            </Button>
          )}
          <Button variant="outline" onClick={back}>Cancel</Button>
          {mode === 'new' && (
            <Button variant="outline" onClick={() => handleSave(true)} disabled={saving}>
              {saveAndNew ? 'Saving...' : 'Save & New'}
            </Button>
          )}
          <Button onClick={() => handleSave(false)} disabled={saving}>
            <Save className="h-4 w-4 mr-1.5" /> {saving ? 'Saving...' : mode === 'edit' ? 'Update' : 'Save Asset'}
          </Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-5">
          {/* Basic Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4" /> Basic Information
              </CardTitle>
              <CardDescription>Core asset identification details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Asset Type *" icon={Package}>
                <Select value={form.assetTypeId} onValueChange={(v) => set('assetTypeId', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {types?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status" icon={CircleDot}>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Asset Tag" icon={Package}>
                <div className="flex gap-2">
                  <Input value={form.assetTag} onChange={(e) => set('assetTag', e.target.value)} placeholder="TC-000018" className="font-mono" />
                  <Button type="button" variant="outline" size="icon" onClick={() => set('assetTag', generateAssetTag())}>
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Field>
              <Field label="Make" icon={Package}>
                <Input value={form.make} onChange={(e) => set('make', e.target.value)} placeholder="Dell, HP, Apple..." />
              </Field>
              <Field label="Model" icon={Package}>
                <Input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="Optiplex 7010, iPhone 15..." />
              </Field>
              <Field label="Model Number" icon={Package}>
                <Input value={form.modelNumber} onChange={(e) => set('modelNumber', e.target.value)} placeholder="A3106, SM-A166P/DS" />
              </Field>
              <Field label="Serial Number (S/N)" icon={Package}>
                <Input value={form.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} placeholder="Serial number" className="font-mono" />
              </Field>
              <Field label="Part Number" icon={Package}>
                <Input value={form.partNumber} onChange={(e) => set('partNumber', e.target.value)} placeholder="Part number" />
              </Field>
            </CardContent>
          </Card>

          {/* Hardware */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4" /> Hardware Specifications
              </CardTitle>
              <CardDescription>Technical configuration details</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="CPU / Processor" icon={Cpu}>
                <Input value={form.cpu} onChange={(e) => set('cpu', e.target.value)} placeholder="Intel Core i5-3470" />
              </Field>
              <Field label="GPU / Graphics" icon={Cpu}>
                <Input value={form.gpu} onChange={(e) => set('gpu', e.target.value)} placeholder="Integrated / NVIDIA..." />
              </Field>
              <Field label="RAM" icon={MemoryStick}>
                <Input value={form.ram} onChange={(e) => set('ram', e.target.value)} placeholder="8GB, 16GB..." />
              </Field>
              <Field label="Storage" icon={HardDrive}>
                <Input value={form.storage} onChange={(e) => set('storage', e.target.value)} placeholder="512GB SSD, 1TB HDD" />
              </Field>
            </CardContent>
          </Card>

          {/* Mobile-specific */}
          {isMobile && (
            <Card className="border-l-4" style={{ borderLeftColor: '#10b981' }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Smartphone className="h-4 w-4" /> Mobile / Tablet Details
                </CardTitle>
                <CardDescription>Device-specific information for mobile assets</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <Field label="IMEI 1" icon={Smartphone}>
                  <Input value={form.imei1} onChange={(e) => set('imei1', e.target.value)} placeholder="15-digit IMEI" className="font-mono" maxLength={15} />
                </Field>
                <Field label="IMEI 2 (Dual SIM)" icon={Smartphone}>
                  <Input value={form.imei2} onChange={(e) => set('imei2', e.target.value)} placeholder="Second IMEI" className="font-mono" maxLength={15} />
                </Field>
                <Field label="ROM / Storage" icon={HardDrive}>
                  <Input value={form.rom} onChange={(e) => set('rom', e.target.value)} placeholder="128GB, 256GB" />
                </Field>
                <Field label="Color" icon={Package}>
                  <Input value={form.color} onChange={(e) => set('color', e.target.value)} placeholder="Black, Titanium..." />
                </Field>
                <Field label="OTP Mobile Number" icon={Smartphone}>
                  <Input value={form.otpMobileNumber} onChange={(e) => set('otpMobileNumber', e.target.value)} placeholder="+91-..." />
                </Field>
                <Field label="Google / Apple Account" icon={User}>
                  <Input value={form.googleAppleAccount} onChange={(e) => set('googleAppleAccount', e.target.value)} placeholder="email@icloud.com" />
                </Field>
              </CardContent>
            </Card>
          )}

          {/* Software */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" /> Software & Licenses
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Operating System" icon={CircleDot}>
                <Input value={form.os} onChange={(e) => set('os', e.target.value)} placeholder="Windows 11 PRO, macOS Sonoma" />
              </Field>
              <div className="hidden sm:block" />
              <Field label="OS License Key" icon={KeyRound}>
                <Input value={form.osKey} onChange={(e) => set('osKey', e.target.value)} placeholder="XXXXX-XXXXX-XXXXX" className="font-mono text-xs" />
              </Field>
              <Field label="Office License Key" icon={KeyRound}>
                <Input value={form.officeKey} onChange={(e) => set('officeKey', e.target.value)} placeholder="Office key" className="font-mono text-xs" />
              </Field>
            </CardContent>
          </Card>

          {/* Peripherals */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Monitor className="h-4 w-4" /> Peripherals
              </CardTitle>
              <CardDescription>Attached monitors, keyboards, and mice</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Monitor Make" icon={Monitor}><Input value={form.monitorMake} onChange={(e) => set('monitorMake', e.target.value)} /></Field>
                <Field label="Monitor Model"><Input value={form.monitorModel} onChange={(e) => set('monitorModel', e.target.value)} /></Field>
                <Field label="Monitor S/N"><Input value={form.monitorSn} onChange={(e) => set('monitorSn', e.target.value)} className="font-mono text-xs" /></Field>
                <Field label="Monitor Size"><Input value={form.monitorSize} onChange={(e) => set('monitorSize', e.target.value)} placeholder='24"' /></Field>
                <Field label="Monitor Part #"><Input value={form.monitorPartNumber} onChange={(e) => set('monitorPartNumber', e.target.value)} className="font-mono text-xs" /></Field>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Keyboard Make" icon={Keyboard}><Input value={form.keyboardMake} onChange={(e) => set('keyboardMake', e.target.value)} /></Field>
                <Field label="Keyboard Model"><Input value={form.keyboardModel} onChange={(e) => set('keyboardModel', e.target.value)} /></Field>
                <Field label="Keyboard S/N"><Input value={form.keyboardSn} onChange={(e) => set('keyboardSn', e.target.value)} className="font-mono text-xs" /></Field>
              </div>
              <Separator />
              <div className="grid gap-4 sm:grid-cols-4">
                <Field label="Mouse Make" icon={Mouse}><Input value={form.mouseMake} onChange={(e) => set('mouseMake', e.target.value)} /></Field>
                <Field label="Mouse Model"><Input value={form.mouseModel} onChange={(e) => set('mouseModel', e.target.value)} /></Field>
                <Field label="Mouse S/N"><Input value={form.mouseSn} onChange={(e) => set('mouseSn', e.target.value)} className="font-mono text-xs" /></Field>
                <Field label="Mouse P/N"><Input value={form.mousePn} onChange={(e) => set('mousePn', e.target.value)} className="font-mono text-xs" /></Field>
              </div>
            </CardContent>
          </Card>

          {/* Additional Technical Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Cpu className="h-4 w-4" /> Additional Technical Details
              </CardTitle>
              <CardDescription>IT-specific fields from Maylaa asset register</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Computer Name" icon={Package}>
                <Input value={form.computerName} onChange={(e) => set('computerName', e.target.value)} placeholder="PC-MAYLAA-001" className="font-mono" />
              </Field>
              <Field label="IP Address" icon={Package}>
                <Input value={form.ipAddress} onChange={(e) => set('ipAddress', e.target.value)} placeholder="192.168.1.100" className="font-mono" />
              </Field>
              <Field label="Device Type" icon={Package}>
                <Input value={form.deviceType} onChange={(e) => set('deviceType', e.target.value)} placeholder="Desktop, Laptop, POS..." />
              </Field>
              <Field label="Manufacture Year" icon={Calendar}>
                <Input value={form.manufactureYear} onChange={(e) => set('manufactureYear', e.target.value)} placeholder="2021" />
              </Field>
              <Field label="Quantity" icon={Package}>
                <Input value={form.qty} onChange={(e) => set('qty', e.target.value)} placeholder="1" />
              </Field>
              <Field label="Toners Model" icon={Package}>
                <Input value={form.tonersModel} onChange={(e) => set('tonersModel', e.target.value)} placeholder="Toner model for printers" />
              </Field>
              <Field label="Barcode Scanner Model" icon={Package}>
                <Input value={form.barcodeScannerModel} onChange={(e) => set('barcodeScannerModel', e.target.value)} />
              </Field>
              <Field label="Barcode Scanner S/N" icon={Package}>
                <Input value={form.barcodeScannerSn} onChange={(e) => set('barcodeScannerSn', e.target.value)} className="font-mono" />
              </Field>
              <Field label="Scale Machine IP" icon={Package}>
                <Input value={form.scaleMachineIpAddress} onChange={(e) => set('scaleMachineIpAddress', e.target.value)} placeholder="192.168.1.200" className="font-mono" />
              </Field>
              <Field label="HDD Installed Date" icon={Calendar}>
                <Input value={form.hddInstalledDate} onChange={(e) => set('hddInstalledDate', e.target.value)} placeholder="2023-06-15" />
              </Field>
              <Field label="HDD Installed Date 2" icon={Calendar}>
                <Input value={form.hddInstalledDate2} onChange={(e) => set('hddInstalledDate2', e.target.value)} placeholder="2024-01-10" />
              </Field>
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4" /> Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={form.comments}
                onChange={(e) => set('comments', e.target.value)}
                placeholder="Additional notes about this asset..."
                rows={3}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Assignment & Financial */}
        <div className="space-y-5">
          {/* Status preview */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <Package className={`h-6 w-6 ${cfg.text}`} />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Current Status</div>
                  <Badge variant="outline" className={`${cfg.bg} ${cfg.text} border-0 mt-0.5`}>{form.status}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4" /> Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Assigned To" icon={User}>
                <Select value={form.assignedToId} onValueChange={(v) => set('assignedToId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Unassigned —</SelectItem>
                    {persons?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName}{p.role ? ` (${p.role})` : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Department" icon={Building2}>
                <Select value={form.departmentId} onValueChange={(v) => set('departmentId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {depts?.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Location" icon={Building2}>
                <Select value={form.locationId} onValueChange={(v) => set('locationId', v === 'none' ? '' : v)}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {locs?.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          {/* Financial */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4" /> Purchase & Warranty
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field label="Purchase Date" icon={Calendar}>
                <Input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Field label="Cost" icon={DollarSign}>
                    <Input type="number" step="0.01" value={form.cost} onChange={(e) => set('cost', e.target.value)} placeholder="0.00" />
                  </Field>
                </div>
                <Field label="Currency">
                  <Select value={form.currency} onValueChange={(v) => set('currency', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="GBP">GBP</SelectItem>
                      <SelectItem value="INR">INR</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Warranty Expiry" icon={ShieldCheck}>
                <Input type="date" value={form.warrantyExpiry} onChange={(e) => set('warrantyExpiry', e.target.value)} />
              </Field>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
