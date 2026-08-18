// On-device photo quality check for the Report flow.
// - Person detection + object recognition via TensorFlow.js COCO-SSD (lazy-loaded).
// - Clarity check (brightness + blur) computed on a canvas.
// No servers, no API keys — everything runs in the browser.

import type { ObjectDetection } from '@tensorflow-models/coco-ssd'

export type RejectReason = 'person' | 'quality' | 'unrelated' | 'wrong_issue'

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: RejectReason; detected?: string }

// COCO classes that indicate an indoor / personal object rather than a
// public cleanliness issue → treat as unrelated/unsupported.
const UNRELATED_CLASSES = new Set([
  'laptop', 'tv', 'keyboard', 'mouse', 'remote', 'cell phone', 'book',
  'clock', 'teddy bear', 'microwave', 'oven', 'toaster', 'sink',
  'refrigerator', 'scissors', 'hair drier', 'toothbrush', 'wine glass',
  'fork', 'knife', 'spoon', 'laptop', 'tie',
])

let modelPromise: Promise<ObjectDetection> | null = null
async function getModel(): Promise<ObjectDetection> {
  if (!modelPromise) {
    modelPromise = (async () => {
      await import('@tensorflow/tfjs')
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      return cocoSsd.load({ base: 'lite_mobilenet_v2' })
    })()
  }
  return modelPromise
}

/** Mean brightness (0-255) and a blur score (higher = sharper). */
function analyzeClarity(img: HTMLImageElement): { brightness: number; sharpness: number } {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  ctx.drawImage(img, 0, 0, size, size)
  const { data } = ctx.getImageData(0, 0, size, size)

  // grayscale + brightness
  const gray = new Float64Array(size * size)
  let sum = 0
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const g = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    gray[p] = g
    sum += g
  }
  const brightness = sum / (size * size)

  // blur = variance of Laplacian (edge energy)
  let mean = 0
  const lap = new Float64Array(size * size)
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      const idx = y * size + x
      const v =
        4 * gray[idx] - gray[idx - 1] - gray[idx + 1] - gray[idx - size] - gray[idx + size]
      lap[idx] = v
      mean += v
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
  variance /= n
  return { brightness, sharpness: variance }
}

/**
 * Validate a captured photo before submission.
 * Order matters: privacy (person) → clarity → relevance.
 * Issue-matching is approximate on-device (can't reliably tell garbage vs
 * drain without a vision service) so a clear, person-free, on-topic photo passes.
 */
export async function validatePhoto(
  img: HTMLImageElement,
  _category: string,
): Promise<ValidationResult> {
  // 1. Clarity (fast, local)
  const { brightness, sharpness } = analyzeClarity(img)
  if (brightness < 35 || brightness > 245 || sharpness < 60) {
    return { ok: false, reason: 'quality' }
  }

  // 2. Person + object detection
  let predictions: { class: string; score: number; bbox: number[] }[] = []
  try {
    const model = await getModel()
    predictions = await model.detect(img, 20, 0.45)
  } catch {
    // If the model can't load (offline), skip detection but keep clarity gate.
    return { ok: true }
  }

  const imgArea = (img.naturalWidth || 1) * (img.naturalHeight || 1)

  // Never allow a person anywhere in the photo
  if (predictions.some((p) => p.class === 'person' && p.score >= 0.5)) {
    return { ok: false, reason: 'person' }
  }

  // Dominant indoor/personal object → unrelated / unsupported
  const unrelated = predictions.find((p) => {
    if (!UNRELATED_CLASSES.has(p.class) || p.score < 0.55) return false
    const [, , w, h] = p.bbox
    return (w * h) / imgArea > 0.15 // takes up a meaningful part of the frame
  })
  if (unrelated) {
    return { ok: false, reason: 'unrelated', detected: unrelated.class }
  }

  return { ok: true }
}
