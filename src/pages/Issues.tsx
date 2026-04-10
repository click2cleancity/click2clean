import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Camera, MapPin } from 'lucide-react'
import { mapsUrl } from '../lib/geo'
import { friendlyAreaLabel } from '../lib/reverseGeocode'
import { formatReportWhen } from '../lib/time'
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

  const merged: IssueRow[] = [...getStoredReports()]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .map((r) => ({
      id: r.id,
      title: r.title,
      area: r.areaLabel,
      lat: r.lat,
      lng: r.lng,
      time: formatReportWhen(r.createdAt),
      status: r.status,
      mine: true,
      photoUrl: r.photoDataUrl,
    }))

  useEffect(() => {
    if (highlightId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightId])

  const filtered = tab === 'mine' ? merged.filter((r) => r.mine) : merged

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 gap-y-3">
        <div className="min-w-0 flex-1 basis-[55%] sm:basis-auto">
          <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">Issues</h1>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600 sm:text-xs">
            Your submissions only — map &amp; status per report.
          </p>
        </div>
        <div className="flex shrink-0 gap-2" role="tablist" aria-label="Issue filter">
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
                  'flex h-11 w-11 items-center justify-center rounded-full text-[11px] font-bold shadow-sm transition sm:h-12 sm:w-12 sm:text-xs',
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
      </div>

      <ul className="space-y-2 pt-1">
        {filtered.length === 0 ? (
          <li className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-600">
            No reports yet. Submit one from the home screen.
          </li>
        ) : (
          filtered.map((r) => (
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
                    <span className="flex h-full w-full flex-col items-center justify-center gap-0.5 px-1 text-center text-[10px] font-medium leading-tight text-slate-500">
                      <Camera className="h-6 w-6 text-slate-400" aria-hidden />
                      No photo saved
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
          ))
        )}
      </ul>
    </div>
  )
}
