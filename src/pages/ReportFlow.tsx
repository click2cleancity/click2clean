import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, ArrowLeft, Camera, CheckCircle2, Loader2, MapPin, RefreshCw } from 'lucide-react'
import { supabase } from '../supabase'
import AccountabilityCard from '../components/AccountabilityCard'
import { getPhone } from '../lib/storage'
import { compressDataUrlToJpeg } from '../lib/imageCompress'
import { reverseGeocodeLabel } from '../lib/reverseGeocode'
import { tryGpsFromPhotoFile } from '../lib/exifGeo'
import { validateGarbagePhoto, type ValidationResult } from '../lib/photoValidation'
import { getAccountability } from '../lib/accountability'

const CATEGORIES = [
  { id: 'garbage',     emoji: '🗑️', label: 'Garbage' },
  { id: 'pothole',     emoji: '🕳️', label: 'Pothole' },
  { id: 'streetlight', emoji: '💡', label: 'Streetlight' },
  { id: 'drain',       emoji: '🌊', label: 'Drain' },
  { id: 'water',       emoji: '💧', label: 'Water' },
  { id: 'other',       emoji: '📌', label: 'Other' },
] as const

type Category = typeof CATEGORIES[number]['id']
type Step = 'photo' | 'details' | 'validating' | 'preview' | 'submitting' | 'done'

interface GeoInfo {
  lat: number
  lng: number
  address: string
  sector: string
  accuracy?: number
}

async function uploadToCloudinary(file: File): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)
  formData.append('folder', 'click2clean')
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )
  if (!res.ok) throw new Error('Photo upload failed')
  const data = await res.json()
  return data.secure_url
}

