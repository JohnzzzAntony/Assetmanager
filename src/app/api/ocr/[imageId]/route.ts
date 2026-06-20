export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { imageRepo } from '@/lib/repo'
import { readFile } from 'fs/promises'
import path from 'path'

const OCR_PROMPT = `You are an IT asset identification assistant. Analyze this image of an IT asset.

Extract the following information if visible and return as JSON. If not visible, use null.

{
  "make": "Manufacturer brand",
  "model": "Model name",
  "modelNumber": "Model number",
  "serialNumber": "Serial number",
  "imei1": "15-digit IMEI if visible",
  "imei2": "Second IMEI if visible",
  "os": "Operating system",
  "assetType": "Desktop, Laptop, Mobile, Tablet, Monitor, Peripheral, or Other",
  "cpu": "CPU",
  "ram": "RAM",
  "storage": "Storage",
  "color": "Color",
  "rawText": "All visible text"
}

Return ONLY the JSON object.`

// meta/llama-3.2-11b-vision-instruct confirmed working with this API key
const NVIDIA_VISION_MODELS = [
  'meta/llama-3.2-11b-vision-instruct',
  'meta/llama-3.2-90b-vision-instruct',
  'microsoft/phi-3-vision-128k-instruct',
]

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

async function resizeForApi(buffer: Buffer): Promise<{ data: Buffer; mime: string }> {
  try {
    const sharp = (await import('sharp')).default
    const resized = await sharp(buffer)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer()
    return { data: resized, mime: 'image/jpeg' }
  } catch {
    return { data: buffer, mime: 'image/jpeg' }
  }
}

async function runNvidiaOcr(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY || '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'
  const endpoint = 'https://integrate.api.nvidia.com/v1/chat/completions'

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
          console.log(`[OCR reprocess] Success with model: ${model}`)
          return content
        }
      } else {
        const errText = await response.text()
        lastError = `${model} → ${response.status}: ${errText.slice(0, 120)}`
        console.warn(`[OCR reprocess] Model ${model} failed: ${response.status}`)
        if (response.status === 401 || response.status === 403) break
      }
    } catch (e) {
      lastError = `${model} → ${e instanceof Error ? e.message : String(e)}`
    }
  }

  throw new Error(`All NVIDIA models failed. Last error: ${lastError}`)
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ imageId: string }> }) {
  try {
    const { imageId } = await params
    const img = await imageRepo.get(imageId)
    if (!img) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

    // Build path relative to project root — works on Windows and Linux
    const relativePath = img.filePath.startsWith('/uploads/')
      ? img.filePath.slice(1)
      : img.filePath

    const fullPath = path.join(process.cwd(), relativePath)
    const rawBuffer = await readFile(fullPath)

    // Resize to stay within NVIDIA's base64 limit
    const { data: imageBuffer, mime: mimeType } = await resizeForApi(rawBuffer)
    const base64 = imageBuffer.toString('base64')

    const content = await runNvidiaOcr(base64, mimeType)
    const result = parseJsonResponse(content)

    await imageRepo.update(img.id, {
      processedText: content,
      ocrStatus: 'Success',
      ocrEngine: 'NVIDIA-VLM',
      parsedFields: JSON.stringify(result),
      processedAt: new Date().toISOString(),
    })

    return NextResponse.json({
      imageId: img.id,
      rawText: content,
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
    console.error('[OCR reprocess] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
