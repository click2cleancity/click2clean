import { Share2 } from 'lucide-react'
import { motion } from 'motion/react'

const cards = [
  {
    title: 'Clean India, Green India',
    message: 'A cleaner street is a shared win—report what you see.',
    emoji: '🇮🇳',
    gradient: 'from-emerald-400 to-lime-500',
  },
  {
    title: 'Be the Change',
    message: 'Habits spread—your action nudges neighbors to care too.',
    emoji: '✨',
    gradient: 'from-sky-400 to-blue-600',
  },
  {
    title: 'Clean Neighborhood',
    message: 'Local fixes beat distant complaints—pin the spot clearly.',
    emoji: '🏘️',
    gradient: 'from-violet-400 to-indigo-600',
  },
  {
    title: 'Swachh Bharat Champion',
    message: 'Champions show up with photos, not just opinions.',
    emoji: '🏆',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Clean Today, Bright Tomorrow',
    message: 'Small timely reports prevent bigger sanitation issues.',
    emoji: '🌤️',
    gradient: 'from-cyan-400 to-teal-600',
  },
  {
    title: 'Together We Clean',
    message: 'Municipal teams move faster when citizens coordinate.',
    emoji: '🤝',
    gradient: 'from-fuchsia-400 to-rose-500',
  },
]

function shareWhatsApp(title: string, message: string) {
  const text = `${title} — ${message} (via Click to Clean)`
  const url = `https://wa.me/?text=${encodeURIComponent(text)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

export default function Greetings() {
  return (
    <div className="space-y-5 pb-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Greetings</h1>
        <p className="mt-1 text-sm text-slate-600">Share awareness with people you trust.</p>
      </header>

      <div className="grid gap-3">
        {cards.map((c, i) => (
          <motion.article
            key={c.title}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className={`glass-panel overflow-hidden rounded-[24px] bg-gradient-to-br ${c.gradient} p-4 text-white shadow-lg`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-3xl" aria-hidden>
                  {c.emoji}
                </p>
                <h2 className="mt-2 text-lg font-bold">{c.title}</h2>
                <p className="mt-2 text-sm text-white/95">{c.message}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => shareWhatsApp(c.title, c.message)}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-sm font-bold text-slate-900 shadow-md"
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Share on WhatsApp
            </button>
          </motion.article>
        ))}
      </div>

      <section className="glass-panel rounded-[24px] p-4">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Sharing tips</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          <li>Share with neighborhood groups during peak hours for visibility.</li>
          <li>Pair the message with a photo from your own street when possible.</li>
          <li>Invite friends to report responsibly—quality over quantity.</li>
        </ul>
      </section>
    </div>
  )
}
