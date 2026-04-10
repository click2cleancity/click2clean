import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { challenges, redeemOptions } from '../data/mock'
import { getPoints } from '../lib/storage'

export default function Earn() {
  const points = getPoints()
  const nextTier = 500
  const progress = Math.min(1, points / nextTier)

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel-strong rounded-[28px] p-5"
      >
        <p className="text-sm font-semibold text-slate-500">Your balance</p>
        <p className="mt-1 text-4xl font-black tracking-tight text-slate-900">{points} pts</p>
        <div className="mt-4">
          <div className="flex justify-between text-xs font-semibold text-slate-600">
            <span>Progress to next perk</span>
            <span>
              {points}/{nextTier}
            </span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-lime-400"
              initial={{ width: 0 }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Active challenges</h2>
        <div className="space-y-2">
          {challenges.map((c) => (
            <div key={c.title} className="glass-panel rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-900">{c.title}</p>
                  <p className="text-sm text-slate-600">Reward: {c.reward} pts</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900">
                  Active
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${c.progress * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold text-slate-900">Rewards store</h2>
        <div className="space-y-4">
          {redeemOptions.map((group) => (
            <div key={group.category} className="glass-panel rounded-[24px] p-4">
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{group.category}</h3>
              <ul className="mt-3 space-y-2">
                {group.items.map((item) => {
                  const affordable = points >= item.points
                  return (
                    <li
                      key={item.name}
                      className={[
                        'flex items-center justify-between gap-3 rounded-2xl px-3 py-3',
                        affordable ? 'bg-lime-50 ring-1 ring-lime-200/80' : 'bg-white/60 ring-1 ring-slate-200/80',
                      ].join(' ')}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900">{item.name}</p>
                        <p className="text-sm text-slate-600">
                          {item.points} pts · {item.discount}
                        </p>
                      </div>
                      {affordable ? (
                        <span className="shrink-0 rounded-full bg-lime-500 px-3 py-1 text-xs font-bold text-white">
                          Redeem
                        </span>
                      ) : (
                        <span className="shrink-0 text-xs font-bold text-slate-500">Need more</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <Link
        to="/report"
        className="flex w-full items-center justify-center rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-lg"
      >
        Report issues to earn more
      </Link>
    </div>
  )
}
