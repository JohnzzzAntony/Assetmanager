export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { imageRepo } from '@/lib/repo'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

// Use a relative path that works on any OS
const UPLOAD_DIR = path.join(process.cwd(), 'uploads')

const OCR_PROMPT = `You are an IT asset identification assistant. Analyze this image of an IT asset (computer, phone, tablet, monitor, peripheral, or spec label).

Extract the following information if visible in the image and return it as a JSON object. If a field is not visible, use null.

{
  "make": "Manufacturer brand (e.g. Dell, HP, Apple, Samsung, Lenovo, Motorola)",
  "model": "Model name (e.g. Optiplex 7010, iPhone 15 Pro Max, Galaxy A32)",
  "modelNumber": "Model number / part code (e.g. A3106, SM-A166P/DS)",
  "serialNumber": "Serial number (S/N, SN) - alphanumeric code",
  "imei1": "15-digit IMEI number if visible (mobile devices)",
  "imei2": "Second IMEI number if visible (dual SIM)",
  "os": "Operating system if mentioned (e.g. Windows 10 PRO, macOS Sonoma, Android 14, iOS 17)",
  "assetType": "Inferred type: Desktop, Laptop, Mobile, Tablet, Monitor, Peripheral, or Other",
  "cpu": "CPU/processor if mentioned (e.g. Intel Core i5-3470)",
  "ram": "RAM if mentioned (e.g. 8GB, 16GB)",
  "storage": "Storage if mentioned (e.g. 512GB SSD, 1TB HDD)",
  "color": "Color if mentioned",
  "rawText": "All visible text from the image, preserving layout"
}

Return ONLY the JSON object, no markdown fences, no extra text.`

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch {}
}

/**
 * Resize image to stay under 180KB for NVIDIA NIM base64 limit.
 * Uses sharp (already a project dependency).
 */
async function resizeForApi(buffer: Buffer): Promise<{ data: Buffer; mime: string }> {
  try {
    const sharp = (await import('sharp')).default
    // Resize to max 1024px on longest side, convert to JPEG for smaller size
    const resized = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
    return { data: resized, mime: 'image/jpeg' }
  } catch {
    // sharp not available or failed — return original
    return { data: buffer, mime: 'image/png' }
  }
}

// NVIDIA NIM models to try in order
// meta/llama-3.2-11b-vision-instruct confirmed working with this API key
const NVIDIA_VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',   // ✓ confirmed 200
  'meta/llama-3.2-90b-vision-instruct',   // larger, may work too
  'microsoft/phi-3-vision-128k-instruct', // fallback
]

async function runNvidiaOcr(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY || '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'
  const baseUrl = 'https://integrate.api.nvidia.com/v1'
  const endpoint = `${baseUrl}/chat/completions`

  const payload = {
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: OCR_PROMPT },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      },
    ],
    max_tokens: 1024,
    temperature: 0.1,
  }

  let lastError = ''
  for (const model of NVIDIA_VISION_MODELS) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ ...payload, model }),
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content || ''
        if (content) {
          console.log(`[OCR] Success with model: ${model}`)
          return content
        }
      } else {
        const errText = await response.text()
        lastError = `${model} → ${response.status}: ${errText.slice(0, 120)}`
        console.warn(`[OCR] Model ${model} failed: ${response.status}`)
        // 401 = bad key, no point trying more models
        if (response.status === 401 || response.status === 403) break
      }
    } catch (e) {
      lastError = `${model} → ${e instanceof Error ? e.message : String(e)}`
    }
  }

  throw new Error(`All NVIDIA models failed. Last error: ${lastError}`)
}

function parseJsonResponse(text: string): Record<string, unknown> {
  let cleaned = text.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '')
  }
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) return { rawText: text }
  try {
    return JSON.parse(cleaned.slice(start, end + 1))
  } catch {
    return { rawText: text }
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    await ensureUploadDir()
    const ext = path.extname(file.name) || '.png'
    const fileName = `${randomUUID()}${ext}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    const rawBuffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filePath, rawBuffer)

    // Resize image to stay under NVIDIA's 180KB base64 limit
    const { data: imageBuffer, mime: mimeType } = await resizeForApi(rawBuffer)
    const base64 = imageBuffer.toString('base64')

    console.log(`[OCR] Image size after resize: ${Math.round(imageBuffer.length / 1024)}KB (base64: ${Math.round(base64.length / 1024)}KB)`)

    // Create image record with pending status
    const img = await imageRepo.create({
      fileName: file.name,
      filePath: `/uploads/${fileName}`,
      mimeType: file.type || 'image/png',
      fileSize: file.size,
      ocrStatus: 'Pending',
      ocrEngine: 'NVIDIA-VLM',
    })

    // Run OCR with model fallback
    let result: Record<string, unknown> = {}
    let rawText = ''
    let ocrStatus = 'Success'
    try {
      const vlmResponse = await runNvidiaOcr(base64, mimeType)
      rawText = vlmResponse
      result = parseJsonResponse(vlmResponse)
      if (result.rawText && typeof result.rawText === 'string') {
        rawText = result.rawText
      }
    } catch (err) {
      ocrStatus = 'Failed'
      rawText = `OCR failed: ${err instanceof Error ? err.message : String(err)}`
      console.error('[OCR] All providers failed:', rawText)
    }

    await imageRepo.update(img.id, {
      processedText: rawText,
      ocrStatus,
      ocrEngine: 'NVIDIA-VLM',
      parsedFields: JSON.stringify(result),
      processedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      imageId: img.id,
      rawText,
      parsed: {
        make: result.make || undefined,
        model: result.model || undefined,
        modelNumber: result.modelNumber || undefined,
        serialNumber: result.serialNumber || undefined,
        imei1: result.imei1 || undefined,
        imei2: result.imei2 || undefined,
        os: result.os || undefined,
        assetType: result.assetType || undefined,
        cpu: result.cpu || undefined,
        ram: result.ram || undefined,
        storage: result.storage || undefined,
        color: result.color || undefined,
      },
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('OCR error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
