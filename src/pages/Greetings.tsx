import { useState } from 'react'
import { BookOpen, Download, Eye, Play, Share2 } from 'lucide-react'
import { motion } from 'motion/react'

type ItemType = 'article' | 'video' | 'poster'

interface AwarenessItem {
  id: string
  category: 'Clean India' | 'Civic Sense' | 'Motivation' | 'Campaigns'
  type: ItemType
  title: string
  desc: string
  emoji: string
  gradient: string
  link: string
}

const ITEMS: AwarenessItem[] = [
  {
    id: 'swachh-mission',
    category: 'Clean India',
    type: 'article',
    title: 'Swachh Bharat Mission',
    desc: "India's largest cleanliness drive — how citizen reporting keeps streets clean.",
    emoji: '🇮🇳',
    gradient: 'from-emerald-500 to-lime-500',
    link: 'https://swachhbharatmission.ddws.gov.in/',
  },
  {
    id: 'segregate-waste',
    category: 'Civic Sense',
    type: 'video',
    title: 'Segregate Your Waste',
    desc: 'Wet, dry & hazardous — a 2-minute guide to sorting waste at home.',
    emoji: '♻️',
    gradient: 'from-sky-500 to-blue-600',
    link: 'https://www.youtube.com/results?search_query=how+to+segregate+waste+at+home',
  },
  {
    id: 'be-the-change',
    category: 'Motivation',
    type: 'poster',
    title: 'Be the Change',
    desc: 'One report at a time. Share this poster to inspire your neighbourhood.',
    emoji: '✨',
    gradient: 'from-violet-500 to-indigo-600',
    link: '',
  },
  {
    id: 'no-littering',
    category: 'Civic Sense',
    type: 'poster',
    title: 'Say No to Littering',
    desc: 'A clean street starts with you — use the bin, every single time.',
    emoji: '🚮',
    gradient: 'from-orange-500 to-red-500',
    link: '',
  },
  {
    id: 'plastic-free',
    category: 'Campaigns',
    type: 'article',
    title: 'Plastic-Free Neighbourhood',
    desc: 'Small swaps that cut single-use plastic in your community.',
    emoji: '🌱',
    gradient: 'from-teal-500 to-emerald-600',
    link: 'https://en.wikipedia.org/wiki/Plastic_pollution',
  },
  {
    id: 'together-we-clean',
    category: 'Motivation',
    type: 'video',
    title: 'Together We Clean',
    desc: 'Communities that report together, resolve faster. Watch how.',
    emoji: '🤝',
    gradient: 'from-fuchsia-500 to-rose-500',
    link: 'https://www.youtube.com/results?search_query=community+cleanliness+drive+india',
  },
]

const CATEGORIES = ['All', 'Clean India', 'Civic Sense', 'Motivation', 'Campaigns'] as const

const TYPE_META: Record<ItemType, { label: string; verb: string; Icon: typeof Eye }> = {
  article: { label: 'Article', verb: 'Read', Icon: BookOpen },
  video: { label: 'Video', verb: 'Watch', Icon: Play },
  poster: { label: 'Poster', verb: 'View', Icon: Eye },
}

function shareWhatsApp(item: AwarenessItem) {
  const text = `${item.title} — ${item.desc} (via Click to Clean)`
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer')
}

/** Generate & download a simple shareable poster (SVG) for the item. */
function downloadPoster(item: AwarenessItem) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#2563eb"/><stop offset="1" stop-color="#1e3a8a"/>
  </linearGradient></defs>
  <rect width="1080" height="1080" fill="url(#g)"/>
  <text x="540" y="380" font-size="220" text-anchor="middle">${item.emoji}</text>
  <text x="540" y="560" font-size="72" font-family="system-ui,sans-serif" font-weight="800" fill="#ffffff" text-anchor="middle">${item.title}</text>
  <foreignObject x="140" y="600" width="800" height="260">
    <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:system-ui,sans-serif;font-size:34px;color:#dbeafe;text-align:center;line-height:1.4">${item.desc}</div>
  </foreignObject>
  <text x="540" y="1000" font-size="34" font-family="system-ui,sans-serif" font-weight="700" fill="#bef264" text-anchor="middle">Click to Clean</text>
</svg>`
  const blob = new Blob([svg], { type: 'image/svg+xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${item.id}-poster.svg`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Greetings() {
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>('All')
  const items = cat === 'All' ? ITEMS : ITEMS.filter((i) => i.category === cat)

  return (
    <div className="space-y-4 pb-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Awareness</h1>
        <p className="mt-1 text-sm text-slate-600">
          Read, watch and share stories on cleanliness, civic sense & campaigns.
        </p>
      </header>

      {/* Category filter */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {CATEGORIES.map((c) => {
          const selected = cat === c
          return (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={[
                'shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition',
                selected ? 'bg-blue-600 text-white shadow-sm' : 'bg-white/90 text-slate-600 ring-1 ring-slate-200/90',
              ].join(' ')}
            >
              {c}
            </button>
          )
        })}
      </div>

      <div className="grid gap-3">
        {items.map((item, i) => {
          const meta = TYPE_META[item.type]
          const PrimaryIcon = meta.Icon
          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 * i }}
              className="glass-panel overflow-hidden rounded-[24px]"
            >
              {/* Visual header */}
              <div className={`relative flex h-28 items-center justify-center bg-gradient-to-br ${item.gradient}`}>
                <span className="text-5xl drop-shadow" aria-hidden>{item.emoji}</span>
                <span className="absolute left-3 top-3 rounded-full bg-black/25 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur">
                  {meta.label}
                </span>
                <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700">
                  {item.category}
                </span>
              </div>

              {/* Body (dark text on light card for readability) */}
              <div className="p-4">
                <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{item.desc}</p>

                <div className="mt-3 flex items-center gap-2">
                  {item.link ? (
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm"
                    >
                      <PrimaryIcon className="h-4 w-4" aria-hidden />
                      {meta.verb}
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => downloadPoster(item)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-blue-600 py-2.5 text-sm font-bold text-white shadow-sm"
                    >
                      <PrimaryIcon className="h-4 w-4" aria-hidden />
                      {meta.verb}
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => shareWhatsApp(item)}
                    aria-label="Share"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                  </button>

                  {item.type !== 'video' && (
                    <button
                      type="button"
                      onClick={() => downloadPoster(item)}
                      aria-label="Download"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 ring-1 ring-slate-200"
                    >
                      <Download className="h-4 w-4" aria-hidden />
                    </button>
                  )}
                </div>
              </div>
            </motion.article>
          )
        })}
      </div>
    </div>
  )
}
