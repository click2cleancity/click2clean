import { Link } from 'react-router-dom'
import Slider from '../lib/reactSlick'
import { motion } from 'motion/react'
import { MapPin, Sparkles } from 'lucide-react'
import { communityReports, heroStats, inspirationSlides } from '../data/mock'
import { mapsUrl } from '../lib/geo'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

export default function Home() {
  return (
    <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-5">
      <motion.section variants={item} className="glass-panel overflow-hidden rounded-[28px] p-5">
        <div className="rounded-3xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-800 p-5 text-white shadow-lg">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-blue-100">Ready when you are</p>
              <h2 className="mt-1 text-2xl font-bold leading-tight">Report Issue Now</h2>
              <p className="mt-2 max-w-[18rem] text-sm text-blue-100">
                One clear photo and location helps your city respond faster.
              </p>
            </div>
            <Sparkles className="h-10 w-10 shrink-0 text-lime-300" aria-hidden />
          </div>
          <Link
            to="/report"
            className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white py-3 text-center text-base font-semibold text-blue-700 shadow-md"
          >
            Start reporting
          </Link>
        </div>
      </motion.section>

      <motion.section variants={item} className="grid grid-cols-3 gap-2">
        {heroStats.map((s) => (
          <div key={s.label} className="glass-panel rounded-2xl p-3 text-center">
            <p className="text-lg font-bold text-slate-900">{s.value}</p>
            <p className="text-[11px] font-medium leading-tight text-slate-600">{s.label}</p>
          </div>
        ))}
      </motion.section>

      <motion.section variants={item}>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">Community Reports</h3>
          <Link to="/issues" className="text-sm font-semibold text-blue-700">
            View all
          </Link>
        </div>
        <div className="space-y-2">
          {communityReports.map((r) => (
            <article key={r.id} className="glass-panel flex gap-3 rounded-2xl p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <MapPin className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-900">{r.title}</p>
                <a
                  href={mapsUrl(r.lat, r.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-0.5 block truncate text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
                >
                  {r.area}
                </a>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
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
            </article>
          ))}
        </div>
      </motion.section>

      <motion.section variants={item}>
        <h3 className="mb-2 text-lg font-bold text-slate-900">Daily Inspiration</h3>
        <div className="glass-panel rounded-[24px] p-2">
          <Slider
            dots
            infinite
            speed={450}
            slidesToShow={1}
            slidesToScroll={1}
            autoplay
            autoplaySpeed={4500}
            arrows={false}
          >
            {inspirationSlides.map((slide) => (
              <div key={slide.title} className="px-1 pb-6">
                <div
                  className={`rounded-3xl bg-gradient-to-br ${slide.gradient} p-5 text-white shadow-md`}
                >
                  <p className="text-lg font-bold">{slide.title}</p>
                  <p className="mt-2 text-sm text-white/95">{slide.body}</p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </motion.section>

      <motion.section variants={item} className="rounded-2xl border border-dashed border-slate-300/80 bg-white/40 p-4 text-center text-sm text-slate-600">
        <Link to="/educate" className="font-semibold text-blue-700">
          Learn how reporting helps
        </Link>
        <span> — short reads, big impact.</span>
      </motion.section>
    </motion.div>
  )
}
