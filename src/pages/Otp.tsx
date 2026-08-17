import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { ShieldCheck } from 'lucide-react'
import { clearPendingPhone, getPendingPhone, getVerified, setVerified } from '../lib/storage'
import { getResumeSetupPath } from '../lib/setup'
import { supabase } from '../supabase'

function formatPhone(d: string): string {
  if (d.length !== 10) return d
  return `${d.slice(0, 5)} ${d.slice(5)}`
}

export default function Otp() {
  const nav = useNavigate()
  const [otp, setOtp] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const phone = getPendingPhone()

  useEffect(() => {
    if (getVerified()) {
      nav('/', { replace: true })
      return
    }
    if (!phone) {
      nav('/phone', { replace: true })
    }
  }, [nav, phone])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr(null)
    setLoading(true)

    const digits = otp.replace(/\D/g, '')
    if (digits.length < 4) {
      setErr('Enter the 4-digit OTP.')
      setLoading(false)
      return
    }

    // Mock OTP — accept 1234 for testing
    // Replace this with real MSG91 verification later
    if (digits !== '1234') {
      setErr('Invalid OTP. Use 1234 for testing.')
      setLoading(false)
      return
    }

    try {
      // Check if user exists in Supabase
      const fullPhone = `+91${phone}`
      
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('phone', fullPhone)
        .single()

      if (!existingUser) {
        // Create new user
        await supabase
          .from('users')
          .insert({
            phone: fullPhone,
            language: localStorage.getItem('c2c_language') || 'en',
          })
      }

      // Mark as verified in localStorage
      setVerified(fullPhone)
      clearPendingPhone()

      const next = getResumeSetupPath()
      nav(next === '/otp' ? '/' : next, { replace: true })

    } catch (error) {
      console.error('Auth error:', error)
      setErr('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
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
            <ShieldCheck size={24} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Enter OTP</h1>
            <p className="text-sm text-slate-500">
              Sent to +91 {phone ? formatPhone(phone) : '—'}
            </p>
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block text-sm font-medium text-slate-700" htmlFor="otp">
            One-time password
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="1234"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
            className="w-full rounded-2xl border-0 bg-slate-100/90 px-4 py-3 text-center text-2xl tracking-[0.35em] text-slate-900 outline-none ring-2 ring-transparent focus:ring-blue-500"
          />
          {err ? (
            <p className="text-sm text-red-600" role="alert">{err}</p>
          ) : null}
          <p className="text-center text-xs text-slate-400">
            💡 Use <strong>1234</strong> as OTP for testing
          </p>
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
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-full bg-blue-600 py-3 text-base font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}