export default function ReportFlow() {
  const nav = useNavigate()
  const [step, setStep] = useState<Step>('photo')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [category, setCategory] = useState<Category>('garbage')
  const [description, setDescription] = useState('')
  const [geo, setGeo] = useState<GeoInfo | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const [locationExact, setLocationExact] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const [validation, setValidation] = useState<ValidationResult | null>(null)
  const [responsibleName, setResponsibleName] = useState<string | null>(null)
  const [capturedAt, setCapturedAt] = useState<Date | null>(null)

  // Approximate fallback so a report is never blocked when GPS is unavailable.
  const FALLBACK_GEO = { lat: 19.033, lng: 73.029 } // Navi Mumbai

  function getBrowserPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'))
        return
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 30000,
      })
    })
  }

  // Capture location: EXIF from photo first, then ask the browser for GPS
  // (this triggers the permission prompt), then fall back to approximate.
  async function captureLocation(file?: File | null) {
    setGeoLoading(true)
    setErr(null)
    try {
      let lat: number | null = null
      let lng: number | null = null
      let accuracy: number | undefined

      // 1. Try EXIF GPS embedded in the photo
      if (file) {
        try {
          const exif = await tryGpsFromPhotoFile(file)
          if (exif) { lat = exif.lat; lng = exif.lng }
        } catch { /* no exif */ }
      }

      // 2. Ask the browser for GPS (prompts for permission)
      if (lat == null || lng == null) {
        const pos = await getBrowserPosition()
        lat = pos.coords.latitude
        lng = pos.coords.longitude
        accuracy = pos.coords.accuracy
      }

      const address = await reverseGeocodeLabel(lat, lng).catch(() => null)
      setGeo({
        lat,
        lng,
        address: address ?? 'Pinned location',
        sector: address ?? 'Unknown Sector',
        accuracy,
      })
      setLocationExact(true)
    } catch (error) {
      console.error('GPS error:', error)
      // Don't block the report — use an approximate location the user can retry.
      setGeo({
        lat: FALLBACK_GEO.lat,
        lng: FALLBACK_GEO.lng,
        address: 'Approximate location',
        sector: 'Approximate',
      })
      setLocationExact(false)
      const insecure = typeof window !== 'undefined' && !window.isSecureContext
      setErr(
        insecure
          ? 'GPS needs a secure (https) connection, so an approximate location is used. Deploy or open over https for precise GPS.'
          : 'Could not get precise GPS. Using an approximate location — tap “Retry location” to enable it.'
      )
    } finally {
      setGeoLoading(false)
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null)
    setGeoLoading(true)

    try {
      // Compress image
      const dataUrl = await new Promise<string>((res) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result as string)
        reader.readAsDataURL(file)
      })
      const compressedDataUrl = await compressDataUrlToJpeg(dataUrl)
      const compressed = await fetch(compressedDataUrl)
        .then(r => r.blob())
        .then(b => new File([b], file.name, { type: 'image/jpeg' }))

      setPhotoFile(compressed)
      setPhotoPreview(compressedDataUrl)

      // Capture location using the original file (keeps EXIF)
      await captureLocation(file)
    } catch (error) {
      console.error('Photo error:', error)
      setErr('Could not process the photo. Please try again.')
      setGeoLoading(false)
    }
  }

  function goToDetails() {
    if (!photoFile) { setErr('Please take a photo first.'); return }
    if (geoLoading) { setErr('Getting location… please wait.'); return }
    if (!geo) { setErr('Location not captured yet. Please retry.'); return }
    setStep('details')
  }

  // Smart photo check: runs after the issue is selected, before submission.
  async function runValidation() {
    if (!photoPreview) return
    setValidation(null)
    setStep('validating')

    let result: ValidationResult
    try {
      const img = new Image()
      img.src = photoPreview
      await img.decode()
      result = await validateGarbagePhoto(img)
    } catch {
      // Never hard-block on an unexpected error in the check itself.
      result = { ok: true, garbageConfidence: 0.5, peopleBlurred: false }
    }
    setValidation(result)

    if (result.ok) {
      // Use the privacy-blurred image for submission when people were blurred
      if (result.processedDataUrl) {
        setPhotoPreview(result.processedDataUrl)
        try {
          const blob = await (await fetch(result.processedDataUrl)).blob()
          setPhotoFile(new File([blob], 'report.jpg', { type: 'image/jpeg' }))
        } catch { /* keep original file */ }
      }
      setCapturedAt(new Date())
      getAccountability(geo?.sector, geo?.address)
        .then((a) => setResponsibleName(a.primary.name))
        .catch(() => setResponsibleName(null))
      setStep('preview')
    }
    // On failure we stay on the 'validating' step showing the reason + Retake.
  }

  function retakePhoto() {
    setPhotoFile(null)
    setPhotoPreview(null)
    setGeo(null)
    setValidation(null)
    setErr(null)
    setStep('photo')
  }

  async function submitReport() {
    if (!photoFile || !geo) return
    setStep('submitting')
    setSubmitErr(null)

    try {
      // 1. Upload photo to Cloudinary
      const photoUrl = await uploadToCloudinary(photoFile)

      // 2. Get phone from storage — stored as 10 digits
      const phone10 = getPhone()
      const fullPhone = `+91${phone10}`

      // 3. Find or create user in Supabase
      let { data: user } = await supabase
        .from('users')
        .select('id, points')
        .eq('phone', fullPhone)
        .maybeSingle()

      if (!user) {
        // Create user if doesn't exist
        const { data: newUser, error: userError } = await supabase
          .from('users')
          .insert({ phone: fullPhone, language: 'en' })
          .select('id, points')
          .single()
        if (userError) throw userError
        user = newUser
      }

      // 4. Find matching ward (optional)
      const { data: ward } = await supabase
        .from('wards')
        .select('id')
        .ilike('name', `%${geo.sector}%`)
        .maybeSingle()

      // 5. Save report to Supabase
      const { data: report, error: reportError } = await supabase
        .from('reports')
        .insert({
          citizen_id: user!.id,
          category,
          description: description.trim() || null,
          photo_url: photoUrl,
          lat: geo.lat,
          lng: geo.lng,
          address: geo.address,
          sector: geo.sector,
          ward_id: ward?.id ?? null,
          status: 'pending',
          support_count: 0,
        })
        .select('id')
        .single()

      if (reportError) throw reportError

      // 6. Add reward points (best-effort log; points are computed from
      //    report count on Home/Earn, so this is not required for the balance)
      await supabase
        .from('rewards')
        .insert({
          citizen_id: user!.id,
          report_id: report.id,
          points: 10,
          reason: 'report_filed',
        })

      setStep('done')

    } catch (error) {
      console.error('Submit error:', error)
      setSubmitErr('Failed to submit report. Please try again.')
      setStep('details')
    }
  }

  return (
    <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-blue-50">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4">
        <Link to="/" className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg font-bold text-slate-900">Report Issue</h1>
      </div>

      <AnimatePresence mode="wait">

        {/* PHOTO STEP */}
        {step === 'photo' && (
          <motion.div key="photo" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-4 space-y-4">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-800">📸 Take a Photo</h2>
              <label className="block cursor-pointer">
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={handlePhoto} />
                {photoPreview ? (
                  <div className="relative">
                    <img src={photoPreview} alt="Issue" className="h-56 w-full rounded-2xl object-cover" />
                    <div className="absolute bottom-2 right-2 rounded-full bg-black/60 p-2 text-white">
                      <RefreshCw size={16} />
                    </div>
                  </div>
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-blue-300 bg-blue-50 px-4 text-center">
                    <Camera size={40} className="text-blue-400" />
                    <p className="text-sm font-medium text-blue-600">Tap to capture the waste</p>
                    <p className="text-xs text-slate-400">Capture the waste area clearly. Avoid people in the frame — location is added automatically.</p>
                  </div>
                )}
              </label>
              <div className="mt-3 flex items-center gap-2 text-sm">
                <MapPin size={14} className={geo ? (locationExact ? 'text-green-500' : 'text-amber-500') : 'text-slate-400'} />
                {geoLoading ? (
                  <span className="text-slate-400 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Getting location…</span>
                ) : geo ? (
                  <span className={locationExact ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>{geo.address}</span>
                ) : (
                  <span className="text-slate-400">Location will be captured with the photo</span>
                )}
              </div>
              {err && <p className="mt-2 text-sm text-amber-600">{err}</p>}
              {geo && !geoLoading && geo.accuracy != null && geo.accuracy > 100 && (
                <p className="mt-1 text-xs text-amber-600">Location accuracy is low. Move outdoors or enable precise location for a better pin.</p>
              )}
              {photoFile && !geoLoading && (
                <button
                  type="button"
                  onClick={() => captureLocation(photoFile)}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700"
                >
                  <RefreshCw size={12} /> Retry location
                </button>
              )}
            </div>
            <button onClick={goToDetails} disabled={!photoFile || geoLoading} className="w-full rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow disabled:opacity-50">
              Next →
            </button>
          </motion.div>
        )}

        {/* DETAILS STEP */}
        {step === 'details' && (
          <motion.div key="details" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-4 space-y-4">
            {photoPreview && <img src={photoPreview} alt="Issue" className="h-32 w-full rounded-2xl object-cover" />}
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-800">What is the issue?</h2>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center gap-1 rounded-2xl border-2 py-3 text-sm font-medium transition-all ${category === cat.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'}`}>
                    <span className="text-2xl">{cat.emoji}</span>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-semibold text-slate-800">Description (optional)</h2>
              <textarea rows={3} placeholder="Describe the issue briefly..." value={description}
                onChange={e => setDescription(e.target.value)} maxLength={200}
                className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
              <p className="mt-1 text-right text-xs text-slate-400">{description.length}/200</p>
            </div>
            {geo && (
              <div className="rounded-3xl bg-white p-4 shadow-sm flex items-start gap-3">
                <MapPin size={18} className={`mt-0.5 shrink-0 ${locationExact ? 'text-blue-500' : 'text-amber-500'}`} />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800">{geo.sector}</p>
                  <p className="text-xs text-slate-400">{geo.address}</p>
                  {!locationExact && (
                    <button
                      type="button"
                      onClick={() => captureLocation(photoFile)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600"
                    >
                      <RefreshCw size={12} /> Approximate — retry precise GPS
                    </button>
                  )}
                </div>
              </div>
            )}
            {submitErr && <p className="text-sm text-red-500 text-center">{submitErr}</p>}
            <div className="flex gap-3 pb-8">
              <button onClick={() => setStep('photo')} className="flex-1 rounded-full border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700">← Back</button>
              <button onClick={runValidation} className="flex-[2] rounded-full bg-blue-600 py-3 text-base font-semibold text-white shadow">Continue</button>
            </div>
          </motion.div>
        )}

        {/* VALIDATING STEP — quality check before submission */}
        {step === 'validating' && (
          <motion.div key="validating" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-5 px-6 py-16 text-center">

            {photoPreview && (
              <img src={photoPreview} alt="" className="h-36 w-36 rounded-3xl object-cover shadow-md" />
            )}

            {/* Checking */}
            {validation === null && (
              <>
                <Loader2 size={40} className="animate-spin text-blue-500" />
                <div>
                  <p className="text-lg font-semibold text-slate-800">Checking your photo…</p>
                  <p className="mt-1 text-sm text-slate-500">Making sure the waste spot is clearly visible.</p>
                </div>
              </>
            )}

            {/* Rejected — guidance, not just a block */}
            {validation && !validation.ok && (() => {
              const copy =
                validation.reason === 'indoor'
                  ? { title: 'Public waste location required', msg: 'This appears to be inside a building. Please capture a garbage spot on a public street, road or drain.' }
                  : validation.reason === 'person_subject'
                    ? { title: 'Please capture the waste spot', msg: 'The photo appears to focus on a person. Please point the camera towards the garbage or sanitation issue.' }
                    : validation.reason === 'no_garbage'
                      ? { title: 'Garbage not detected', msg: 'We couldn’t clearly detect a waste spot. Keep the garbage clearly inside the frame and capture again.' }
                      : validation.reason === 'uncertain_garbage'
                        ? { title: 'We’re not sure', msg: 'We couldn’t clearly identify the waste. Move a little closer so the waste spot is clearly visible.' }
                        : { title: 'Photo is unclear', msg: 'Hold your phone steady and capture the waste again in good light.' }
              return (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle size={34} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-800">{copy.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{copy.msg}</p>
                  </div>
                  <div className="flex w-full max-w-xs gap-3">
                    <button onClick={() => setStep('details')}
                      className="flex-1 rounded-full border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700">Back</button>
                    <button onClick={retakePhoto}
                      className="flex-1 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow">Retake Photo</button>
                  </div>
                </>
              )
            })()}
          </motion.div>
        )}

        {/* PREVIEW STEP — final review before submission */}
        {step === 'preview' && validation?.ok && (
          <motion.div key="preview" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="px-4 space-y-4">

            {/* Green confirmation */}
            <div className="rounded-3xl bg-green-50 p-4 ring-1 ring-green-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-green-600" />
                <p className="font-bold text-green-800">Waste detected</p>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-green-800">
                <li>✓ Waste detected</li>
                <li>✓ Location detected</li>
                <li>✓ People protected{validation.peopleBlurred ? ' (faces blurred)' : ''}</li>
                <li>✓ Real-time photo</li>
              </ul>
            </div>

            {photoPreview && (
              <img src={photoPreview} alt="Report" className="h-52 w-full rounded-2xl object-cover" />
            )}

            <div className="rounded-3xl bg-white p-4 shadow-sm space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Responsible person</p>
                <p className="mt-0.5 font-semibold text-slate-800">{responsibleName ?? 'Being assigned…'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Issue location</p>
                <p className="mt-0.5 text-sm text-slate-700">{geo?.address}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Detected issue</p>
                <p className="mt-0.5 text-sm text-slate-700">
                  {CATEGORIES.find(c => c.id === category)?.label ?? 'Waste'}
                  {description.trim() ? ` — ${description.trim()}` : ''}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Captured</p>
                <p className="mt-0.5 text-sm text-slate-700">
                  {(capturedAt ?? new Date()).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {submitErr && <p className="text-sm text-red-500 text-center">{submitErr}</p>}

            <div className="space-y-2 pb-8">
              <button onClick={submitReport}
                className="w-full rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-lg">
                Submit Report
              </button>
              <button onClick={retakePhoto}
                className="w-full rounded-full border border-slate-300 bg-white py-3 text-sm font-semibold text-slate-700">
                Delete &amp; Recapture
              </button>
            </div>
          </motion.div>
        )}

        {/* SUBMITTING STEP */}
        {step === 'submitting' && (
          <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center gap-4 px-4 py-20">
            <Loader2 size={48} className="animate-spin text-blue-500" />
            <p className="text-lg font-semibold text-slate-700">Submitting your report...</p>
            <p className="text-sm text-slate-400">Uploading photo and saving location</p>
          </motion.div>
        )}

        {/* DONE STEP */}
        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center gap-5 px-4 py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 size={48} className="text-green-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Report Submitted! 🎉</h2>
              <p className="mt-1 text-slate-500">Your report is now live on the public map.</p>
              <p className="mt-2 text-sm font-semibold text-blue-600">+10 points earned 🎉</p>
            </div>

            {/* Report details + accountability */}
            {geo && (() => {
              const cat = CATEGORIES.find(c => c.id === category)
              return (
                <div className="w-full max-w-sm space-y-3 text-left">
                  <div className="rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Report details</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat?.emoji}</span>
                      <span className="font-semibold text-slate-800">{cat?.label}</span>
                      <span className="ml-auto rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-semibold text-orange-700">⏳ Pending</span>
                    </div>
                    <div className="mt-2 flex items-start gap-2">
                      <MapPin size={14} className="mt-0.5 shrink-0 text-blue-500" />
                      <p className="text-sm text-slate-600">{geo.address}</p>
                    </div>
                    {description.trim() && (
                      <p className="mt-2 text-sm text-slate-500">"{description.trim()}"</p>
                    )}
                  </div>

                  <AccountabilityCard sector={geo.sector} address={geo.address} />
                </div>
              )
            })()}

            <div className="flex gap-3 w-full max-w-xs">
              <button onClick={() => { setStep('photo'); setPhotoFile(null); setPhotoPreview(null); setGeo(null); setDescription(''); setErr(null) }}
                className="flex-1 rounded-full border border-slate-300 bg-white py-3 text-sm font-semibold">Report Another</button>
              <button onClick={() => nav('/')} className="flex-1 rounded-full bg-blue-600 py-3 text-sm font-semibold text-white">Go Home</button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}