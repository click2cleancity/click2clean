import { useEffect, useState } from 'react'
import { getAccountability, type Accountability } from '../lib/accountability'

// Shows who is accountable for a report's location: the responsible Sanitary
// Inspector plus the escalation path (CSI → Ward Officer …). Data comes from
// staff_hierarchy, resolved by ward. Used on the success screen and map sheet.
export default function AccountabilityCard({
  sector,
  address,
}: {
  sector?: string | null
  address?: string | null
}) {
  const [data, setData] = useState<Accountability | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    getAccountability(sector, address).then((d) => {
      if (alive) {
        setData(d)
        setLoading(false)
      }
    })
    return () => { alive = false }
  }, [sector, address])

  if (loading) {
    return (
      <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-400">Loading accountability…</div>
    )
  }
  if (!data) return null

  const { wardName, primary, chain } = data
  const initials = primary.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  const escalation = chain.filter((o) => o.level > primary.level)

  return (
    <div className="rounded-2xl bg-blue-50 p-4 text-left">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-blue-500">
        Accountability · {wardName}
      </p>

      {/* Primary responsible officer (Sanitary Inspector) */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-slate-800">{primary.name}</p>
          <p className="text-xs text-slate-500">{primary.designation}</p>
        </div>
      </div>

      {/* Escalation path */}
      {escalation.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-blue-100 pt-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Escalation</p>
          {escalation.map((o) => (
            <div key={`${o.designation}-${o.name}`} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-slate-500">{o.designation}</span>
              <span className="shrink-0 font-medium text-slate-700">{o.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
