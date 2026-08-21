import { useEffect, useState } from 'react'
import { MapPin, X } from 'lucide-react'
import { supabase } from '../supabase'
import { getPhone } from '../lib/storage'
import { formatReportWhen } from '../lib/time'

interface Report {
  id: string
  citizen_id: string
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

const CAT_EMOJI: Record<string, string> = {
  garbage: '🗑️', pothole: '🕳️', streetlight: '💡',
  drain: '🌊', water: '💧', other: '📌',
}
const CAT_BADGE: Record<string, string> = {
  garbage: 'bg-red-100 text-red-700',
  pothole: 'bg-orange-100 text-orange-700',
  streetlight: 'bg-yellow-100 text-yellow-700',
  drain: 'bg-blue-100 text-blue-700',
  water: 'bg-cyan-100 text-cyan-700',
  other: 'bg-slate-100 text-slate-700',
}

export default function Issues() {
  const [tab, setTab] = useState<'all' | 'mine'>('all')
  const [reports, setReports] = useState<Report[]>([])
  const [myId, setMyId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Report | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const fullPhone = `+91${getPhone()}`
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('phone', fullPhone)
        .maybeSingle()
      setMyId(user?.id ?? null)

      const { data } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      setReports(data ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = tab === 'mine' ? reports.filter(r => r.citizen_id === myId) : reports

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold leading-tight text-slate-900 sm:text-2xl">Issues</h1>
          <p className="mt-0.5 text-[11px] text-slate-600 sm:text-xs">
            {tab === 'mine' ? 'Tap a report to see full details.' : 'Reported cleanliness issues across the city.'}
          </p>
        </div>
        <div className="flex shrink-0 rounded-full bg-white/90 p-1 ring-1 ring-slate-200/90" role="tablist" aria-label="Issue filter">
          {([{ id: 'all', label: 'All' }, { id: 'mine', label: 'Mine' }] as const).map(({ id, label }) => {
            const selectedTab = tab === id
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selectedTab}
                onClick={() => setTab(id)}
                className={[
                  'rounded-full px-4 py-1.5 text-sm font-bold transition',
                  selectedTab ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600',
                ].join(' ')}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      <ul className="space-y-2 pt-1">
        {loading ? (
          <li className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-500">Loading issues…</li>
        ) : filtered.length === 0 ? (
          <li className="glass-panel rounded-2xl p-6 text-center text-sm text-slate-600">
            {tab === 'mine' ? 'You haven’t reported anything yet.' : 'No reports yet.'}
          </li>
        ) : (
          filtered.map((r) => {
            const clickable = tab === 'mine'
            return (
              <li key={r.id}>
                <div
                  className={`glass-panel rounded-2xl p-3 ${clickable ? 'cursor-pointer transition active:scale-[0.99]' : ''}`}
                  onClick={clickable ? () => setSelected(r) : undefined}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
                      {r.photo_url ? (
                        <img src={r.photo_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">
                          {CAT_EMOJI[r.category] ?? '📌'}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${CAT_BADGE[r.category] ?? 'bg-slate-100 text-slate-700'}`}>
                          {CAT_EMOJI[r.category] ?? '📌'} {r.category}
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">{formatReportWhen(r.created_at)}</span>
                      </div>
                      <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                        <MapPin size={12} className="shrink-0 text-blue-500" />
                        <span className="truncate">{r.address || r.sector}</span>
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                          r.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {r.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}
                        </span>
                        {r.citizen_id === myId && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">Yours</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            )
          })
        )}
      </ul>

      {/* Detail modal (Mine tab) */}
      {selected && (
        <div
          className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/40"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{CAT_EMOJI[selected.category] ?? '📌'}</span>
                <div>
                  <p className="font-bold capitalize text-slate-900">{selected.category}</p>
                  <p className="text-xs text-slate-500">{selected.address || selected.sector}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100" aria-label="Close">
                <X size={16} className="text-slate-600" />
              </button>
            </div>

            {selected.photo_url && (
              <img src={selected.photo_url} alt="Issue" className="mb-3 h-48 w-full rounded-2xl object-cover" />
            )}

            {selected.description && (
              <p className="mb-3 text-sm text-slate-600">"{selected.description}"</p>
            )}

            <div className="mb-3 flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                selected.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-700'
              }`}>
                {selected.status === 'resolved' ? '✅ Resolved' : '⏳ Pending'}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(selected.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-xs text-slate-500">👀 {selected.support_count} see this</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
