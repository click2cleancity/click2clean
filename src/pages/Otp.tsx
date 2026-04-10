import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import { clearPendingPhone, getPendingPhone, getVerified, setVerified } from '../lib/storage'
import { getResumeSetupPath } from '../lib/setup'

function formatPhone(d: string): string {
  if (d.length !== 10) return d
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

export default function Otp() {
  const nav = useNavigate()
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const phone = getPendingPhone()

  useEffect(() => {
    if (getVerified()) {
      nav('/', { replace: true })
      return
    }
    const resume = getResumeSetupPath()
    if (resume !== '/otp') nav(resume, { replace: true })
  }, [nav])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const digits = otp.replace(/\D/g, '')
    if (digits.length < 4) {
      setErr('Demo: enter any 4 or more digits.')
      return
    }
    if (phone.length !== 10) {
      clearPendingPhone()
      nav('/phone', { replace: true })
      return
    }
    setVerified(phone)
    nav('/', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-strong mx-auto w-full max-w-md rounded-[28px] p-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <ShieldCheck className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Verify OTP</h1>
            <p className="text-sm text-slate-600">
              Code sent to{' '}
              <span className="font-semibold text-slate-900">
                +91 {formatPhone(phone) || '— — — — —'}
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-500">Demo: any 4+ digits work as OTP.</p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="otp">
            OTP (demo)
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="Any 4+ digits"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
            className="w-full rounded-2xl border-0 bg-slate-100/90 px-4 py-3 text-center text-2xl tracking-[0.35em] text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-500"
          />
          {err ? (
            <p className="text-sm text-red-600" role="alert">
              {err}
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-full border border-slate-300 bg-white/70 py-3 text-sm font-semibold text-slate-800"
              onClick={() => {
                clearPendingPhone()
                nav('/phone', { replace: true })
              }}
            >
              Edit number
            </button>
            <button type="submit" className="flex-[2] rounded-full bg-blue-600 py-3 text-base font-semibold text-white">
              Verify
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
