import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { BookOpen } from 'lucide-react'
import { educateArticles } from '../data/mock'

export default function Educate() {
  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Educate</h1>
        <p className="mt-1 text-sm text-slate-600">Short reads to make your reports more effective.</p>
      </header>

      <div className="space-y-3">
        {educateArticles.map((a, i) => (
          <motion.article
            key={a.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="glass-panel rounded-[24px] p-4"
          >
            <div className="flex gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <BookOpen className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-lg font-bold text-slate-900">{a.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">{a.summary}</p>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      <Link
        to="/report"
        className="mt-2 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-lime-500 py-3.5 text-base font-semibold text-white shadow-md"
      >
        Apply this while reporting
      </Link>
    </div>
  )
}
