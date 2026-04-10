import { Link } from 'react-router-dom'
import Slider from '../lib/reactSlick'
import { motion } from 'motion/react'
import { BookOpen, ChevronRight, MapPin, Sparkles } from 'lucide-react'
import { inspirationSlides } from '../data/mock'
import { mapsUrl } from '../lib/geo'
import { friendlyAreaLabel } from '../lib/reverseGeocode'
import { formatReportWhen } from '../lib/time'
import { HotSpotSection } from '../components/ReportHotspotMap'
import { getPoints, getStoredReports } from '../lib/storage'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const stagger = { visible: { transition: { staggerChildren: 0.08 } } }
const item = { hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }

export default function Home() {
  const reports = [...getStoredReports()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
  const points = getPoints()
  const resolvedCount = reports.filter((r) => r.status === 'Resolved').length
  const preview = reports.slice(0, 5)

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
        <div className="glass-panel rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{reports.length}</p>
          <p className="text-[11px] font-medium leading-tight text-slate-600">Your reports</p>
        </div>
        <div className="glass-panel rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{points}</p>
          <p className="text-[11px] font-medium leading-tight text-slate-600">Points</p>
        </div>
        <div className="glass-panel rounded-2xl p-3 text-center">
          <p className="text-lg font-bold text-slate-900">{resolvedCount}</p>
          <p className="text-[11px] font-medium leading-tight text-slate-600">Resolved</p>
        </div>
      </motion.section>

      <motion.section variants={item}>
        <HotSpotSection reports={reports} />
      </motion.section>

      <motion.section variants={item}>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h3 className="text-lg font-bold text-slate-900">Your reports</h3>
          {reports.length > 0 ? (
            <Link to="/issues" className="shrink-0 text-sm font-semibold text-blue-700">
              View all
            </Link>
          ) : null}
        </div>
        <div className="space-y-2">
          {preview.length === 0 ? (
            <div className="glass-panel rounded-2xl p-5 text-center">
              <p className="text-sm font-medium text-slate-700">No reports yet</p>
              <p className="mt-1 text-xs text-slate-600">Capture an issue on the street to see it here.</p>
              <Link
                to="/report"
                className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-blue-600 py-3 text-sm font-semibold text-white shadow-md"
              >
                New report
              </Link>
            </div>
          ) : (
            preview.map((r) => (
              <article key={r.id} className="glass-panel flex gap-3 rounded-2xl p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-slate-200 ring-1 ring-slate-200/80">
                  {r.photoDataUrl ? (
                    <img
                      src={r.photoDataUrl}
                      alt=""
                      className="h-full w-full object-cover object-center"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-medium text-slate-500">
                      No photo
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{r.title}</p>
                  <a
                    href={mapsUrl(r.lat, r.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 inline-flex max-w-full items-center gap-1 truncate text-sm font-medium text-blue-700 underline-offset-2 hover:underline"
                  >
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="truncate">{friendlyAreaLabel(r.areaLabel)}</span>
                  </a>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <span>{formatReportWhen(r.createdAt)}</span>
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
            ))
          )}
        </div>
      </motion.section>

      <motion.section variants={item}>
        <h3 className="mb-2 text-lg font-bold text-slate-900">Daily inspiration</h3>
        <div className="glass-panel inspiration-panel overflow-hidden rounded-[24px] p-0">
          <Slider
            dots
            infinite
            speed={450}
            slidesToShow={1}
            slidesToScroll={1}
            autoplay
            autoplaySpeed={4500}
            arrows={false}
            className="inspiration-slider"
          >
            {inspirationSlides.map((slide) => (
              <div key={slide.title} className="outline-none">
                <div
                  className={`flex min-h-[168px] w-full flex-col justify-center bg-gradient-to-br px-6 py-8 text-white shadow-inner ${slide.gradient}`}
                >
                  <p className="text-xl font-bold leading-tight drop-shadow-sm">{slide.title}</p>
                  <p className="mt-3 max-w-[20rem] text-sm leading-relaxed text-white/95 drop-shadow-sm">
                    {slide.body}
                  </p>
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </motion.section>

      <motion.section variants={item}>
        <Link
          to="/educate"
          className="group glass-panel flex items-center gap-4 rounded-2xl p-4 shadow-sm ring-1 ring-white/80 transition hover:ring-2 hover:ring-blue-300/60"
        >
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white shadow-md">
            <BookOpen className="h-7 w-7" aria-hidden />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="font-bold text-slate-900">Learn how reporting helps</p>
            <p className="mt-0.5 text-sm text-slate-600">Photos, safety &amp; how cities triage issues.</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-blue-600" aria-hidden />
        </Link>
      </motion.section>
    </motion.div>
  )
}
