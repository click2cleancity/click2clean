import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Slider from '../lib/reactSlick'
import { motion } from 'motion/react'
import { BookOpen, Camera, ChevronRight, Eye, MapPin, ShieldCheck } from 'lucide-react'
import { inspirationSlides } from '../data/mock'
import { formatReportWhen } from '../lib/time'
import { getPhone } from '../lib/storage'
import { supabase } from '../supabase'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

const CAT_EMOJI: Record<string, string> = {
  garbage: '🗑️', pothole: '🕳️', streetlight: '💡',
  drain: '🌊', water: '💧', other: '📌',
}

// Heatmap color ramp: low density → yellow, high density → deep indigo
const HEAT_GRADIENT: Record<number, string> = {
  0.0: '#fde047',
  0.3: '#fb923c',
  0.5: '#ef4444',
  0.7: '#c026d3',
  1.0: '#312e81',
}

const CAT_BADGE: Record<string, string> = {
  garbage: 'bg-red-100 text-red-700',
  pothole: 'bg-orange-100 text-orange-700',
  streetlight: 'bg-yellow-100 text-yellow-700',
  drain: 'bg-blue-100 text-blue-700',
  water: 'bg-cyan-100 text-cyan-700',
  other: 'bg-slate-100 text-slate-700',
}

interface Report {
  id: string
  category: string
  description?: string
  photo_url?: string
  lat: number
  lng: number
  address: string
  sector: string
  status: string
  support_count: number
  created_at: string
}

// ── Mini Map Component ─────────────────────────────
function MiniMap({ reports }: { reports: Report[] }) {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return
    if (mapInstance.current) {
      mapInstance.current.remove()
      mapInstance.current = null
    }

    const map = L.map(mapRef.current, {
      dragging: true,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
      doubleClickZoom: true,
      touchZoom: true,
      zoomControl: false,
      attributionControl: false,
    })

    L.control.zoom({ position: 'bottomleft' }).addTo(map)

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    const valid = reports.filter(r => r.lat && r.lng)

    if (valid.length === 0) {
      // Default to Navi Mumbai
      map.setView([19.033, 73.029], 12)
    } else {
      // Heatmap layer
      L.heatLayer(
        valid.map(r => [r.lat, r.lng, 0.8]),
        { radius: 25, blur: 18, maxZoom: 17, minOpacity: 0.35, gradient: HEAT_GRADIENT }
      ).addTo(map)

      // White dots at each report location — tap to open on the full map
      valid.forEach(r => {
        const dot = L.circleMarker([r.lat, r.lng], {
          radius: 5,
          fillColor: '#ffffff',
          color: '#312e81',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map)
        dot.on('click', () => navigate(`/map?report=${r.id}`))
      })

      // Fit to all reports
      if (valid.length === 1) {
        map.setView([valid[0].lat, valid[0].lng], 14)
      } else {
        const group = L.featureGroup(
          valid.map(r => L.circleMarker([r.lat, r.lng]))
        )
        if (group.getBounds().isValid()) {
          map.fitBounds(group.getBounds().pad(0.3))
        }
      }
    }

    setTimeout(() => map.invalidateSize(), 100)
    mapInstance.current = map

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [reports, navigate])

  return (
    <div
      ref={mapRef}
      className="absolute inset-0 w-full h-full z-0"
    />
  )
}

