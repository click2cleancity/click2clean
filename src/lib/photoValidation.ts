// On-device "Smart Garbage" photo validation for the Report flow.
// Everything runs in the browser (no servers / API keys):
//  - COCO-SSD  → people + indoor-object detection
//  - MobileNet → waste/garbage confidence (ImageNet waste-related classes)
//  - canvas    → brightness/blur clarity + automatic people blur
// Note: on-device garbage recognition is approximate; thresholds are lenient
// so genuine waste is rarely rejected. A cloud vision model would be exact.

import type { ObjectDetection } from '@tensorflow-models/coco-ssd'
import type { MobileNet } from '@tensorflow-models/mobilenet'

export type RejectReason = 'quality' | 'indoor' | 'no_garbage' | 'uncertain_garbage' | 'person_subject'

export interface ValidationOk {
  ok: true
  garbageConfidence: number
  peopleBlurred: boolean
  processedDataUrl?: string // set when faces were blurred
}
export interface ValidationFail {
  ok: false
  reason: RejectReason
  garbageConfidence?: number
}
export type ValidationResult = ValidationOk | ValidationFail

// COCO classes that strongly imply an indoor / private environment.
const INDOOR_CLASSES = new Set([
  'couch', 'bed', 'dining table', 'toilet', 'refrigerator', 'oven',
  'microwave', 'sink', 'tv', 'laptop', 'keyboard', 'mouse',
])

// ImageNet (MobileNet) class-name fragments that indicate waste.
const WASTE_HINTS = [
  'trash', 'garbage', 'ashcan', 'wastebin', 'bin', 'plastic bag', 'carton',
  'bottle', 'packet', 'paper towel', 'crate', 'bucket', 'barrel', 'litter',
  'can', 'sack', 'bag',
]

let cocoPromise: Promise<ObjectDetection> | null = null
let netPromise: Promise<MobileNet> | null = null

async function getCoco(): Promise<ObjectDetection> {
  if (!cocoPromise) {
    cocoPromise = (async () => {
      await import('@tensorflow/tfjs')
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      return cocoSsd.load({ base: 'lite_mobilenet_v2' })
    })()
  }
  return cocoPromise
}
async function getNet(): Promise<MobileNet> {
  if (!netPromise) {
    netPromise = (async () => {
      await import('@tensorflow/tfjs')
      const mobilenet = await import('@tensorflow-models/mobilenet')
      return mobilenet.load({ version: 2, alpha: 1.0 })
    })()
  }
  return netPromise
}

function analyzeClarity(img: HTMLImageElement): { brightness: number; sharpness: number } {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)
  const gray = new Float64Array(size * size)
  let sum = 0
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    gray[p] = g
    sum += g
  }
  const brightness = sum / (size * size)
  let mean = 0
  const lap = new Float64Array(size * size)
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x
      lap[idx] = 4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - size] - gray[idx + size]
      mean += lap[idx]
    }
  }
  const n = (size - 2) * (size - 2)
  mean /= n
  let variance = 0
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const d = lap[y * size + x] - mean
      variance += d * d
    }
  }
  return { brightness, sharpness: variance / n }
}

/** Blur the head area (top ~45%) of each detected person, keep waste visible. */
function blurPeople(img: HTMLImageElement, boxes: number[][]): string {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, w, h)
  for (const [bx, by, bw, bh] of boxes) {
    const headH = Math.max(bh * 0.45, 24)
    ctx.save()
    ctx.beginPath()
    ctx.rect(bx, by, bw, headH)
    ctx.clip()
    ctx.filter = 'blur(14px)'
    ctx.drawImage(img, 0, 0, w, h)
    ctx.restore()
  }
  return canvas.toDataURL('image/jpeg', 0.85)
}

export async function validateGarbagePhoto(img: HTMLImageElement): Promise<ValidationResult> {
  // 1. Clarity (dark / blurry)
  const { brightness, sharpness } = analyzeClarity(img)
  if (brightness < 35 || brightness > 248 || sharpness < 55) {
    return { ok: false, reason: 'quality' }
  }

  const imgArea = (img.naturalWidth || 1) * (img.naturalHeight || 1)

  // 2. Object detection (people + indoor cues)
  let predictions: { class: string; score: number; bbox: number[] }[] = []
  try {
    const coco = await getCoco()
    predictions = await coco.detect(img, 20, 0.45)
  } catch {
    predictions = []
  }

  // Indoor environment → not a public waste spot
  const indoor = predictions.find(
    (p) => INDOOR_CLASSES.has(p.class) && p.score >= 0.55 &&
      (p.bbox[2] * p.bbox[3]) / imgArea > 0.2,
  )
  if (indoor) return { ok: false, reason: 'indoor' }

  // People
  const personBoxes = predictions.filter((p) => p.class === 'person' && p.score >= 0.5)
  const largestPerson = personBoxes.reduce(
    (m, p) => Math.max(m, (p.bbox[2] * p.bbox[3]) / imgArea), 0,
  )
  if (largestPerson > 0.4) {
    // The photo is mostly a person, not a waste spot
    return { ok: false, reason: 'person_subject' }
  }

  // 3. Garbage confidence (MobileNet waste classes + coco waste objects)
  let wasteConfidence = 0
  try {
    const net = await getNet()
    const results = await net.classify(img, 10)
    for (const r of results) {
      const name = r.className.toLowerCase()
      if (WASTE_HINTS.some((h) => name.includes(h))) wasteConfidence += r.probability
    }
  } catch {
    // If the classifier can't load, don't hard-block on garbage detection.
    wasteConfidence = 0.15
  }
  // coco objects that are commonly litter give a small boost
  const litterBoost = predictions
    .filter((p) => ['bottle', 'cup', 'wine glass'].includes(p.class))
    .reduce((s) => s + 0.08, 0)
  const garbageConfidence = Math.min(1, wasteConfidence + litterBoost)

  if (garbageConfidence < 0.04) return { ok: false, reason: 'no_garbage', garbageConfidence }
  if (garbageConfidence < 0.10) return { ok: false, reason: 'uncertain_garbage', garbageConfidence }

  // 4. Passed — blur any (non-dominant) people for privacy
  let processedDataUrl: string | undefined
  let peopleBlurred = false
  if (personBoxes.length > 0) {
    processedDataUrl = blurPeople(img, personBoxes.map((p) => p.bbox))
    peopleBlurred = true
  }

  return { ok: true, garbageConfidence, peopleBlurred, processedDataUrl }
}
