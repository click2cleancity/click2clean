import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Sparkles } from 'lucide-react'
import { getSplashDone, setSplashDone } from '../lib/storage'
import { getResumeSetupPath } from '../lib/setup'

export default function Splash() {
  const nav = useNavigate()

  useEffect(() => {
    if (getSplashDone()) {
      nav(getResumeSetupPath(), { replace: true })
      return
    }
    const t = window.setTimeout(() => {
      setSplashDone()
      nav('/language', { replace: true })
    }, 2800)
    return () => window.clearTimeout(t)
  }, [nav])

  function go() {
    setSplashDone()
    nav('/language', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-8 pb-12 pt-16">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45 }}
        className="flex flex-col items-center text-center"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-500 to-blue-800 text-white shadow-2xl">
          <Sparkles className="h-12 w-12" aria-hidden />
        </div>
        <h1 className="mt-8 text-3xl font-black tracking-tight text-slate-900">Click to Clean</h1>
        <p className="mt-3 max-w-xs text-[15px] leading-relaxed text-slate-600">
          Civic reporting for cleaner streets—together.
        </p>
      </motion.div>
      <motion.p
        className="mt-12 text-xs font-medium text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Clean City · Citizen app
      </motion.p>
      <button
        type="button"
        onClick={go}
        className="mt-auto w-full max-w-sm rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-lg"
      >
        Continue
      </button>
    </div>
  )
}
