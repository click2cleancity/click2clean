import { useEffect, useId, useRef, useState } from 'react'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize2, X } from 'lucide-react'
import { friendlyAreaLabel } from '../lib/reverseGeocode'
import type { StoredReport } from '../lib/storage'

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildHotspotMap(
  el: HTMLElement,
  reports: StoredReport[],
  opts: { interactive: boolean }
): L.Map {
  const map = L.map(el, {
    dragging: opts.interactive,
    scrollWheelZoom: opts.interactive,
    boxZoom: opts.interactive,
    keyboard: opts.interactive,
    doubleClickZoom: opts.interactive,
    touchZoom: opts.interactive,
    zoomControl: opts.interactive,
    attributionControl: true,
  })

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
  }).addTo(map)

  const layers: L.CircleMarker[] = []
  for (const r of reports) {
    const cm = L.circleMarker([r.lat, r.lng], {
      radius: opts.interactive ? 12 : 8,
      fillColor: '#2563eb',
      color: '#ffffff',
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9,
    }).addTo(map)
    const title = escapeHtml(r.title)
    const area = escapeHtml(friendlyAreaLabel(r.areaLabel))
    cm.bindPopup(
      `<div style="font-family:system-ui,sans-serif;font-size:13px;line-height:1.35"><strong>${title}</strong><br/><span style="color:#64748b">${area}</span></div>`
    )
    layers.push(cm)
  }

  if (reports.length === 1) {
    map.setView([reports[0].lat, reports[0].lng], opts.interactive ? 15 : 13)
  } else {
    const fg = L.featureGroup(layers)
    const b = fg.getBounds()
    if (b.isValid()) {
      map.fitBounds(b.pad(0.2))
    } else {
      map.setView([reports[0].lat, reports[0].lng], 12)
    }
  }

  requestAnimationFrame(() => map.invalidateSize())
  return map
}

function useReportsFingerprint(reports: StoredReport[]): string {
  return reports
    .map((r) => `${r.id}:${r.lat}:${r.lng}`)
    .sort()
    .join('|')
}

export function HotSpotSection({ reports }: { reports: StoredReport[] }) {
  const [expanded, setExpanded] = useState(false)
  const miniRef = useRef<HTMLDivElement>(null)
  const largeRef = useRef<HTMLDivElement>(null)
  const miniMap = useRef<L.Map | null>(null)
  const largeMap = useRef<L.Map | null>(null)
  const titleId = useId()
  const valid = reports.filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng))
  const fp = useReportsFingerprint(valid)

  useEffect(() => {
    if (expanded) {
      miniMap.current?.remove()
      miniMap.current = null
      return
    }
    if (valid.length === 0 || !miniRef.current) {
      miniMap.current?.remove()
      miniMap.current = null
      return
    }
    const el = miniRef.current
    miniMap.current?.remove()
    miniMap.current = null
    miniMap.current = buildHotspotMap(el, valid, { interactive: false })
    return () => {
      miniMap.current?.remove()
      miniMap.current = null
    }
  }, [expanded, fp])

  useEffect(() => {
    if (!expanded || valid.length === 0 || !largeRef.current) return
    const el = largeRef.current
    largeMap.current?.remove()
    largeMap.current = null
    largeMap.current = buildHotspotMap(el, valid, { interactive: true })
    const t = window.setTimeout(() => {
      largeMap.current?.invalidateSize()
    }, 200)
    return () => {
      window.clearTimeout(t)
      largeMap.current?.remove()
      largeMap.current = null
    }
  }, [expanded, fp])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [expanded])

  if (valid.length === 0) {
    return (
      <section aria-labelledby={titleId}>
        <h3 id={titleId} className="text-lg font-bold text-slate-900">
          Hot spot
        </h3>
        <p className="mt-1 text-xs text-slate-600">Map of where your reports were filed.</p>
        <div className="glass-panel mt-3 rounded-2xl p-5 text-center">
          <p className="text-sm font-medium text-slate-700">No locations yet</p>
          <p className="mt-1 text-xs text-slate-600">Submit a report with location to see hotspots here.</p>
        </div>
      </section>
    )
  }

  return (
    <section aria-labelledby={titleId}>
      <h3 id={titleId} className="text-lg font-bold text-slate-900">
        Hot spot
      </h3>
      <p className="mt-1 text-xs text-slate-600">Tap the map to enlarge and explore report locations.</p>

      <div className="glass-panel mt-3 overflow-hidden rounded-2xl ring-1 ring-slate-200/80">
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="group relative block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          aria-label="Open hotspot map full screen"
        >
          <div ref={miniRef} className="h-[200px] w-full [&_.leaflet-control-attribution]:text-[10px]" />
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-slate-900/55 via-transparent to-transparent opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
            <span className="mt-16 inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg ring-1 ring-slate-200">
              <Maximize2 className="h-4 w-4 text-blue-600" aria-hidden />
              Tap to enlarge
            </span>
          </div>
        </button>
        <p className="border-t border-slate-200/80 bg-white/60 px-3 py-2 text-center text-[11px] font-medium text-slate-500">
          {valid.length} report{valid.length === 1 ? '' : 's'} on map · OpenStreetMap
        </p>
      </div>

      {expanded ? (
        <div
          className="fixed inset-0 z-[100] flex min-h-0 flex-col bg-slate-950/70 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hotspot-map-dialog-title"
          onClick={() => setExpanded(false)}
        >
          <div
            className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 rounded-2xl bg-white/95 px-3 py-2.5 shadow-md ring-1 ring-slate-200/90">
              <div className="min-w-0">
                <p id="hotspot-map-dialog-title" className="truncate text-base font-bold text-slate-900">
                  Report hotspots
                </p>
                <p className="truncate text-xs text-slate-600">Pinch or drag the map · tap pins for details</p>
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-800 ring-1 ring-slate-200"
                aria-label="Close map"
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>
            <div
              ref={largeRef}
              className="min-h-[min(72dvh,560px)] w-full flex-1 overflow-hidden rounded-2xl bg-white shadow-xl ring-2 ring-white/40 [&_.leaflet-control-attribution]:text-[10px]"
            />
          </div>
        </div>
      ) : null}
    </section>
  )
}
