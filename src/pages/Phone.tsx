import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Phone } from 'lucide-react'
import { getSplashDone, getVerified, setPendingPhone } from '../lib/storage'
import { getResumeSetupPath } from '../lib/setup'

function isValidIndianMobile10(digits: string): boolean {
  return /^[6-9]\d{9}$/.test(digits)
}

export default function PhoneEntry() {
  const nav = useNavigate()
  const [value, setValue] = useState('')
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (getVerified()) {
      nav('/', { replace: true })
      return
    }
    if (!getSplashDone()) {
      nav('/splash', { replace: true })
      return
    }
    const resume = getResumeSetupPath()
    if (resume !== '/phone') nav(resume, { replace: true })
  }, [nav])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (!isValidIndianMobile10(digits)) {
      setErr('Enter a valid 10-digit mobile number (starts with 6–9).')
      return
    }
    setPendingPhone(digits)
    nav('/otp', { replace: true })
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
            <Phone className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mobile number</h1>
            <p className="text-sm text-slate-600">We&apos;ll send a one-time password to verify you.</p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="mobile">
            10-digit mobile
          </label>
          <div className="flex items-center gap-2 rounded-2xl bg-slate-100/90 px-3 ring-2 ring-transparent focus-within:ring-blue-500">
            <span className="text-sm font-semibold text-slate-500" aria-hidden>
              +91
            </span>
            <input
              id="mobile"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              placeholder="9876543210"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, '').slice(0, 10))}
              className="min-w-0 flex-1 border-0 bg-transparent py-3 text-lg tracking-wide text-slate-900 outline-none"
              aria-invalid={!!err}
              aria-describedby={err ? 'phone-err' : undefined}
            />
          </div>
          {err ? (
            <p id="phone-err" className="text-sm text-red-600" role="alert">
              {err}
            </p>
          ) : null}
          <button
            type="submit"
            className="w-full rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-md"
          >
            Send OTP
          </button>
        </form>
      </motion.div>
    </div>
  )
}
