import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { motion } from 'motion/react'
import { CheckCircle2, Home, ListChecks, X } from 'lucide-react'

export default function Success() {
  const nav = useNavigate()
  const loc = useLocation() as { state?: { reportId?: string } }
  const reportId = loc.state?.reportId ?? 'C2C-UNKNOWN'
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current) return
    fired.current = true
    const end = Date.now() + 1500
    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#3b82f6', '#84cc16', '#fbbf24', '#ffffff'],
      })
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#3b82f6', '#84cc16', '#fbbf24', '#ffffff'],
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [])

  function close() {
    if (window.history.length > 1) nav(-1)
    else nav('/', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-5 py-10">
      <motion.div
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-panel-strong rounded-[28px] p-6 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 className="h-10 w-10" aria-hidden />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Ticket raised</h1>
        <p className="mt-2 text-sm text-slate-600">Your report is logged with the city queue.</p>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Raised ticket number</p>
        <p className="mt-2 rounded-2xl bg-slate-100 px-4 py-3 font-mono text-lg font-bold tracking-tight text-slate-900">
          {reportId}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => nav('/issues', { replace: true, state: { highlightId: reportId } })}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-md"
          >
            <ListChecks className="h-5 w-5" aria-hidden />
            Track
          </button>
          <Link
            to="/"
            replace
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-lime-500 py-3.5 text-base font-semibold text-white shadow-md"
          >
            <Home className="h-5 w-5" aria-hidden />
            Home
          </Link>
          <button
            type="button"
            onClick={close}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white py-3.5 text-base font-semibold text-slate-800"
          >
            <X className="h-5 w-5" aria-hidden />
            Close
          </button>
        </div>
      </motion.div>
    </div>
  )
}
