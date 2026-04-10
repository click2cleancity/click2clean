import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Camera, MapPin } from 'lucide-react'
import { communityReports } from '../data/mock'
import { mapsUrl } from '../lib/geo'
import { friendlyAreaLabel } from '../lib/reverseGeocode'
import { getStoredReports } from '../lib/storage'

type IssueRow = {
  id: string
  title: string
  area: string
  lat: number
  lng: number
  time: string
  status: 'Submitted' | 'In progress' | 'Resolved'
  mine: boolean
  photoUrl?: string
}

export default function Issues() {
  const { state } = useLocation() as { state?: { highlightId?: string } }
  const highlightId = state?.highlightId
  const highlightRef = useRef<HTMLLIElement | null>(null)
  const [tab, setTab] = useState<'all' | 'mine'>('all')

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId])

  const mine = getStoredReports()
  const merged: IssueRow[] = [
    ...mine.map((r) => ({
      id: r.id,
      title: r.title,
      area: r.areaLabel,
      lat: r.lat,
      lng: r.lng,
      time: new Date(r.createdAt).toLocaleString(),
      status: r.status,
      mine: true,
      photoUrl: r.photoDataUrl,
    })),
    ...communityReports.map((r) => ({
      id: r.id,
      title: r.title,
      area: r.area,
      lat: r.lat,
      lng: r.lng,
      time: r.time,
      status: r.status,
      mine: false,
      photoUrl: r.photoUrl,
    })),
  ]

  const filtered = tab === 'mine' ? merged.filter((r) => r.mine) : merged

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Issues</h1>
        <p className="mt-1 text-sm text-slate-600">Community queue and your submissions.</p>
      </header>

      <div className="flex justify-center gap-5" role="tablist" aria-label="Issue filter">
        {(
          [
            { id: 'all' as const, label: 'All' },
            { id: 'mine' as const, label: 'Mine' },
          ] as const
        ).map(({ id, label }) => {
          const selected = tab === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(id)}
              className={[
                'flex h-[52px] w-[52px] items-center justify-center rounded-full text-xs font-bold shadow-sm transition',
                selected
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400/60 ring-offset-2 ring-offset-slate-50'
                  : 'bg-white/90 text-slate-700 ring-1 ring-slate-200/90 hover:bg-slate-50',
              ].join(' ')}
            >
              {label}
            </button>
          )
        })}
      </div>

      <ul className="space-y-2">
        {filtered.map((r) => (
          <li
            key={r.id}
            ref={highlightId === r.id ? highlightRef : undefined}
            className={[
              'glass-panel rounded-2xl p-3 transition-shadow',
              highlightId === r.id ? 'ring-2 ring-blue-500 ring-offset-2' : '',
            ].join(' ')}
          >
            <div className="flex gap-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200/80">
                {r.photoUrl ? (
                  <img
                    src={r.photoUrl}
                    alt=""
                    className="h-full w-full object-cover object-center"
                    loading="lazy"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-slate-400">
                    <Camera className="h-8 w-8" aria-hidden />
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-bold text-slate-900">{r.title}</p>
                  {r.mine ? (
                    <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">
                      Yours
                    </span>
                  ) : null}
                </div>
                <a
                  href={mapsUrl(r.lat, r.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-flex max-w-full items-center gap-1 text-sm font-semibold text-blue-700"
                >
                  <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{friendlyAreaLabel(r.area)}</span>
                </a>
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
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
