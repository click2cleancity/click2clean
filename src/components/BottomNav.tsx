import { Camera, Home, MessageCircle, Ticket, Trophy } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'

export function BottomNav() {
  const loc = useLocation()
  const hide =
    loc.pathname.startsWith('/report') ||
    loc.pathname.startsWith('/success') ||
    loc.pathname === '/splash' ||
    loc.pathname === '/language' ||
    loc.pathname === '/onboarding' ||
    loc.pathname === '/phone' ||
    loc.pathname === '/otp'

  if (hide) return null

  const activeReport = loc.pathname.startsWith('/report')

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      aria-label="Primary"
    >
      <div className="glass-panel-strong pointer-events-auto relative flex w-full max-w-md items-end justify-between gap-1 rounded-[28px] px-2 py-2 pl-3 pr-3 shadow-lg">
        <NavItem to="/" end icon={Home} label="Home" />
        <NavItem to="/issues" icon={Ticket} label="Issues" />

        <div className="flex w-14 shrink-0 flex-col items-center justify-end pb-0.5">
          <NavLink
            to="/report"
            className="absolute -top-8 left-1/2 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-700 text-white shadow-xl ring-4 ring-white/90"
            aria-label="Report issue with photo"
          >
            {activeReport ? (
              <motion.span
                className="absolute inset-0 rounded-full bg-white/25"
                animate={{ scale: [1, 1.06, 1], opacity: [0.5, 0.85, 0.5] }}
                transition={{ repeat: Infinity, duration: 2.2 }}
              />
            ) : null}
            <Camera className="relative h-7 w-7" aria-hidden />
          </NavLink>
          <span className="text-[10px] font-semibold leading-none text-slate-500">Report</span>
        </div>

        <NavItem to="/greetings" icon={MessageCircle} label="Greetings" />
        <NavItem to="/earn" icon={Trophy} label="Earn" />
      </div>
    </nav>
  )
}

function NavItem({
  to,
  end,
  icon: Icon,
  label,
}: {
  to: string
  end?: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
}) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        [
          'flex min-h-[52px] min-w-0 flex-1 flex-col items-center justify-end gap-0.5 rounded-2xl py-1 text-[10px] font-semibold transition-colors',
          isActive ? 'text-blue-700' : 'text-slate-500',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              'flex h-9 w-full max-w-[52px] items-center justify-center rounded-2xl transition-colors',
              isActive ? 'bg-slate-900 text-white' : 'bg-transparent',
            ].join(' ')}
          >
            <Icon className="h-5 w-5" aria-hidden />
          </span>
          <span className="truncate leading-none">{label}</span>
          <span
            className={['h-0.5 w-6 rounded-full', isActive ? 'bg-blue-600' : 'opacity-0'].join(' ')}
            aria-hidden
          />
        </>
      )}
    </NavLink>
  )
}
