import { useEffect, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { supabase } from '../supabase'
import { ArrowLeft, Filter, X } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── Types ──────────────────────────────────────────
type Category = 'garbage' | 'pothole' | 'streetlight' | 'drain' | 'water' | 'other'
type Status = 'pending' | 'resolved'

interface Report {
  id: string
  category: Category
  description?: string
  photo_url?: string
  lat: number
  lng: number
  address: string
  sector: string
  status: Status
  support_count: number
  created_at: string
}

// ── Category config ────────────────────────────────
const CAT_CONFIG: Record<Category, { emoji: string; label: string; color: string }> = {
  garbage:     { emoji: '🗑️', label: 'Garbage',     color: '#ef4444' },
  pothole:     { emoji: '🕳️', label: 'Pothole',     color: '#f97316' },
  streetlight: { emoji: '💡', label: 'Streetlight', color: '#eab308' },
  drain:       { emoji: '🌊', label: 'Drain',       color: '#3b82f6' },
  water:       { emoji: '💧', label: 'Water',       color: '#06b6d4' },
  other:       { emoji: '📌', label: 'Other',       color: '#6b7280' },
}

// ── Create colored circle marker ───────────────────
function makeMarker(report: Report): L.CircleMarker {
  const cfg = CAT_CONFIG[report.category] ?? CAT_CONFIG.other
  return L.circleMarker([report.lat, report.lng], {
    radius: 10,
    fillColor: report.status === 'resolved' ? '#22c55e' : cfg.color,
    color: '#ffffff',
    weight: 2,
    opacity: 1,
    fillOpacity: 0.9,
  })
}

// ── Popup HTML ─────────────────────────────────────
// @ts-ignore
function makePopup(report: Report): string {
  const cfg = CAT_CONFIG[report.category] ?? CAT_CONFIG.other
  const date = new Date(report.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  })
  const statusColor = report.status === 'resolved' ? '#22c55e' : '#f97316'
  const statusLabel = report.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'

  return `
    <div style="font-family:system-ui,sans-serif;min-width:200px;max-width:260px">
      ${report.photo_url ? `
        <img src="${report.photo_url}" 
          style="width:100%;height:130px;object-fit:cover;border-radius:8px;margin-bottom:8px" />
      ` : ''}
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
        <span style="font-size:18px">${cfg.emoji}</span>
        <strong style="font-size:14px;color:#1e293b">${cfg.label}</strong>
        <span style="margin-left:auto;font-size:11px;font-weight:600;color:${statusColor}">${statusLabel}</span>
      </div>
      <p style="font-size:12px;color:#64748b;margin:0 0 4px">${report.address || report.sector}</p>
      ${report.description ? `<p style="font-size:12px;color:#475569;margin:0 0 4px">"${report.description}"</p>` : ''}
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px;padding-top:6px;border-top:1px solid #e2e8f0">
        <span style="font-size:11px;color:#94a3b8">${date}</span>
        <span style="font-size:11px;color:#64748b">👀 ${report.support_count} see this</span>
      </div>
    </div>
  `
}

