import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Globe } from 'lucide-react'
import { getLanguage, getOnboardingDone, getSplashDone, setLanguage } from '../lib/storage'
import { getResumeSetupPath } from '../lib/setup'

const options = [
  { code: 'en', label: 'English', sub: 'Default' },
  { code: 'hi', label: 'हिंदी', sub: 'Hindi' },
] as const

export default function Language() {
  const nav = useNavigate()
  const [code, setCode] = useState<string>(getLanguage() ?? 'en')

  useEffect(() => {
    if (!getSplashDone()) {
      nav('/splash', { replace: true })
      return
    }
    const resume = getResumeSetupPath()
    if (resume !== '/language') nav(resume, { replace: true })
  }, [nav])

  function next() {
    setLanguage(code)
    if (getOnboardingDone()) nav('/phone', { replace: true })
    else nav('/onboarding', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col justify-center px-6 py-10">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-strong mx-auto w-full max-w-md rounded-[28px] p-6"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-md">
            <Globe className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Choose language</h1>
            <p className="text-sm text-slate-600">You can change this later in settings.</p>
          </div>
        </div>

        <div className="space-y-2" role="radiogroup" aria-label="App language">
          {options.map((o) => {
            const selected = code === o.code
            return (
              <button
                key={o.code}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setCode(o.code)}
                className={[
                  'flex w-full items-center justify-between rounded-2xl border-2 px-4 py-3 text-left transition',
                  selected
                    ? 'border-blue-600 bg-blue-50/80'
                    : 'border-transparent bg-slate-100/80 hover:bg-slate-100',
                ].join(' ')}
              >
                <div>
                  <p className="font-semibold text-slate-900">{o.label}</p>
                  <p className="text-xs text-slate-500">{o.sub}</p>
                </div>
                <span
                  className={[
                    'flex h-5 w-5 shrink-0 rounded-full border-2',
                    selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white',
                  ].join(' ')}
                  aria-hidden
                />
              </button>
            )
          })}
        </div>

        <button
          type="button"
          onClick={next}
          className="mt-6 w-full rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-md"
        >
          Continue
        </button>
      </motion.div>
    </div>
  )
}
