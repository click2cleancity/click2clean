import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { communityReports } from '../data/mock'
import { mapsUrl } from '../lib/geo'
import { getStoredReports } from '../lib/storage'

export default function Issues() {
  const { state } = useLocation() as { state?: { highlightId?: string } }
  const highlightId = state?.highlightId
  const highlightRef = useRef<HTMLLIElement | null>(null)

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId])
  const mine = getStoredReports()
  const merged = [
    ...mine.map((r) => ({
      id: r.id,
      title: r.title,
      area: r.areaLabel,
      lat: r.lat,
      lng: r.lng,
      time: new Date(r.createdAt).toLocaleString(),
      status: r.status,
      mine: true as const,
    })),
    ...communityReports.map((r) => ({
      id: r.id,
      title: r.title,
      area: r.area,
      lat: r.lat,
      lng: r.lng,
      time: r.time,
      status: r.status as 'Submitted' | 'In progress' | 'Resolved',
      mine: false as const,
    })),
  ]

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Issues</h1>
        <p className="mt-1 text-sm text-slate-600">Community queue and your submissions.</p>
      </header>

      <ul className="space-y-2">
        {merged.map((r) => (
          <li
            key={r.id}
            ref={highlightId === r.id ? highlightRef : undefined}
            className={[
              'glass-panel rounded-2xl p-4 transition-shadow',
              highlightId === r.id ? 'ring-2 ring-blue-500 ring-offset-2' : '',
            ].join(' ')}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold text-slate-900">{r.title}</p>
                <a
                  href={mapsUrl(r.lat, r.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-blue-700"
                >
                  <MapPin className="h-4 w-4" />
                  {r.area}
                </a>
              </div>
              {r.mine ? (
                <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                  Yours
                </span>
              ) : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>{r.time}</span>
              <span
                className={[
                  'rounded-full px-2 py-0.5 font-semibold',
                  r.status === 'Resolved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : r.status === 'In progress'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-200 text-slate-800',
                ].join(' ')}
              >
                {r.status}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