// ── Main Component ─────────────────────────────────
export default function PublicMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markersRef = useRef<Map<string, L.CircleMarker>>(new Map())

  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Category | 'all'>('all')
  const [statusFilter, setStatusFilter] = useState<Status | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  // ── Load reports from Supabase ─────────────────
  useEffect(() => {
    async function loadReports() {
      setLoading(true)
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (!error && data) {
        const valid = data.filter(r => r.lat && r.lng)
        setReports(valid)
      }
      setLoading(false)
    }
    loadReports()

    // Realtime — new reports appear instantly
    const channel = supabase
      .channel('public-map-reports')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
      }, (payload) => {
        const r = payload.new as Report
        if (r.lat && r.lng) {
          setReports(prev => [r, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // ── Init map ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    mapInstance.current = L.map(mapRef.current, {
      center: [19.033, 73.029], // Navi Mumbai
      zoom: 12,
      zoomControl: true,
    })
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapInstance.current)

    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [])

  // ── Update markers when reports or filters change ─
  useEffect(() => {
    const map = mapInstance.current
    if (!map) return

    // Remove old markers
    markersRef.current.forEach(m => m.remove())
    markersRef.current.clear()

    // Filter reports
    const filtered = reports.filter(r => {
      if (filter !== 'all' && r.category !== filter) return false
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      return true
    })

    // Add new markers
    filtered.forEach(report => {
      const marker = makeMarker(report)
      marker.addTo(map)
      marker.on('click', () => setSelectedReport(report))
      markersRef.current.set(report.id, marker)
    })

    // Fit bounds if reports exist
    if (filtered.length > 0 && reports.length === filtered.length) {
      const group = L.featureGroup(Array.from(markersRef.current.values()))
      if (group.getBounds().isValid()) {
        map.fitBounds(group.getBounds().pad(0.2))
      }
    }
  }, [reports, filter, statusFilter])

  const filteredCount = reports.filter(r => {
    if (filter !== 'all' && r.category !== filter) return false
    if (statusFilter !== 'all' && r.status !== statusFilter) return false
    return true
  }).length

  return (
    <div className="relative flex h-dvh flex-col">

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-[1000] flex items-center gap-2 px-3 py-3">
        <Link to="/"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md">
          <ArrowLeft size={18} className="text-slate-700" />
        </Link>
        <div className="flex-1 rounded-full bg-white shadow-md px-4 py-2">
          <p className="text-sm font-semibold text-slate-800">
            🗺️ Public Map
            {loading ? (
              <span className="ml-2 text-xs font-normal text-slate-400">Loading...</span>
            ) : (
              <span className="ml-2 text-xs font-normal text-slate-400">
                {filteredCount} report{filteredCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md"
        >
          <Filter size={16} className={showFilters ? 'text-blue-600' : 'text-slate-700'} />
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="absolute top-16 left-3 right-3 z-[1000] rounded-2xl bg-white shadow-xl p-4">
          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setFilter('all')}
              className={`rounded-full px-3 py-1 text-xs font-medium border ${filter === 'all' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
            >All</button>
            {Object.entries(CAT_CONFIG).map(([id, cfg]) => (
              <button key={id}
                onClick={() => setFilter(id as Category)}
                className={`rounded-full px-3 py-1 text-xs font-medium border ${filter === id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
              >{cfg.emoji} {cfg.label}</button>
            ))}
          </div>
          <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</p>
          <div className="flex gap-2">
            {(['all', 'pending', 'resolved'] as const).map(s => (
              <button key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-full px-3 py-1 text-xs font-medium border capitalize ${statusFilter === s ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}
              >{s === 'all' ? 'All' : s === 'pending' ? '⏳ Pending' : '✅ Resolved'}</button>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      <div ref={mapRef} className="flex-1 z-0" />

      {/* Report Card (bottom sheet) */}
      {selectedReport && (
        <div className="absolute bottom-0 left-0 right-0 z-[1000] rounded-t-3xl bg-white shadow-2xl p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{CAT_CONFIG[selectedReport.category]?.emoji}</span>
              <div>
                <p className="font-bold text-slate-900">{CAT_CONFIG[selectedReport.category]?.label}</p>
                <p className="text-xs text-slate-500">{selectedReport.address || selectedReport.sector}</p>
              </div>
            </div>
            <button onClick={() => setSelectedReport(null)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <X size={16} className="text-slate-600" />
            </button>
          </div>

          {selectedReport.photo_url && (
            <img src={selectedReport.photo_url} alt="Issue"
              className="w-full h-40 object-cover rounded-2xl mb-3" />
          )}

          {selectedReport.description && (
            <p className="text-sm text-slate-600 mb-3">"{selectedReport.description}"</p>
          )}

          <div className="flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              selectedReport.status === 'resolved'
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {selectedReport.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(selectedReport.created_at).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short'
              })}
            </span>
            <span className="text-xs text-slate-500">👀 {selectedReport.support_count} see this</span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-3 z-[999] rounded-xl bg-white/90 shadow p-2 text-xs space-y-1">
        <p className="font-semibold text-slate-600 mb-1">Legend</p>
        {Object.entries(CAT_CONFIG).map(([, cfg]) => (
          <div key={cfg.label} className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full" style={{ background: cfg.color }} />
            <span className="text-slate-600">{cfg.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full bg-green-500" />
          <span className="text-slate-600">Resolved</span>
        </div>
      </div>

    </div>
  )
}