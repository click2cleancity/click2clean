import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Slider from '../lib/reactSlick'
import { motion, AnimatePresence } from 'motion/react'
import { ArrowLeft, Camera, CheckCircle2, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { tips } from '../data/mock'
import { tryGpsFromPhotoFile } from '../lib/exifGeo'
import { requestLocation, mapsUrl, type GeoResult } from '../lib/geo'
import { compressDataUrlToJpeg } from '../lib/imageCompress'
import { friendlyAreaLabel } from '../lib/reverseGeocode'
import { addPoints, addStoredReport } from '../lib/storage'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const categories = ['Street garbage', 'Broken light', 'Full dustbin', 'Open drain', 'Unsafe debris']

type LocState = 'idle' | 'locating' | 'ready' | 'error'

function placeLine(label: string, maxLen = 52): string {
  const s = friendlyAreaLabel(label).trim()
  if (s.length <= maxLen) return s
  return `${s.slice(0, maxLen - 1)}…`
}

export default function ReportFlow() {
  const nav = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [geo, setGeo] = useState<GeoResult | null>(null)
  const [geoSource, setGeoSource] = useState<'exif' | 'browser' | null>(null)
  const [locState, setLocState] = useState<LocState>('idle')
  const [geoError, setGeoError] = useState<string | null>(null)
  const [category, setCategory] = useState(categories[0])
  const [description, setDescription] = useState('')
  const [reportId] = useState(() => `C2C-${Date.now().toString(36).toUpperCase()}`)

  const canContinueStep1 = !!photoDataUrl && locState === 'ready' && !!geo

  async function onCaptureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setGeo(null)
    setGeoError(null)
    setGeoSource(null)
    setLocState('locating')

    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error('Could not read photo'))
      reader.readAsDataURL(f)
    })
    setPhotoDataUrl(dataUrl)

    const fromExif = await tryGpsFromPhotoFile(f)
    if (fromExif) {
      setGeo(fromExif)
      setGeoSource('exif')
      setLocState('ready')
      return
    }

    try {
      const g = await requestLocation()
      setGeo(g)
      setGeoSource('browser')
      setLocState('ready')
    } catch (err) {
      setGeoError((err as Error).message)
      setLocState('error')
    }
  }

  async function retryBrowserLocation() {
    if (!photoDataUrl) return
    setLocState('locating')
    setGeoError(null)
    try {
      const g = await requestLocation()
      setGeo(g)
      setGeoSource('browser')
      setLocState('ready')
    } catch (err) {
      setGeoError((err as Error).message)
      setLocState('error')
    }
  }

  async function submit() {
    if (!geo || !photoDataUrl) return

    let photoToStore = photoDataUrl
    try {
      photoToStore = await compressDataUrlToJpeg(photoDataUrl)
    } catch {
      /* use original if compression fails */
    }

    const report = {
      id: reportId,
      title: category,
      status: 'Submitted' as const,
      lat: geo.lat,
      lng: geo.lng,
      areaLabel: geo.label,
      createdAt: new Date().toISOString(),
      photoDataUrl: photoToStore,
      locationSource: geoSource ?? undefined,
    }

    try {
      addStoredReport(report)
    } catch {
      try {
        const smaller = await compressDataUrlToJpeg(photoDataUrl, 720, 0.75).catch(() => photoToStore)
        addStoredReport({ ...report, photoDataUrl: smaller })
      } catch {
        try {
          addStoredReport({ ...report, photoDataUrl: undefined })
        } catch {
          /* still navigate */
        }
      }
    }

    try {
      addPoints(50)
    } catch {
      /* ignore */
    }

    nav('/success', { replace: true, state: { reportId } })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-10 pt-4">
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-slate-800 shadow-sm ring-1 ring-white/80"
          aria-label="Back to home"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">New report</p>
          <h1 className="text-lg font-bold text-slate-900">Click to Clean</h1>
        </div>
      </div>

      <div className="mb-6 flex gap-2" aria-hidden>
        {([1, 2] as const).map((s) => (
          <div key={s} className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200/80">
            <motion.div
              className="h-full rounded-full bg-blue-600"
              initial={false}
              animate={{ width: step >= s ? '100%' : '0%' }}
              transition={{ duration: 0.35 }}
            />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.section
            key="s1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="glass-panel-strong rounded-[28px] p-4">
              <p className="text-sm font-semibold text-slate-800">Photo</p>
              <p className="mt-1 text-sm text-slate-600">Capture the issue clearly—avoid people&apos;s faces.</p>
              <label
                className={[
                  'mt-4 block w-full cursor-pointer rounded-3xl',
                  photoDataUrl
                    ? 'overflow-hidden ring-1 ring-slate-200/90'
                    : 'flex flex-col items-center justify-center border-2 border-dashed border-blue-300/80 bg-sky-50/80 py-12',
                ].join(' ')}
              >
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="sr-only"
                  onChange={onCaptureChange}
                />
                {photoDataUrl ? (
                  <img
                    src={photoDataUrl}
                    alt="Captured issue"
                    className="block max-h-[min(42vh,300px)] w-full object-cover object-center"
                  />
                ) : (
                  <>
                    <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-100 text-blue-700">
                      <Camera className="h-8 w-8" />
                    </span>
                    <span className="mt-3 text-sm font-semibold text-blue-800">Tap to open camera</span>
                    <span className="mt-1 text-xs text-slate-500">Camera capture only (no gallery picker)</span>
                  </>
                )}
              </label>
            </div>

            <div className="glass-panel-strong rounded-[28px] p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">Location</p>
                {photoDataUrl && locState === 'locating' ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold text-white">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                    Detecting…
                  </span>
                ) : null}
                {photoDataUrl && locState === 'ready' && geo ? (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    {geoSource === 'exif' ? 'From photo' : 'Device'}
                  </span>
                ) : null}
              </div>
              {!photoDataUrl ? (
                <p className="mt-1 text-sm text-slate-600">Location is added after you capture a photo.</p>
              ) : null}

              {photoDataUrl && locState === 'locating' ? (
                <div className="mt-3 flex items-center gap-2 rounded-2xl bg-slate-100/90 px-3 py-3 text-sm text-slate-600">
                  <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-600" aria-hidden />
                  Pinpointing from photo GPS or device…
                </div>
              ) : null}

              {photoDataUrl && locState === 'ready' && geo ? (
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-emerald-50/90 px-3 py-2.5 ring-1 ring-emerald-200/80">
                  <div className="flex min-w-0 items-center gap-2 text-sm text-emerald-900">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    <span className="truncate font-medium">{placeLine(geo.label)}</span>
                  </div>
                  <a
                    href={mapsUrl(geo.lat, geo.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-blue-700 underline"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                    Map
                  </a>
                </div>
              ) : null}

              {photoDataUrl && locState === 'error' ? (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50/90 px-3 py-3">
                  <p className="text-sm text-red-700" role="alert">
                    {geoError}
                  </p>
                  <p className="mt-2 text-sm font-medium text-red-800">Could not lock a location yet.</p>
                  <button
                    type="button"
                    onClick={retryBrowserLocation}
                    className="mt-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-red-800 ring-1 ring-red-200"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                    Retry with device location
                  </button>
                </div>
              ) : null}
            </div>

            <div className="px-0.5">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Tips</p>
              <Slider
                dots={false}
                infinite
                speed={400}
                slidesToShow={1}
                slidesToScroll={1}
                arrows={false}
                autoplay
                autoplaySpeed={5000}
                className="tips-slider"
              >
                {tips.map((t) => (
                  <div key={t} className="px-0.5 pb-1">
                    <p className="tips-tip border-l-4 border-amber-400 bg-slate-50/95 py-3 pl-3 pr-3 text-sm leading-snug text-slate-700">
                      {t}
                    </p>
                  </div>
                ))}
              </Slider>
            </div>

            <button
              type="button"
              disabled={!canContinueStep1}
              onClick={() => setStep(2)}
              className="w-full rounded-full bg-slate-500 py-3.5 text-base font-semibold text-white shadow-lg enabled:bg-blue-600 enabled:shadow-blue-600/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue
            </button>
          </motion.section>
        ) : null}

        {step === 2 && geo && photoDataUrl ? (
          <motion.section
            key="s2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
            >
              Edit photo &amp; location
            </button>

            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/60 px-3 py-2.5 ring-1 ring-slate-200/80">
              <div className="flex min-w-0 items-center gap-2 text-sm text-slate-800">
                <MapPin className="h-4 w-4 shrink-0 text-blue-600" aria-hidden />
                <span className="truncate font-medium">{placeLine(geo.label)}</span>
              </div>
              <a
                href={mapsUrl(geo.lat, geo.lng)}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-sm font-semibold text-blue-700 underline"
              >
                Open map
              </a>
            </div>

            <div className="glass-panel-strong rounded-[28px] p-4">
              <p className="text-sm font-semibold text-slate-800">Category</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {categories.map((c) => {
                  const selected = category === c
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={[
                        'rounded-full border-2 px-3.5 py-2 text-sm font-semibold transition',
                        selected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                          : 'border-slate-200 bg-white/80 text-slate-700 ring-1 ring-slate-200/80 hover:border-slate-300',
                      ].join(' ')}
                    >
                      {c}
                    </button>
                  )
                })}
              </div>

              <label className="mt-5 block text-sm font-semibold text-slate-800" htmlFor="desc">
                Details
              </label>
              <textarea
                id="desc"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what you see—landmarks help."
                className="mt-2 w-full resize-none rounded-2xl border-0 bg-slate-100/90 px-3 py-3 text-sm text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-500"
              />

              <div className="mt-4 flex gap-3 rounded-2xl bg-slate-50/90 p-3 ring-1 ring-slate-200/80">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-200">
                  <img
                    src={photoDataUrl}
                    alt=""
                    className="h-full w-full object-cover object-center"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-slate-500">Preview</p>
                  <p className="mt-0.5 font-semibold text-slate-900">{category}</p>
                  <p className="line-clamp-2 text-xs text-slate-600">{description || 'Add details above.'}</p>
                </div>
              </div>

              <p className="mt-4 text-center text-xs text-slate-500">
                Ticket <span className="font-mono font-semibold text-slate-700">{reportId}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => void submit()}
              className="w-full rounded-full bg-lime-500 py-3.5 text-base font-semibold text-white shadow-md active:scale-[0.99]"
            >
              Submit &amp; raise ticket
            </button>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