// ── Main Home Component ────────────────────────────
export default function Home() {
  const [myReports, setMyReports] = useState<Report[]>([])
  const [allReports, setAllReports] = useState<Report[]>([])
  const [points, setPoints] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const phone10 = getPhone()
      const fullPhone = `+91${phone10}`

      // Get user
      const { data: user } = await supabase
        .from('users')
        .select('id, points')
        .eq('phone', fullPhone)
        .maybeSingle()

      if (user) {
        setPoints(user.points ?? 0)

        // Get my reports
        const { data: mine } = await supabase
          .from('reports')
          .select('*')
          .eq('citizen_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (mine) setMyReports(mine)
      }

      // Get all public reports
      const { data: all } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (all) setAllReports(all)
      setLoading(false)
    }

    loadData()
  }, [])

  const resolvedCount = myReports.filter(r => r.status === 'resolved').length
  const pendingCount = allReports.filter(r => r.status === 'pending').length

  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">

      {/* Report CTA — hero */}
      <motion.section
        variants={item}
        className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 px-5 py-5 text-white shadow-xl"
      >
        {/* Background illustration */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-right bg-no-repeat opacity-90"
          style={{ backgroundImage: `url(${import.meta.env.BASE_URL}report-hero.png)` }}
        />

        {/* Blinking eye */}
        <Eye
          className="animate-blink pointer-events-none absolute right-6 top-14 z-10 h-16 w-16 text-white/90"
          strokeWidth={1.5}
          aria-hidden
        />

        {/* Content */}
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-lime-300">
            Your city needs your eyes
          </p>

          <h2 className="mt-2 text-[26px] font-extrabold leading-[1.08]">
            See it. Snap it.
            <br />
            <span className="relative inline-block text-lime-300">
              Report it.
              <svg
                viewBox="0 0 120 12"
                className="absolute -bottom-1 left-0 w-[92%]"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M2 8c22-6 60-7 116-3"
                  stroke="#bef264"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h2>

          <p className="mt-3 max-w-[15rem] text-[13px] leading-tight text-blue-100">
            Your photo helps the city identify and track cleanliness issues.
          </p>

          <Link
            to="/report"
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-3 text-[15px] font-bold text-blue-700 shadow-lg transition-transform active:scale-[0.98]"
          >
            <Camera className="h-5 w-5" aria-hidden />
            Report an issue
          </Link>

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] font-medium text-blue-100">
            <ShieldCheck className="h-4 w-4 shrink-0 text-lime-300" aria-hidden />
            Every report helps make your neighbourhood cleaner.
          </p>
        </div>
      </motion.section>

      {/* Stats */}
      <motion.section variants={item} className="grid grid-cols-3 gap-2">
        <div className="glass-panel rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{myReports.length}</p>
          <p className="text-[11px] font-medium leading-tight text-slate-600">Your reports</p>
        </div>
        <div className="glass-panel rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{points}</p>
          <p className="text-[11px] font-medium leading-tight text-slate-600">Points</p>
        </div>
        <div className="glass-panel rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{resolvedCount}</p>
          <p className="text-[11px] font-medium leading-tight text-slate-600">Resolved</p>
        </div>
      </motion.section>

      {/* Public Map Widget — Square 1:1 */}
      <motion.section variants={item}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Public Map</h3>
          <Link to="/map" className="text-sm font-semibold text-blue-700">
            View full map
          </Link>
        </div>
        <div className="glass-panel rounded-2xl overflow-hidden relative aspect-square">

          {/* Real Leaflet Mini Map (interactive: pan + zoom) */}
          <MiniMap reports={allReports} />

          {/* Top left — total count */}
          <div className="absolute top-3 left-3 z-[500] rounded-2xl bg-white/95 shadow-lg px-3 py-2 pointer-events-none">
            <p className="text-[10px] text-slate-500 font-medium">Total Reports</p>
            <p className="text-3xl font-bold text-slate-900 leading-none mt-0.5">
              {loading ? '...' : allReports.length}
            </p>
          </div>

          {/* Top right — pending count */}
          <div className="absolute top-3 right-3 z-[500] rounded-2xl bg-orange-500/90 shadow-lg px-3 py-2 pointer-events-none">
            <p className="text-[10px] text-orange-100 font-medium">Pending</p>
            <p className="text-2xl font-bold text-white leading-none mt-0.5">
              {loading ? '...' : pendingCount}
            </p>
          </div>

          {/* Bottom — explore full map */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center z-[500]">
            <Link to="/map" className="rounded-full bg-white/95 shadow-md px-4 py-1.5 text-xs font-semibold text-blue-700">
              🔍 Explore full map
            </Link>
          </div>

        </div>
      </motion.section>

      {/* My Reports */}
      <motion.section variants={item}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900">Your reports</h3>
          {myReports.length > 0 && (
            <Link to="/issues" className="shrink-0 text-sm font-semibold text-blue-700">
              View all
            </Link>
          )}
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="glass-panel rounded-2xl p-5 text-center">
              <p className="text-sm text-slate-500">Loading your reports...</p>
            </div>
          ) : myReports.length === 0 ? (
            <div className="glass-panel rounded-2xl p-5 text-center">
              <p className="text-sm font-medium text-slate-700">No reports yet</p>
              <p className="mt-1 text-xs text-slate-600">
                Capture an issue on the street to see it here.
              </p>
              <Link to="/report"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow-md">
                New report
              </Link>
            </div>
          ) : (
            myReports.map(r => (
              <article key={r.id} className="glass-panel flex gap-3 rounded-2xl p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
                  {r.photo_url ? (
                    <img src={r.photo_url} alt=""
                      className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">
                      {CAT_EMOJI[r.category]}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${CAT_BADGE[r.category]}`}>
                    {CAT_EMOJI[r.category]} {r.category}
                  </span>
                  <p className="mt-1 flex items-center gap-1 text-sm text-slate-600 truncate">
                    <MapPin size={12} className="shrink-0 text-blue-500" />
                    <span className="truncate">{r.address || r.sector}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatReportWhen(r.created_at)}</span>
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${
                      r.status === 'resolved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-800'
                    }`}>{r.status}</span>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </motion.section>

      {/* Daily Inspiration */}
      <motion.section variants={item}>
        <h3 className="mb-2 text-lg font-bold text-slate-900">Daily inspiration</h3>
        <div className="glass-panel inspiration-panel overflow-hidden rounded-[24px] p-0">
          <Slider dots infinite speed={450} slidesToShow={1} slidesToScroll={1}
            autoplay autoplaySpeed={4500} arrows={false} className="inspiration-slider">
            {inspirationSlides.map((slide) => (
              <div key={slide.title} className="outline-none">
                <div className={`flex min-h-[168px] w-full flex-col justify-center bg-gradient-to-br px-6 py-8 text-white shadow-inner ${slide.gradient}`}>
                  <p className="text-xl font-bold leading-tight drop-shadow-sm">{slide.title}</p>
                  <p className="mt-3 max-w-[20rem] text-sm leading-relaxed text-white/95 drop-shadow-sm">
                    {slide.body}
                  </p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </motion.section>

      {/* Learn More */}
      <motion.section variants={item}>
        <Link to="/educate"
          className="group glass-panel flex items-center gap-4 rounded-2xl p-4 shadow-sm ring-1 ring-white/80 transition hover:ring-2 hover:ring-blue-300/60">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-md">
            <BookOpen className="h-7 w-7" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-bold text-slate-900">Learn how reporting helps</p>
            <p className="mt-0.5 text-sm text-slate-600">
              Photos, safety & how cities triage issues.
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden />
        </Link>
      </motion.section>

    </motion.div>
  )
}