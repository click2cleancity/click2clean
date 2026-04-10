import { Link, useNavigate } from 'react-router-dom'
import Slider from '../lib/reactSlick'
import { motion } from 'motion/react'
import { BookOpen, Flame, Gift, Leaf, ListChecks, LogOut, Settings, Sparkles, Star } from 'lucide-react'
import { badges } from '../data/mock'
import { getPhone, getPoints, getStoredReports, logout } from '../lib/storage'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const iconMap = {
  Sparkles,
  Flame,
  Star,
  Leaf,
} as const

export default function Profile() {
  const nav = useNavigate()
  const reports = getStoredReports().length
  const resolved = Math.min(reports, 12)
  const points = getPoints()
  const phone = getPhone()

  function handleLogout() {
    if (
      !window.confirm(
        'Log out? You will see the intro again. Sign in with the same number to load your saved reports and points.'
      )
    ) {
      return
    }
    logout()
    nav('/splash', { replace: true })
  }

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-strong overflow-hidden rounded-[28px]"
      >
        <div className="bg-gradient-to-br from-lime-400 via-emerald-500 to-blue-600 px-5 py-6 text-white">
          <p className="text-sm font-medium text-white/90">Signed in</p>
          <h1 className="mt-1 text-2xl font-bold">Your profile</h1>
          <p className="mt-2 text-sm text-white/90">{phone ? `+91 ${phone}` : 'Verified citizen'}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 p-3">
          <div className="rounded-2xl bg-white/80 px-2 py-3 text-center ring-1 ring-slate-200/80">
            <p className="text-xl font-bold text-slate-900">{reports}</p>
            <p className="text-[11px] font-medium text-slate-600">Reports filed</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-2 py-3 text-center ring-1 ring-slate-200/80">
            <p className="text-xl font-bold text-slate-900">{resolved}</p>
            <p className="text-[11px] font-medium text-slate-600">Issues resolved</p>
          </div>
          <div className="rounded-2xl bg-white/80 px-2 py-3 text-center ring-1 ring-slate-200/80">
            <p className="text-xl font-bold text-slate-900">{points}</p>
            <p className="text-[11px] font-medium text-slate-600">Points earned</p>
          </div>
        </div>
      </motion.section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Quick access</h2>
        <div className="grid gap-2">
          <Link
            to="/earn"
            className="glass-panel flex items-center gap-3 rounded-2xl p-4 transition hover:ring-2 hover:ring-amber-300/80"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-md">
              <Gift className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-slate-900">Rewards</p>
              <p className="text-sm text-slate-600">Challenges and redemption</p>
            </div>
          </Link>
          <Link
            to="/issues"
            className="glass-panel flex items-center gap-3 rounded-2xl p-4 transition hover:ring-2 hover:ring-blue-300/80"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-blue-600 text-white shadow-md">
              <ListChecks className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-slate-900">My Reports</p>
              <p className="text-sm text-slate-600">Track status and history</p>
            </div>
          </Link>
          <Link
            to="/educate"
            className="glass-panel flex items-center gap-3 rounded-2xl p-4 transition hover:ring-2 hover:ring-lime-300/80"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-lime-400 to-emerald-600 text-white shadow-md">
              <BookOpen className="h-6 w-6" />
            </span>
            <div>
              <p className="font-bold text-slate-900">Learn More</p>
              <p className="text-sm text-slate-600">Civic awareness reads</p>
            </div>
          </Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Settings</h2>
        <div className="glass-panel flex items-center gap-3 rounded-2xl p-4 ring-1 ring-slate-200/80">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
            <Settings className="h-6 w-6" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-slate-900">Account</p>
            <p className="text-sm text-slate-600">Log out to start fresh; same number brings your data back.</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-1.5 rounded-full bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white shadow-md active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Log out
          </button>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Badges</h2>
        <div className="glass-panel rounded-[24px] p-2">
          <Slider dots={false} infinite={false} speed={400} slidesToShow={2} slidesToScroll={1} arrows={false}>
            {badges.map((b) => {
              const Icon = iconMap[b.icon]
              return (
                <div key={b.name} className="px-1 pb-2">
                  <div className="rounded-2xl bg-white/80 p-4 text-center ring-1 ring-slate-200/80">
                    <Icon className="mx-auto h-8 w-8 text-blue-600" />
                    <p className="mt-2 text-sm font-semibold text-slate-900">{b.name}</p>
                  </div>
                </div>
              )
            })}
          </Slider>
        </div>
      </section>

      <p className="rounded-2xl border border-dashed border-slate-300/80 bg-white/40 px-4 py-3 text-center text-sm text-slate-600">
        Consistency beats intensity—report when you see something, not only when it is convenient.
      </p>
    </div>
  )
}
